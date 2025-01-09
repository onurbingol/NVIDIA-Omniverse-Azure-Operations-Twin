# Automation

## General Notes

The automation was all developed using Bash shell scripts on Ubuntu Linux. Porting to PowerShell in order to run on Windows should be easy however as the bulk of the work is done REST APIs.

## Configuration
Create a copy of [`exports.sh.template`](./scripts/exports.sh.template) named `exports.sh` in the [`scripts`](./scripts) folder. Then update all of the values as necessary for your environment. This file will be used throughout the deployment process. 

## Automation for Deployment of Back-end Azure Components

### Prerequisites

A number of tools are required in order to complete the installation and configuration. The primary ones include:

1. [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/) (Be sure to upgrade to the latest version via `az upgrade` -- at least 2.64.0)
2. [Certbot](https://certbot.eff.org/)
3. [OpenSSL](https://www.openssl.org/) (Probably included in your Linux distro)

All of the automation was developed and tested in Ubuntu 24.04.01 running in [WSL](https://learn.microsoft.com/en-us/windows/wsl/about). There is nothing in the automation that specifically *requires* Linux, but running directly under Windows will likely require some modifications to commands, strings, etc.

### Deplyoment steps

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
    ./certificates/create-and-upload-certificates.sh $DOMAINS $EMAIL $KEYVAULT_NAME
    ```

4. Deploy Application Gateway, APIM, AKS. This step will take a while (up to 45 minutes) since APIM takes a long time to deploy.

    ```bash
    az deployment group create --resource-group $RESOURCE_GROUP_NAME --template-file ./bicep/step-2.bicep --parameters ./bicep/parameters/contoso/step-2.json
    ```
## Automation for Deployment and configuration of Kubernetes Components

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

./scripts/install-k8s-components.sh
```

The `install-k8s-components.sh` will perform all of the kubectl and helm steps necessary to install and configure the back-end services. 

## Automation for Build and Deployment of the Kit-App

### Prerequistes 

1. [Python/pip](https://www.python.org/downloads/) This is a big pre-req for a pretty small task. It's just used to update a toml config file. 
2. [Docker](https://www.docker.com/)
3. [git lfs](https://git-lfs.github.com/)
4. [npm/npx](https://www.npmjs.com/)

### Steps

Run the [`build-and-deploy-kit-app.sh`](./scripts/build-and-deploy-kit-app.sh) script. It will pull the source code from the kit-app-template repository, update configuration files, build the kit app, dockerize it, and push it to the Azure Container Registry created as part of the Bicep deployment. 

## Automation for build and deploy of front-end components

### Prerequisites 

1. [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/)
2. [jq](https://jqlang.github.io/jq/)
3. [Node.js](https://nodejs.org/)
4. [npm/npx](https://www.npmjs.com/)
5. [Static Web Apps CLI](https://azure.github.io/static-web-apps-cli/)

### Steps

Run the [`build-and-deploy-web-app.sh`](./scripts/build-and-deploy-web-app.sh) script. It will create and configure an Entra ID App Registration and then build and deploy the web app to the Static Web App created as part of the Bicep deployment. 