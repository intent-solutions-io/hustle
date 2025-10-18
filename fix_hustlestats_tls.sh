#!/bin/bash
set -euo pipefail

PROJECT_ID=hustleapp-production
REGION=us-central1
SERVICE=hustle-app
DOMAIN=hustlestats.io
IP_NAME=hustlestats-global-ip
CERT_NAME=hustlestats-cert
DNS_AUTH_NAME=hustlestats-dns-auth
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

echo ""
echo "== Enable APIs (idempotent) =="
gcloud services enable compute.googleapis.com run.googleapis.com certificatemanager.googleapis.com networkservices.googleapis.com

echo ""
echo "== Cloud Run sanity =="
gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)'
gcloud run services add-iam-policy-binding "$SERVICE" --region "$REGION" --member="allUsers" --role="roles/run.invoker" || true

echo ""
echo "== Global IP and DNS =="
if ! gcloud compute addresses describe "$IP_NAME" --global --format='value(address)' 2>/dev/null; then
  gcloud compute addresses create "$IP_NAME" --global
fi
IP_ADDR="$(gcloud compute addresses describe "$IP_NAME" --global --format='value(address)')"
echo "LB_IP: $IP_ADDR"
echo "DNS A: $(dig +short A $DOMAIN)"
echo "DNS AAAA: $(dig +short AAAA $DOMAIN)"

echo ""
echo "== DNS Authorization for Certificate Manager =="
if ! gcloud certificate-manager dns-authorizations describe "$DNS_AUTH_NAME" >/dev/null 2>&1; then
  gcloud certificate-manager dns-authorizations create "$DNS_AUTH_NAME" --domain="$DOMAIN"
fi

echo "DNS Authorization record:"
gcloud certificate-manager dns-authorizations describe "$DNS_AUTH_NAME" --format='value(dnsResourceRecord.data,dnsResourceRecord.name,dnsResourceRecord.type)'
echo ""
echo "⚠️  You must create this DNS CNAME record for certificate validation:"
gcloud certificate-manager dns-authorizations describe "$DNS_AUTH_NAME" --format='table(dnsResourceRecord.name,dnsResourceRecord.type,dnsResourceRecord.data)'

echo ""
echo "== Certificate Manager cert =="
if ! gcloud certificate-manager certificates describe "$CERT_NAME" >/dev/null 2>&1; then
  gcloud certificate-manager certificates create "$CERT_NAME" \
    --domains="$DOMAIN" \
    --dns-authorizations="$DNS_AUTH_NAME"
fi

for i in {1..60}; do
  S=$(gcloud certificate-manager certificates describe "$CERT_NAME" --format='value(managed.state)')
  echo "CERT STATE: $S"
  [ "$S" = "ACTIVE" ] && break
  sleep 10
done

echo ""
echo "== Serverless NEG / Backend / URL map =="
if ! gcloud compute network-endpoint-groups describe "$NEG_NAME" --region "$REGION" >/dev/null 2>&1; then
  gcloud compute network-endpoint-groups create "$NEG_NAME" \
    --region="$REGION" \
    --network-endpoint-type=serverless \
    --cloud-run-service="$SERVICE" \
    --cloud-run-region="$REGION"
fi

if ! gcloud compute backend-services describe "$BS_NAME" --global >/dev/null 2>&1; then
  gcloud compute backend-services create "$BS_NAME" \
    --global \
    --load-balancing-scheme=EXTERNAL_MANAGED \
    --protocol=HTTP
fi

gcloud compute backend-services add-backend "$BS_NAME" \
  --global \
  --network-endpoint-group="$NEG_NAME" \
  --network-endpoint-group-region="$REGION" 2>/dev/null || echo "Backend already added"

if ! gcloud compute url-maps describe "$URLMAP_NAME" --global >/dev/null 2>&1; then
  gcloud compute url-maps create "$URLMAP_NAME" --default-service="$BS_NAME" --global
fi
gcloud compute url-maps set-default-service "$URLMAP_NAME" --default-service="$BS_NAME" --global

echo ""
echo "== HTTPS proxy + certificate map =="
if ! gcloud certificate-manager maps describe "$CM_MAP" >/dev/null 2>&1; then
  gcloud certificate-manager maps create "$CM_MAP"
fi

if ! gcloud certificate-manager map-entries describe "${CERT_NAME}-entry" --map="$CM_MAP" >/dev/null 2>&1; then
  gcloud certificate-manager map-entries create "${CERT_NAME}-entry" \
    --map="$CM_MAP" \
    --hostname="$DOMAIN" \
    --certificates="$CERT_NAME"
fi

if ! gcloud compute target-https-proxies describe "$PROXY_NAME" --global >/dev/null 2>&1; then
  gcloud compute target-https-proxies create "$PROXY_NAME" \
    --url-map="$URLMAP_NAME" \
    --global \
    --certificate-manager-map="$CM_MAP"
else
  gcloud compute target-https-proxies update "$PROXY_NAME" \
    --global \
    --certificate-manager-map="$CM_MAP"
fi

echo ""
echo "== Forwarding rule 443 =="
if ! gcloud compute forwarding-rules describe "$FR_NAME" --global >/dev/null 2>&1; then
  gcloud compute forwarding-rules create "$FR_NAME" \
    --global \
    --load-balancing-scheme=EXTERNAL_MANAGED \
    --target-https-proxy="$PROXY_NAME" \
    --address="$IP_ADDR" \
    --ports=443
fi

echo ""
echo "== Verify =="
gcloud compute forwarding-rules list --global --format='table(name,IPAddress,PORT_RANGE,TARGET)'
gcloud compute target-https-proxies list --format='table(name,certificateManagerMap,urlMap)'
gcloud compute url-maps validate "$URLMAP_NAME" --global
echo ""
echo "DNS A now: $(dig +short A $DOMAIN)"
echo ""
echo "Certificate status:"
gcloud certificate-manager certificates describe "$CERT_NAME" --format='table(name,managed.state,managed.provisioningIssue.reason)'
echo ""
echo "TLS cert quick check (may fail until DNS and cert are active):"
timeout 15 openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates || echo "TLS connection failed or timed out (expected if cert not yet active)"
echo ""
echo "HTTP probe (may fail until DNS and cert are active):"
curl -Iv https://"$DOMAIN"/ 2>&1 | sed -n '1,20p' || echo "HTTP request failed (expected if cert not yet active)"
