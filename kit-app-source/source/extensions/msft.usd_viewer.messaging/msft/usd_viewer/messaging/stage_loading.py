# SPDX-FileCopyrightText: Copyright (c) 2024 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: MIT
#
# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and associated documentation files (the "Software"),
# to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense,
# and/or sell copies of the Software, and to permit persons to whom the
# Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
# THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
# DEALINGS IN THE SOFTWARE.

import asyncio

import carb
import carb.events
import carb.tokens
import omni.ext
import omni.log
import omni.kit.app
import omni.kit.livestream.messaging as messaging
import omni.usd
import omni.client


class LoadingManager:
    """Manages the loading of USD stages and sends messages to the client"""
    def __init__(self):
        self._subscriptions = []  # Holds subscription pointers

        # -- state variables
        # URL of stage load request. Be careful sending urls to client because it may reveal directory paths
        # intended to be secret.
        self._requested_stage_url: str = ""
        self._stage_is_opening: bool = False
        self._send_messages: bool = False # Avoid sending messages until a client has sent a request

        # URL of loaded stage. Be careful sending urls to client because it may reveal directory paths
        # intended to be secret. self._opened_stage_url can be different from self._requested_stage_url since
        # the application can be launched with an argument to load a file.
        self._opened_stage_url: str = ""
        self._stage_has_opened = False
        self._streaming_manager_is_busy: bool = False

        # States if opened stage is opened from storage as in not a
        # new unsaved stage
        self._persisted_stage: bool = False
        self._is_evaluating_loading_status: bool = False

        # -- register outgoing events/messages
        outgoing = [
            "openedStageResult",  # notify when USD Stage has loaded.
            "updateProgressAmount",  # Status bar event denoting progress
            "updateProgressActivity",  # Status bar event denoting activity
            "loadingStateResponse",  # Response to loadingStateQuery
        ]

        for o in outgoing:
            messaging.register_event_type_to_send(o)

        # -- register incoming events/messages
        incoming = {
            'openStageRequest': self._on_open_stage,  # request to open a stage
            "loadingStateQuery": self._on_load_state_query,
            # internal event to capture progress status
            # "omni.kit.window.status_bar@progress": self._on_progress, # Optional capture of asset loading progress
            # internal event to capture progress activity
            # "omni.kit.window.status_bar@activity": self._on_activity, # Optional capture of asset loading activity
        }

        message_bus = omni.kit.app.get_app().get_message_bus_event_stream()
        for event_type, handler in incoming.items():
            self._subscriptions.append(
                message_bus.create_subscription_to_pop(
                    handler, name=event_type
                )
            )

        # -- subscribe to stage events
        event_stream = omni.usd.get_context().get_stage_event_stream()
        self._subscriptions.append(
            event_stream.create_subscription_to_pop(self._on_stage_event)
        )

        # -- subscribe to RTX streaming status events
        RTX_STREAMING_STATUS_EVENT: int = carb.events.type_from_string(
            "omni.rtx.StreamingStatus"
        )
        self._subscriptions.append(
            event_stream.create_subscription_to_pop_by_type(
                RTX_STREAMING_STATUS_EVENT, self._on_rxt_streaming_event
            )
        )

    def _on_load_state_query(self, event: carb.events.IEvent) -> None:
        if event.type == carb.events.type_from_string("loadingStateQuery"):
            self._send_messages = True
            message_bus = omni.kit.app.get_app().get_message_bus_event_stream()
            event_type = carb.events.type_from_string("loadingStateResponse")
            stage_url = self._requested_stage_url if self._requested_stage_url else self._opened_stage_url
            payload = {"loading_state": "idle", "url": stage_url}
            if self._stage_is_opening:
                payload = { "loading_state": "busy", "url": stage_url }
            elif self._stage_has_opened:
                payload = { "loading_state": "idle", "url": stage_url }

            message_bus.dispatch(event_type, payload=payload)


    def _on_open_stage(self, event: carb.events.IEvent) -> None:
        """
        Handler for `openStageRequest` event.

        Starts loading a given URL, will send success if the layer is already
        loaded, and an error on any failure.
        """
        if event.type == carb.events.type_from_string("openStageRequest"):
            self._send_messages = True
            if "url" not in event.payload:
                carb.log_error(
                    f"Unexpected message payload: missing \"url\" key. Payload: '{event.payload}'")
                return

            client_url: omni.client.Url = omni.client.break_url_reference(event.payload["url"])
            self._requested_stage_url = event.payload["url"]

            carb.log_info(f"Received message to load '{self._requested_stage_url}'")

            if client_url.query and 'sasToken=' in client_url.query:
                self._requested_stage_url = self._requested_stage_url.replace(f"?{client_url.query}", '')
                host_name = client_url.query[client_url.query.find("&hostName="): client_url.query.find("&containerName=")].replace("&hostName=", "")
                container_name = client_url.query[client_url.query.find("&containerName="):].replace("&containerName=","")
                sas_token = client_url.query[: client_url.query.find("&hostName=")].replace("sasToken=", "")

                # Set Azure SAS token if all parameters exist
                if host_name and container_name and sas_token:
                    print(f"setting set_azure_sas_token")
                    omni.client.set_azure_sas_token(
                        host_name,
                        container_name,
                        sas_token,
                        False
                    )

            def process_url(url):
                # Using a single leading `.` to signify that the path is
                # relative to the ${app} token's parent directory.
                if url.startswith(("./", ".\\")):
                    return carb.tokens.acquire_tokens_interface().resolve(
                        "${app}/.." + url[1:]
                    )
                return url

            # Check to see if we've already loaded the current stage.
            url = process_url(self._requested_stage_url)

            stage = omni.usd.get_context().get_stage()
            current_stage = stage.GetRootLayer().identifier if stage else ''

            # If we are, we don't need to reload the file, instead we'll just send the success message.
            if omni.client.utils.equal_urls(url, current_stage):
                carb.log_info(f'Client requested to open a stage that is already open: {url}')
                message_bus = omni.kit.app.get_app().get_message_bus_event_stream()
                event_type = carb.events.type_from_string("openedStageResult")
                payload = {"url": self._requested_stage_url, "result": "success", "error": ''}
                message_bus.dispatch(event_type, payload=payload)
                self._reset_state()
                return

            # Asynchronously load the incoming stage
            async def open_stage():
                carb.log_info(f'Opening stage per client request: {url}')
                usd_context = omni.usd.get_context()
                if url:
                    result, error = await usd_context.open_stage_async(url, omni.usd.UsdContextInitialLoadSet.LOAD_ALL)
                else:
                    result, error = await usd_context.new_stage_async()

                message_bus = omni.kit.app.get_app().get_message_bus_event_stream()
                event_type = carb.events.type_from_string("openedStageResult")

                if result is not True:
                    # Send message to client that loading failed.
                    carb.log_warn(f'The file that the client requested failed to load: {url} (error: {error})')
                    payload = {"url": url, "result": "error", "error": error}
                    message_bus.dispatch(event_type, payload=payload)
                    self._reset_state()
                    return

                payload = {"url": url, "result": "success", "error": ''}
                message_bus.dispatch(event_type, payload=payload)

            asyncio.ensure_future(open_stage())

    def _on_stage_event(self, event: carb.events.IEvent) -> None:
        """Manage extension state via the stage event stream.
        When a new stage is open we reload the data model and
        set the state for the UI.

        Args:
            event (carb.events.IEvent): Event type
        """
        if event.type == int(omni.usd.StageEventType.OPENING):
            self._stage_is_opening = True
            payload: dict = event.payload.get_dict()
            if 'val' in payload.keys():
                self._opened_stage_url = payload['val']
            else:
                self._opened_stage_url = ''
            self._persisted_stage = True if self._opened_stage_url else False
            return

        if event.type == int(omni.usd.StageEventType.ASSETS_LOADED):
            # Check that a stage is opening. Assets can load after stage has opened.
            if not self._stage_is_opening:
                return
            self._stage_is_opening = False
            self._stage_has_opened = True

            # Async call to evaluate opened state
            asyncio.ensure_future(self._evaluate_load_status())
            return

    def _on_rxt_streaming_event(self, event: carb.events.IEvent) -> None:
        """
        Notes streaming manager's busy state

        Args:
            event (carb.events.IEvent): Contains payload sender and type -
            https://docs.omniverse.nvidia.com/kit/docs/kit-manual/105.0/carb.events/carb.events.IEvent.html
        """
        self._streaming_manager_is_busy = event.payload['isBusy']

    async def _evaluate_load_status(self):
        """
        If streaming manager is not busy and the stage is loaded from storage,
        notify the client.
        """
        # Only evaluate for stage loaded from storage.
        if not self._persisted_stage:
            return

        if self._is_evaluating_loading_status:
            return
        self._is_evaluating_loading_status = True

        # Wait until all dependencies have loaded by streaming manager
        while self._streaming_manager_is_busy or not self._stage_has_opened:
            await omni.kit.app.get_app().next_update_async()

        for _ in range(2):
            await omni.kit.app.get_app().next_update_async()

        if not self._send_messages:
            return
        # Stage has loaded with all dependencies. Send message to client.
        message_bus = omni.kit.app.get_app().get_message_bus_event_stream()
        event_type = carb.events.type_from_string("openedStageResult")
        url = self._requested_stage_url if self._requested_stage_url  else '[obfuscated]'
        carb.log_info(
            f'Sending message to client that stage has loaded: {url}'
        )
        payload = {"url": url, "result": "success", "error": ''}
        message_bus.dispatch(event_type, payload=payload)

        # reset
        self._is_evaluating_loading_status = False
        self._reset_state()

    def _on_progress(self, event: carb.events.IEvent):
        """
        Handler for `omni.kit.window.status_bar@progress` event.
        This forwards the statusbar progress events to the streaming client.
        """
        # Only notify for stage loaded from storage.
        if not self._persisted_stage:
            return
        if event.type == carb.events.type_from_string(
            "omni.kit.window.status_bar@progress"
        ):
            # print(f'Loading progress: {event.payload.get_dict()}')
            if not self._send_messages:
                return
            message_bus = omni.kit.app.get_app().get_message_bus_event_stream()
            # Send progress message
            carb.log_info('Sending message to client about loading progress.')
            event_type = carb.events.type_from_string("updateProgressAmount")
            # event.payload.get_dict() is used to capture a copy of the
            # incoming event's payload as a python dictionary
            message_bus.dispatch(event_type, payload=event.payload.get_dict())

    def _on_activity(self, event: carb.events.IEvent):
        """
        Handler for `omni.kit.window.status_bar@activity` event.
        This forwards the statusbar activity events to the streaming client.
        """
        # Only notify for stage loaded from storage.
        if not self._persisted_stage:
            return
        if event.type == carb.events.type_from_string(
            "omni.kit.window.status_bar@activity"
        ):
            # print(f'Loading activity: {event.payload.get_dict()}')
            if not self._send_messages:
                return
            carb.log_info('Storing message about loading activity.')
            message_bus = omni.kit.app.get_app().get_message_bus_event_stream()
            # Send activity message
            carb.log_info('Sending message to client about loading activity.')
            event_type = carb.events.type_from_string("updateProgressActivity")
            message_bus.dispatch(event_type, payload=event.payload.get_dict())

    def on_shutdown(self) -> None:
        """
        Clean up subscriptions
        """
        if self._subscriptions:
            self._subscriptions.clear()

    def _reset_state(self):
        """
        Reset the internal state - ready for new stage to be loaded
        """
        stage = omni.usd.get_context().get_stage()
        self._requested_stage_url = ""
        self._opened_stage_url = stage.GetRootLayer().identifier if stage else ""
        self._stage_has_opened = False
        self._streaming_manager_is_busy = False
        self._persisted_stage = False
