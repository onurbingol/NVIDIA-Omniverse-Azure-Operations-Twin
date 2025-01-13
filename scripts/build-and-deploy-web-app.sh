#! /bin/bash
set -euo pipefail # fail on unset parameters, error on any command failure, print each command before executing

SCRIPT_PATH=$(dirname "$(realpath "$0")")
export WEB_APP_PATH=$SCRIPT_PATH/../web-app
source $SCRIPT_PATH/exports.sh

# export SERVICE_ADDRESS="https://appgw.$PUBLIC_DNS_ZONE_NAME/streaming"
export SWA_HOST_NAME="https://$(az staticwebapp show --name $SWA_NAME --output tsv --query defaultHostname)"
echo "SWA_HOST_NAME: $SWA_HOST_NAME"
appInfo=$(az ad app create --display-name $WEB_APP_APP_REGISTRATION_DISPLAY_NAME --required-resource-access @./scripts/entra-app-registration-manifest.json)
export WEB_APP_APP_REGISTRATION_OBJECT_ID=$(echo $appInfo | jq -r .id)
export WEB_APP_APP_REGISTRATION_APP_ID=$(echo $appInfo | jq -r .appId)
echo "WEB_APP_APP_REGISTRATION_OBJECT_ID: $WEB_APP_APP_REGISTRATION_OBJECT_ID, WEB_APP_APP_REGISTRATION_APP_ID: $WEB_APP_APP_REGISTRATION_APP_ID"
az rest --method PATCH --uri https://graph.microsoft.com/v1.0/applications/$WEB_APP_APP_REGISTRATION_OBJECT_ID --headers 'Content-Type=application/json' --body '{"'spa'":{"redirectUris":["'$SWA_HOST_NAME'"]}}'

envsubst < $SCRIPT_PATH/authConfig.tsx.template > $WEB_APP_PATH/src/authConfig.tsx
# envsubst '$SERVICE_ADDRESS' < $SCRIPT_PATH/Controls.tsx.template > $WEB_APP_PATH/src/debug/Controls.tsx
envsubst < $SCRIPT_PATH/swa-cli.config.json.template > $SCRIPT_PATH/swa-cli.config.json

npx swa init --yes
npx swa build --app-location $WEB_APP_PATH --output-location $WEB_APP_PATH/dist
npx swa login --resource-group $RESOURCE_GROUP_NAME --app-name $SWA_NAME
npx swa deploy $WEB_APP_PATH/dist --env production --app-name $SWA_NAME 
