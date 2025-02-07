# Automation

## General Notes

The automation was all developed using Bash shell scripts on Ubuntu Linux. Porting to PowerShell in order to run on Windows should be easy however as the bulk of the work is done via the relevant REST APIs.

## Configuration

Create a copy of [`exports.sh.template`](./scripts/exports.sh.template) named `exports.sh` in the [`scripts`](./scripts) folder. Then update all of the values as necessary for your environment. This file will be used throughout the deployment process.

## Automation for Deployment of Back-end Azure Components

### Prerequisites

A number of tools are required in order to complete the installation and configuration. The primary ones include:

1. [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/) (Be sure to upgrade to the latest version via `az upgrade` -- at least 2.64.0)
2. [Certbot](https://certbot.eff.org/)
3. [OpenSSL](https://www.openssl.org/) (Probably included in your Linux distro)

### Deployment steps

1. Update all of the values in the json files in the ./bicep/paramaters/contoso folder

2. Login to AZ CLI, create resource group and deploy Key Vault, MSIs, and VNet.

    ```bash
    source ./scripts/exports.sh

    az login
    az group create --location $LOCATION --name $RESOURCE_GROUP_NAME
    az deployment group create --resource-group $RESOURCE_GROUP_NAME --template-file ./bicep/step-1.bicep --parameters ./bicep/parameters/contoso/step-1.json
    ```

3. Create certificates and upload to Key Vault

    You can generate your certificates however you please. Howeer, in order to configure Application Gateway and API Management, the certificates need to be uploaded into Key Vault in PKCS 12 format.

    If you have registered a domain and have control of DNS, you can use the "create-and-upload-certificates.sh" script that I have provided which will use [Certbot](https://certbot.eff.org/) to generate free [Let's Encrypt](https://letsencrypt.org/) certificates and upload them to the Key Vault that was created in step 2. This script takes a comma delimited list of FQDNs for which it will create *wildcard certificates.* If your requirements are different, feel free to modify as needed. Note that the script does a manual dns challenge for domain ownership verification. If you are familiar with how to set up certbot plugins, you can easily modify this to automate the verification.

    ```bash
    ./scripts/00-create-and-upload-certificates.sh
    ```

4. Deploy Application Gateway, APIM, AKS. This step will take a while (up to 45 minutes) since APIM takes a long time to deploy.

    ```bash
    az deployment group create --resource-group $RESOURCE_GROUP_NAME --template-file ./bicep/step-2.bicep --parameters ./bicep/parameters/contoso/step-2.json
    ```

## Automation for Deployment and configuration of Kubernetes Components

The `01-install-k8s-components.sh` will perform all of the kubectl and helm steps necessary to install and configure the back-end services.

### Prerequisites

1. [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/)
2. [jq](https://jqlang.github.io/jq/)
3. [Kubectl](https://kubernetes.io/docs/reference/kubectl/)
4. [Kubelogin](https://learn.microsoft.com/en-us/azure/aks/kubelogin-authentication)
5. [Helm](https://helm.sh/)

### Steps

```bash
source ./exports.sh

az login
az aks get-credentials --format azure --resource-group $AKS_RESOURCE_GROUP --name $AKS_CLUSTER_NAME
kubelogin convert-kubeconfig –l azurecli

./scripts/01-install-k8s-components.sh
```

## Automation for Build and Deployment of the Kit-App

> [!IMPORTANT]
> If you run into 403 permission issues downloading charts from NVIDIA Omniverse helm repository:
> - Go to https://catalog.ngc.nvidia.com/orgs/nvidia/teams/omniverse/helm-charts/kit-appstreaming-session
> - Click "Fetch version"
> - Click "Get access"

The [`02-build-and-deploy-kit-app.sh`](./scripts/02-build-and-deploy-kit-app.sh) script will pull the source code from the kit-app-template repository, update configuration files, build the kit app, dockerize it, and push it to the Azure Container Registry created as part of the Bicep deployment.

### Prerequisites

1. [Python/pip](https://www.python.org/downloads/) This is a big pre-req for a pretty small task. It's just used to update a toml config file.
2. [Docker](https://www.docker.com/)
3. [git lfs](https://git-lfs.github.com/)
4. [npm/npx](https://www.npmjs.com/)

### Steps

```bash
./scripts/03-build-and-deploy-kit-app.sh
```

## Automation for build and deploy of front-end components

The [`04-build-and-deploy-web-app.sh`](./scripts/04-build-and-deploy-web-app.sh) will create and configure an Entra ID App Registration and then build and deploy the web app to the Static Web App created as part of the Bicep deployment.

### Prerequisites

1. [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/)
2. [jq](https://jqlang.github.io/jq/)
3. [Node.js](https://nodejs.org/)
4. [npm/npx](https://www.npmjs.com/)
5. [Static Web Apps CLI](https://azure.github.io/static-web-apps-cli/)

### Steps

```bash
./scripts/04-build-and-deploy-web-app.sh
```
