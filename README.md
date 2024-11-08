# Microsoft Ignite Sample Project

This project is designed to be used with the NVIDIA Omniverse kit-app-template. Using the kit-app-template together with the provided
[./kit-app-source/source](./kit-app-source/source) you can create a streaming Kit application that works together with the provided [./web-app](./web-app) client.
If you use the  kit-app-template, you agree you have read the [NVIDIA Software License Agreement](https://www.nvidia.com/en-us/agreements/enterprise-software/nvidia-software-license-agreement/)
(available at https://www.nvidia.com/en-us/agreements/enterprise-software/nvidia-software-license-agreement/) and [Product-Specific Terms for NVIDIA Omniverse](https://www.nvidia.com/en-us/agreements/enterprise-software/product-specific-terms-for-omniverse/)
(available at https://www.nvidia.com/en-us/agreements/enterprise-software/product-specific-terms-for-omniverse/) and agree to their terms.
If you do not have the authority to enter into the License Agreement and/or do not accept the
License Agreement terms and conditions, you should not register to use or use the kit-app-template.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
   - [Kit App Setup](#kit-app-setup)
   - [Web App Setup](#web-app-setup)
   - [Run on Workstation](#run-on-workstation)
   - [Containerize for Deployment](#containerize-for-deployment)
   - [Run Web App Locally Against Omniverse App Streaming Service](#run-web-app-locally-against-omniverse-app-streaming-service)
- [How it Works](#how-it-works)
  - [Starting a Remote Stream](#starting-a-remote-stream)
  - [Opening Files](#opening-files)
  - [Viewport Navigation](#viewport-navigation)
  - [Selection and Status Indication](#selection-and-status-indication)
  - [Ending a Stream](#ending-a-stream)
- [Kit Source Code Overview](#kit-source-code-overview)
- [Web App Code Overview](#web-app-code-overview)

## Overview

This project is part of the [LINK TO JUMP START](LINK TO JUMP START) document.

This repository provides sample code for creating the applications needed for a Omniverse Kit App Streaming solution.
In such a solution, the Kit app is the application that runs on a remote server and the client/web-app is the application
that displays the streamed Kit app.

## Prerequisites

### Kit App

- [kit-app-template](https://github.com/NVIDIA-Omniverse/kit-app-template/blob/main/README.md) using `Kit SDK 106.4` or more recent. Please refer to the kit-app-template project prerequisites as well. The code in [./kit-app-source/source](./kit-app-source/source) was developed to work with `Kit SDK 106.4`.

### Web App

- Node.js installation (https://nodejs.org/en/download).
- Chromium browser.

## Quick Start

### Kit App Setup

1. Clone the [https://github.com/NVIDIA-Omniverse/kit-app-template](https://github.com/NVIDIA-Omniverse/kit-app-template) repo. The following instructions assume an un-modified kit-app-template project.

2. Copy the [./kit-app-source/source](./kit-app-source/source) directory in this project into the root directory of the cloned `kit-app-template`.

3. Enable the `kit-app-template` repo tools to build the source by adding these lines to [premake5.lua](https://github.com/NVIDIA-Omniverse/kit-app-template/blob/main/premake5.lua):

```plaintext
-- Apps: for each app generate batch files and a project based on kit files (e.g. my_name.my_app.kit)
define_app("msft.usd_viewer.kit")
define_app("msft.usd_viewer_streaming.kit")
```

4. Add this line to [kit_args.txt](https://github.com/NVIDIA-Omniverse/kit-app-template/blob/main/tools/containers/kit_args.txt).

```toml
"--/app/auto_load_usd=${USD_PATH}"
```

5. Enable precaching of the Kit app by replacing the `[repo_precache_exts]` section [repo.toml](https://github.com/NVIDIA-Omniverse/kit-app-template/blob/main/repo.toml#L47) with this:

```toml
[repo_precache_exts]
# Apps to run and precache
apps = [
"${root}/source/apps/msft.usd_viewer.kit",
"${root}/source/apps/msft.usd_viewer_streaming.kit",
]
```

6. Refer to [kit-app-template instructions](https://github.com/NVIDIA-Omniverse/kit-app-template/blob/main/README.md#3-build) to build the project. For `kit-app-template` based on Kit SDK 106.4, open a terminal in the root of the project and execute:

```shell
./repo.sh build
```

This completes the setup for the Kit app. You now have a built application that can be launched. Let's continue with the web app.

### Web App Setup

1. Open a terminal in [./web-app](./web-app).

2. Install dependencies:

```bash
npm install
```

If there is an error when running `npm install`:
1. Delete [./web-app/node_modules](./web-app/node_modules) and [./web-app/package-lock.json](./web-app/package-lock.json).
2. Run `npm install` again.

The web app is now ready to be launched.

### Run on Workstation

Pushing a container to the Omniverse App Streaming deployment and testing functionality can be time consuming.
You can easily run the Kit and web app locally for quick iteration.

1. Launch the web app by opening a terminal in [./web-app](./web-app) and run `npm run dev`.
   1. Terminal displays a localhost URL such as [localhost:5173](localhost:5173). Open the URL in a Chromium browser.
   2. Enter `127.0.0.1` in the `Server` field and click `Start Local Server`. The web app is now trying to connect to a Kit app running locally.

<p align="center">
  <img src="web-app/readme-assets/local_streaming.png" width=100% />
</p>

2. Promptly, launch the Kit app by opening a terminal in the root of `kit-app-template` and run `./repo.sh launch`.
   1. When prompted, select the `msft.usd_viewer_streaming.kit` file. 

3. You can now see the Kit app streamed into the web app. The Kit app may be just a black rectangle because we didn't load a file. 
4. Click the `Set Asset 1 URL` or `Set Asset 2 URL` to send a message from the web app to the Kit app with a request to load a file.

Note: You can launch the Kit app with an argument to load a file using `./repo.sh launch -- --/app/auto_load_usd="\${app}/../samples/stage01.usd"`.

Additional information on running solution locally can be found in [https://docs.omniverse.nvidia.com/embedded-web-viewer/latest/create/run-the-solution.html](https://docs.omniverse.nvidia.com/embedded-web-viewer/latest/create/run-the-solution.html) documentation.

### Containerize for Deployment

1. Follow the instructions in above [Kit App Setup](#kit-app-setup) section.
2. For `kit-app-template` based on Kit SDK 106.4, open a terminal in the root of the project and execute:
   1. When prompted, select the `msft.usd_viewer_streaming.kit` file. 

```shell
./repo.sh package --container
```

3. List containers:

```shell
docker image list
```

4. Use [`docker tag`](https://docs.docker.com/reference/cli/docker/image/tag/) and [`docker push`](https://docs.docker.com/reference/cli/docker/image/push/) commands to push the appropriately named container to a registry of your choosing.

### Run Web App Locally Against Omniverse App Streaming Service

1. Launch the web app by opening a terminal in [./web-app](./web-app) and run `npm run dev`.
2. Terminal displays a localhost URL such as [localhost:5173](localhost:5173). Open the URL in a Chromium browser.
3. Enter the URL for the Omniverse App Streaming `Streaming` Service in the `Service` field.
4. Click the `Start Service` button.

Requesting a stream can take some time - especially if a new container needs to be pulled by the service.
Have patience and monitor the browser console for progress. There can be errors while the web app attempts
to connect to a running Kit app container.

## How it Works

The web app provides some developer user interfaces for invoking features. This can be toggled with `CTRL+M`.
To understand the code a developer should use this interface and follow the path of execution.

### Starting a Remote Stream

As mentioned in above [Run Web App Locally Against Omniverse App Streaming Service](#run-web-app-locally-against-omniverse-app-streaming-service),
a session can be started using the `Service` field and `Start Service` button.

Clicking the `Start Service` button executes:

```javascript
dispatch(setURL(`[some URL]`));
dispatch(setService({ address: addressValue, desiredState: 'connected' }));
```

The above does two things. First, it sets the `UsdStorageState.url` state to the given URL. That by itself
does not send a request to the a streamed Kit application because we have not connected yet. Second,
it sets the `ServiceState.sessionService` state and this triggers the `ServiceComponent` to request
a streaming session.

Getting an active streaming session requires a number of steps to happen:

1. Request the service. `ServiceComponent` makes use of the `createStreamingSession` API. The URL mentioned above is passed as an argument for the Kit app to load a stage.
   1. The request causes the remote service to pull and start a container.
2. The web app polls the service using `getStreamingSessionInfo`until it receives information about an active stream.
3. Once the `ServiceComponent` receives information about an active stream it sets the `AppStreamState.remoteStream` state.
4. A change in `AppStreamState.remoteStream` state triggers `AppStreamComponent` to connect to the stream (see usage of `AppStreamer.connect` usage).
5. Connecting to the remotely running container is a series of connection attempts (see usage of `maxReconnects` usage for number of attempts).
6. Once connected the web client will display the streamed application.

### Opening Files

Executing `setURL` updates the `UsdStorageState.url` state and causes the `USDStorageComponent` to send a request to the Kit app for opening a file.

The Kit `msft.usd_viewer.messaging` handles loading of files in `stage_loading.py`.

### Viewport Navigation

The streamed viewport is interactive. Mouse events and camera navigation is automatically sent to the streamed application.

### Selection and Status Indication

A USD Stage contains USD Prims. Each Prim has can be identified by a path. A solution could be created around USD paths but
this creates restraints around USD authoring because paths would not be allowed to change unless the web app is also updated.
Instead, this sample makes use of `asset_ids`. Relevant USD Prims are expected to have an `asset_id` attribute. Selection and
"Status" changes can be communicated about using the `asset_id` instead of Prim paths.

#### Selection
Selection changes in the USD Stage can happen two ways: by selecting something in the viewport or by sending a message to select something.

Viewport selection is automatically handled. The streamed Kit app will send a message to the web app which updates the `SelectionState.assetIds` state.

Likewise, the web app can change the `SelectionState.assetIds` state and cause the `SelectionComponent` to send a message requesting a selection change to the Kit app.

The Kit `msft.usd_viewer.messaging` handles selection changes in `stage_management.py`.

#### Status

Changes in `StatusState.assetId` and `StatusState.assetStatus` causes the `StatusComponent` to send a message to the Kit app to change the status of an asset.

The Kit `msft.usd_viewer.messaging` handles the status in `stage_status.py`.

### Ending a Stream

Clicking the `End Service` button executes:

```javascript
dispatch(setService({ address: addressValue, desiredState: 'destroyed' }));
``` 

This updates the `ServiceState.sessionService` which triggers `AppStreamComponent` to terminate the stream via `AppStreamer.terminate()` 
and the `ServiceComponent` to request the service to destroy the current session via `destroyStreamingSession` API.

## Kit Source Code Overview

### Kit Files

Location: [./kit-app-source/source/apps](./kit-app-source/source/apps).

| File                                                                                        | Description                                                               |
|---------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| [msft.usd_viewer.kit](./kit-app-source/source/apps/msft.usd_viewer.kit)                     | Base application providing an RTX 3D viewport.                            |
| [msft.usd_viewer_streaming.kit](./kit-app-source/source/apps/msft.usd_viewer_streaming.kit) | Extends `msft.usd_viewer.kit` by adding streaming and messaging support.  |


### Extension: msft.usd_viewer.setup

Location: [./kit-app-source/source/extensions/msft.usd_viewer.setup](./kit-app-source/source/extensions/msft.usd_viewer.setup).

| Feature      | Description                                                                                                                                       |
|--------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| Auto loading | Supports application to be launched with `--/app/auto_load_usd` argument. When running within a deployment the container is passed this argument. |
| Sample files | Two small sample USD files are included.                                                                                                          |
| Layout       | Sets up the viewport-only application layout.                                                                                                     |

### Extension: msft.usd_viewer.messaging

Location: [./kit-app-source/source/extensions/msft.usd_viewer.messaging](./kit-app-source/source/extensions/msft.usd_viewer.messaging).

| Feature          | Description                                                                                                         |
|------------------|---------------------------------------------------------------------------------------------------------------------|
| Loading          | Enables a client to request loading a stage.                                                                        |
| Stage Management | Allows changing selection change per request. Informs client of selection changes when user interacts in viewport.  |
| Asset Status     | Enables a client to indicate a `status` for a USD Prim. Makes use of `selection groups` to apply special rendering. |

## Web App Code Overview

### Top Level

| File                                             | Description                                                                         |
|--------------------------------------------------|-------------------------------------------------------------------------------------|
| [./web-app/index.html](./web-app/index.html)     | Top level html. Uses [./web-app/src/main.tsx](./web-app/src/main.tsx)               |
| [./web-app/src/main.tsx](./web-app/src/main.tsx) | Makes use of various components. The critical one is `<App/>` - other are optional. |
| [./web-app/src/App.tsx](./web-app/src/App.tsx)   | Makes use of required components described [below](#components).                    |

### State

Location: [./web-app/src/state](./web-app/src/state).

State is presented using [Redux](https://redux.js.org/). These files presents the state and allow other components to change it.

| File                                                               | Description                                                                                                                                                                                                                                                                                                                                                                                   |
|--------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [store.ts](./web-app/src/state/store.ts)                           | Provides the Redux reducers.                                                                                                                                                                                                                                                                                                                                                                  |
| [appStreamSlice.ts](./web-app/src/state/slice/appStreamSlice.ts)   | `server` state for local streaming.<br/>`remoteServer` for remote stream.<br/>`kitState` indicates the responsiveness of the streamed Kit application.                                                                                                                                                                                                                                        |
| [selectionSlice.ts](./web-app/src/state/slice/selectionSlice.ts)   | `assetIds` state for selected assets.<br/>`selectionChangeOrigin` is used to avoid loops in selection changes.                                                                                                                                                                                                                                                                                |
| [serviceSlice.ts](./web-app/src/state/slice/serviceSlice.ts)       | `sessionService` state for controlling what service to use to and whether to create or destroy a service.<br/>`appId`, `version`, and `profile` needs to be set to match the container to launch when requesting a stream session.<br/>`sessionId` is the identifier of a current session and is provided by service.<br/>`status` is the status code for when polling service for a session. |
| [statusSlice.ts](./web-app/src/state/slice/statusSlice.ts)         | `assetId` is the identifier to change the status for.<br/>`assetStatus` is the status for a given asset to send to the streamed Kit application.                                                                                                                                                                                                                                              |
| [usdStorageSlice.ts](./web-app/src/state/slice/usdStorageSlice.ts) | `url` is the most recently requested asset to load.<br/>`loadingState` indicates current activity.<br/>`loadedURL` is the most recently loaded asset.                                                                                                                                                                                                                                         |

### Components

Location: [./web-app/src/components](./src/components).

The components react to state changes and controls some of the states as well. They provide a streamed Omniverse 3D viewport and manages the communication with it.

| File                                                                      | Description                                                                                                                                                    |
|---------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [AppStreamComponent.tsx](./web-app/src/components/AppStreamComponent.tsx) | Provides a streamed Omniverse 3D viewport.                                                                                                                     |
| [SelectionComponent.ts](./web-app/src/components/SelectionComponent.ts)   | Sends messages to streamed Omniverse 3D viewport to change selection.                                                                                          |
| [ServiceComponent.ts](./web-app/src/components/ServiceComponent.ts)       | Communicates with App Streaming service to create and destroy Omniverse 3D viewport sessions. Supports passing a USD URL to load as part of container startup. |
| [StatusComponent.ts](./web-app/src/components/StatusComponent.ts)         | Sends messages to streamed Omniverse 3D viewport to change asset status.                                                                                       |
| [USDStorageComponent.ts](./web-app/src/components/USDStorageComponent.ts) | Sends messages to streamed Omniverse 3D viewport to load a stage.                                                                                              |

### Service

Location: [./web-app/src/service](./web-app/src/service).

These files provide API for connecting to the Streaming and the Application service. In this implementation, only the Streaming service is used.

| File                                               | Description                                                                              |
|----------------------------------------------------|------------------------------------------------------------------------------------------|
| [EndPoint.tsx](./web-app/src/service/EndPoint.tsx) | Provides the main API for communicating with the service. Other files supports this API. |

### Debug

Location: [./web-app/src/debug](./web-app/src/debug).

The debug code provides sample code for controlling and inspecting the state. This code could be replaced by other code and the solution would still work.

| File                                                                 | Description                                      |
|----------------------------------------------------------------------|--------------------------------------------------|
| [Controls.tsx](./web-app/src/debug/Controls.tsx)                     | User interface elements that modifies the state. |
| [SessionManagement.tsx](./web-app/src/debug/SessionManagement.tsx)   | Supports listing sessions and destroying them.   |
| [State.tsx](./web-app/src/debug/State.tsx)                           | Displays state values.                           |


