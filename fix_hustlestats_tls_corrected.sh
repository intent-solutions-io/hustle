#!/bin/bash
set -euo pipefail

# CORRECTED PROJECT AND SERVICE NAMES
PROJECT_ID=hustleapp-production  # NOT hustle-production
REGION=us-central1
SERVICE=hustle-app              # NOT hustle-frontend
DOMAIN=hustlestats.io
IP_NAME=hustlestats-global-ip
CERT_NAME=hustlestats-cert
NEG_NAME=hustle-neg
BS_NAME=hustle-backend
URLMAP_NAME=hustle-urlmap
PROXY_NAME=hustle-https-proxy
FR_NAME=hustle-https-fr
CM_MAP="${CERT_NAME}-map"

echo "== ENV =="
gcloud config set project "$PROJECT_ID"
gcloud auth list
gcloud config get-value core/account
gcloud config get-value core/project

echo "== Enable APIs (idempotent) =="
gcloud services enable compute.googleapis.com run.googleapis.com certificatemanager.googleapis.com networkservices.googleapis.com

echo "== Cloud Run sanity =="
gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)'
gcloud run services add-iam-policy-binding "$SERVICE" --region "$REGION" --member="allUsers" --role="roles/run.invoker" || true

echo "== Global IP and DNS =="
gcloud compute addresses describe "$IP_NAME" --global --format='value(address)' 2>/dev/null || gcloud compute addresses create "$IP_NAME" --global >/dev/null
IP_ADDR="$(gcloud compute addresses describe "$IP_NAME" --global --format='value(address)')"
echo "LB_IP: $IP_ADDR"
echo "DNS A: $(dig +short A $DOMAIN)"
echo "DNS AAAA: $(dig +short AAAA $DOMAIN)"

echo "== Certificate Manager cert =="
gcloud certificate-manager certificates describe "$CERT_NAME" >/dev/null 2>&1 || \
gcloud certificate-manager certificates create "$CERT_NAME" --domains="$DOMAIN"
for i in {1..30}; do
  S=$(gcloud certificate-manager certificates describe "$CERT_NAME" --format='value(managed.state)' 2>/dev/null || echo "UNKNOWN")
  echo "CERT STATUS: $S"
  [ "$S" = "ACTIVE" ] && break
  sleep 10
done

echo "== Serverless NEG / Backend / URL map =="
gcloud compute network-endpoint-groups describe "$NEG_NAME" --region "$REGION" >/dev/null 2>&1 || \
gcloud compute network-endpoint-groups create "$NEG_NAME" --region="$REGION" --network-endpoint-type=serverless --cloud-run-service="$SERVICE"

gcloud compute backend-services describe "$BS_NAME" --global >/dev/null 2>&1 || \
gcloud compute backend-services create "$BS_NAME" --global --load-balancing-scheme=EXTERNAL_MANAGED --protocol=HTTP

gcloud compute backend-services add-backend "$BS_NAME" --global --network-endpoint-group="$NEG_NAME" --network-endpoint-group-region="$REGION" || true

gcloud compute url-maps describe "$URLMAP_NAME" --global >/dev/null 2>&1 || \
gcloud compute url-maps create "$URLMAP_NAME" --default-service="$BS_NAME" --global
gcloud compute url-maps set-default-service "$URLMAP_NAME" --default-service="$BS_NAME" --global

echo "== HTTPS proxy + certificate map =="
gcloud certificate-manager maps describe "$CM_MAP" >/dev/null 2>&1 || gcloud certificate-manager maps create "$CM_MAP"
gcloud certificate-manager maps entries describe "${CERT_NAME}-entry" --map="$CM_MAP" >/dev/null 2>&1 || \
gcloud certificate-manager maps entries create "${CERT_NAME}-entry" --map="$CM_MAP" --hostname="$DOMAIN" --certificates="$CERT_NAME"

gcloud compute target-https-proxies describe "$PROXY_NAME" --global >/dev/null 2>&1 || \
gcloud compute target-https-proxies create "$PROXY_NAME" --url-map="$URLMAP_NAME" --global
gcloud compute target-https-proxies update "$PROXY_NAME" --global --certificate-manager-certificates="$CM_MAP"

echo "== Forwarding rule 443 =="
gcloud compute forwarding-rules describe "$FR_NAME" --global >/dev/null 2>&1 || \
gcloud compute forwarding-rules create "$FR_NAME" --global --load-balancing-scheme=EXTERNAL_MANAGED --target-https-proxy="$PROXY_NAME" --address="$IP_ADDR" --ports=443

echo "== Verify =="
gcloud compute forwarding-rules list --global --format='table(name,IPAddress,PORT_RANGE,TARGET)'
gcloud compute target-https-proxies list --format='table(name,sslCertificates,urlMap)'
gcloud compute url-maps validate "$URLMAP_NAME" --global
echo "DNS A now: $(dig +short A $DOMAIN)"
echo "TLS cert quick check:"
timeout 15 openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates
echo "HTTP probe:"
curl -Iv https://"$DOMAIN"/ 2>&1 | sed -n '1,20p'
