# Hustle systemd units (VPS)

Replaces the GCP Cloud Functions schedules (`sendTrialReminders` Pub/Sub
schedule on `hustleapp-production`). Lives on the `intentsolutions` VPS
alongside the hustle Docker stack at `/srv/hustle/`.

## Units

| File | What it does |
|---|---|
| `hustle-trial-reminders.service` | Oneshot: `curl -X POST` to `http://127.0.0.1:8084/api/internal/trial-reminders` with `Authorization: Bearer $HUSTLE_INTERNAL_TOKEN`. The container is published on `127.0.0.1:8084` so the timer reaches it loopback-only. |
| `hustle-trial-reminders.timer` | Fires `OnCalendar=*-*-* 09:00:00 UTC` (daily 09:00 UTC, matching the legacy Cloud Function schedule). `Persistent=true` so missed runs (VPS reboot) catch up. |

## Install (one-time on VPS)

```bash
# 1. Generate the internal-API shared secret.
TOKEN=$(openssl rand -hex 32)
echo "HUSTLE_INTERNAL_TOKEN=$TOKEN" | sudo tee /etc/intentsolutions/hustle-internal.env
sudo chmod 640 /etc/intentsolutions/hustle-internal.env
sudo chown root:adm /etc/intentsolutions/hustle-internal.env

# 2. Wire the same token into the running container's env so the route
#    can verify the bearer.
echo "HUSTLE_INTERNAL_TOKEN=$TOKEN" | sudo tee -a /srv/hustle/.env
sudo chown intentsolutions:intentsolutions /srv/hustle/.env
sudo docker compose -f /srv/hustle/docker-compose.yml restart

# 3. Install the units.
sudo cp /srv/hustle/06-Infrastructure/systemd/hustle-trial-reminders.service /etc/systemd/system/
sudo cp /srv/hustle/06-Infrastructure/systemd/hustle-trial-reminders.timer   /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now hustle-trial-reminders.timer

# 4. Verify.
systemctl list-timers hustle-trial-reminders.timer
systemctl status hustle-trial-reminders.timer
```

## Manual run (smoke / debug)

```bash
sudo systemctl start hustle-trial-reminders.service
journalctl -u hustle-trial-reminders.service -n 50 --no-pager
```

Expected: HTTP 200 from curl + `{"ok":true,"sent":N}` in journal.

## Rotation

If the shared secret needs rotating: regenerate `$TOKEN`, write to both
`/etc/intentsolutions/hustle-internal.env` and `/srv/hustle/.env`,
`docker compose restart` the app, no systemd reload needed (the unit
re-reads `EnvironmentFile=` every fire).
