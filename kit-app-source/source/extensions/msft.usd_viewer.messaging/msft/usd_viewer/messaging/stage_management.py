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
import typing

from pxr import UsdGeom, Usd

import carb
import carb.dictionary
import carb.events
import carb.settings
import carb.tokens
import omni.client.utils
import omni.ext
import omni.usd
import omni.kit.app
import omni.kit.livestream.messaging as messaging
from omni.kit.viewport.utility import get_active_viewport_camera_string

DATA_ATTRIBUTE_NAME = "asset_id"

class StageManager:
    """This class manages the stage and its related events."""
    def __init__(self):
        # Feature: Maintain selection of a dummy Prim in stage selection at all times
        # to enable selection groups to be rendered.
        self._dummy_prim_feature_on: bool = True
        self._dummy_prim_path: str = ''
        self._is_selecting_dummy_prim: bool = False

        # Internal messaging state
        self._is_external_update: bool = False
        self._camera_attrs = {}
        self._subscriptions = []

        # -- register outgoing events/messages
        outgoing = [
            # notify when user selects something in the viewport.
            "stageSelectionChanged",
            # response to request for children of a prim
            "getChildrenResponse",
            # response to request for primitive being pick-able.
            "makePrimsPickableResponse",
            # response to the request to reset camera attributes
            "resetStageResponse",
        ]

        for o in outgoing:
            messaging.register_event_type_to_send(o)

        # -- register incoming events/messages
        incoming = {
            # request to get children of a prim
            'getChildrenRequest': self._on_get_children,
            # request to select a prim
            'selectPrimsRequest': self._on_select_prims,
            # request to make primitives pick-able
            'makePrimsPickable': self._on_make_pickable,
            # request to make primitives pick-able
            'resetStage': self._on_reset_camera,
        }

        for event_type, handler in incoming.items():
            self._subscriptions.append(
                omni.kit.app.get_app().get_message_bus_event_stream().
                create_subscription_to_pop(handler, name=event_type)
            )

        # -- subscribe to stage events
        event_stream = omni.usd.get_context().get_stage_event_stream()
        self._subscriptions.append(
            event_stream.create_subscription_to_pop(self._on_stage_event)
        )


    def get_children(self, prim_path, filters=None, recursiveDepth=0):
        """
        Collect any children of the given `prim_path`, potentially filtered by `filters`
        """
        stage = omni.usd.get_context().get_stage()
        prim = stage.GetPrimAtPath(prim_path)
        if not prim:
            return []

        filter_types = {
            "USDGeom": UsdGeom.Mesh,
            "mesh": UsdGeom.Mesh,
            "xform": UsdGeom.Xform,
            "scope": UsdGeom.Scope,
        }

        children = []
        for child in prim.GetChildren():
            # If a child doesn't pass any filter, we skip it.
            if filters is not None:
                if not any(child.IsA(filter_types[filt]) for filt in filters if filt in filter_types):
                    continue

            child_name = child.GetName()
            child_path = str(prim.GetPath())
            # Skipping over cameras
            if child_name.startswith('OmniverseKit_'):
                continue
            # Also skipping rendering primitives.
            if prim_path == '/' and child_name == 'Render':
                continue
            child_path = child_path if child_path != '/' else ''
            info = {"name": child_name, "path": f'{child_path}/{child_name}'}

            # We return an empty list here to indicate that children are
            # available, but the current app does not support pagination,
            # so we use this to lazy load the stage tree.
            if child.GetChildren():
                if recursiveDepth > 0:
                    info["children"] = self.get_children(prim_path=info['path'], filters=filters, recursiveDepth=recursiveDepth-1)
                else:
                    info["children"] = []

            children.append(info)

        return children


    def _on_get_children(self, event: carb.events.IEvent) -> None:
        """
        Handler for the `getChildrenRequest` event
        Collects a filtered collection of a given primitives children.
        """
        if event.type == carb.events.type_from_string("getChildrenRequest"):
            carb.log_info("Received message to return list of a prim\'s children")
            message_bus = omni.kit.app.get_app().get_message_bus_event_stream()
            event_type = carb.events.type_from_string("getChildrenResponse")
            children = self.get_children(
                prim_path=event.payload["prim_path"],
                filters=event.payload["filters"]
            )
            payload = {
                "prim_path": event.payload["prim_path"],
                "children": children
            }
            message_bus.dispatch(event_type, payload=payload)
            message_bus.pump()


    def _on_select_prims(self, event: carb.events.IEvent) -> None:
        """
        Handler for `selectPrimsRequest` event.

        Selects the given primitives.
        """
        if event.type == carb.events.type_from_string("selectPrimsRequest"):
            prims_to_select = []
            if "paths" in event.payload:
                new_selection = list(event.payload["paths"])
                carb.log_info(f"Received message to select '{new_selection}'")

                stage = omni.usd.get_context().get_stage()
                for prim in stage.Traverse():
                    # Check if the prim has the specified attribute
                    if prim.HasAttribute(DATA_ATTRIBUTE_NAME):
                        # Get the attribute object
                        attribute = prim.GetAttribute(DATA_ATTRIBUTE_NAME)

                        # Get the current value of the attribute
                        attribute_value = attribute.Get()

                        # Check if the value matches the desired value
                        if attribute_value in new_selection:
                            new_selection.remove(attribute_value)
                            prims_to_select.append(prim.GetPath().pathString)
                    if len(new_selection) == 0:
                        break

            if self._dummy_prim_feature_on:
                if not self._dummy_prim_path:
                    carb.log_info("Client requested to change the selection. Creating dummy prim")
                    self._dummy_prim_path = self._create_dummy_prim()
                if not self._dummy_prim_path in prims_to_select:
                    carb.log_info("Client requested to change the selection. Adding dummy prim to selection.")
                    prims_to_select.append(self._dummy_prim_path)

            # Flagging this as an external event because it
            # was initiated by the client.
            self._is_external_update = True
            carb.log_info(f"Changing selection per client request {prims_to_select}.")
            sel = omni.usd.get_context().get_selection()
            sel.clear_selected_prim_paths()
            sel.set_selected_prim_paths(prims_to_select, True)


    def _on_stage_event(self, event):
        """
        Hanles all stage related events.

        `omni.usd.StageEventType.SELECTION_CHANGED`:
            Informs the StreamerApp that the selection has changed.
        `omni.usd.StageEventType.ASSETS_LOADED`:
            Informs the StreamerApp that a stage has finished loading
            its assets.
        `omni.usd.StageEventType.OPENED`:
            On stage opened, we collect some of the camera properties
            to allow for them to be reset.
        """
        if event.type == int(omni.usd.StageEventType.SELECTION_CHANGED):
            # Skip event handling if the dummy is being selected.
            if self._dummy_prim_feature_on and self._is_selecting_dummy_prim:
                carb.log_info('omni.usd.StageEventType.SELECTION_CHANGED triggered but skipping evaluation because dummy is being selected.')
                return
            # If the selection changed came from an external event,
            # we don't need to let the streaming client know because it
            # initiated the change and is already aware.
            if self._is_external_update:
                carb.log_info('omni.usd.StageEventType.SELECTION_CHANGED triggered but skipping evaluation because the selection was triggered by client.')
                self._is_external_update = False
            else:
                carb.log_info('omni.usd.StageEventType.SELECTION_CHANGED triggered. Evaluating what selection to notify client about')
                message_bus = omni.kit.app.get_app().get_message_bus_event_stream()
                event_type = carb.events.type_from_string("stageSelectionChanged")

                stage = omni.usd.get_context().get_stage()
                context = omni.usd.get_context()
                selection = context.get_selection().get_selected_prim_paths()

                def getSelectablePath(path) -> typing.Union[str, None]:
                    """
                    Return a path of a prim that has a given attribute name. Could be a parent of the given path.
                    """
                    prim = stage.GetPrimAtPath(path)
                    if prim.HasAttribute(DATA_ATTRIBUTE_NAME):
                        return path
                    path = path[:path.rfind('/')]
                    if path:
                        return getSelectablePath(path)
                    return None

                # Get prim paths for prims that has a given attribute name.
                new_selection = []
                for o in selection:
                    path = getSelectablePath(o)
                    if path is not None:
                        new_selection.append(path)

                # Remove duplicate paths.
                new_selection = list(set(new_selection))

                # Ensure dummy is selected and notify client of nothing being selected.
                if self._dummy_prim_feature_on:
                    if len(new_selection) == 0 and len(selection) == 0:
                        carb.log_info('No selection found. Notifying client that nothing is selected.')
                        payload = {"prims": []}
                        message_bus.dispatch(event_type, payload=payload)
                        message_bus.pump()
                        carb.log_info('No selection found. Selecting dummy.')
                        self._select_dummy_prim()
                        return

                # Change the selection and allow new selection event to re-trigger this handler.
                if selection != new_selection:
                    carb.log_info('Selecting filtered prim paths and allowing selection event to re-trigger selection handler.')
                    sel = context.get_selection()
                    sel.clear_selected_prim_paths()
                    carb.log_info(f"Changing selection: {new_selection}.")
                    sel.set_selected_prim_paths(new_selection, True)
                    return

                # Create a list of fabric ids since that is what the client manages selection by.
                selected_asset_ids = []
                for o in new_selection:
                    prim = stage.GetPrimAtPath(o)
                    attribute = prim.GetAttribute(DATA_ATTRIBUTE_NAME)
                    selected_asset_ids.append(attribute.Get())

                # Notify client about selection change
                carb.log_info(f"Selection changed: Sending selected {DATA_ATTRIBUTE_NAME}s to client: {selected_asset_ids}")
                payload = {"prims": selected_asset_ids}
                message_bus.dispatch(event_type, payload=payload)
                message_bus.pump()
                carb.log_info(f"Selection changed: Path to USD prims currently selected = {omni.usd.get_context().get_selection().get_selected_prim_paths()}")

                # Maintain a selection of dummy.
                if self._dummy_prim_feature_on:
                    self._select_dummy_prim()
                    return

            return

        if event.type == int(omni.usd.StageEventType.OPENED):
            if self._dummy_prim_feature_on:
                carb.log_info("A stage has opened. Resetting dummy prim path.")
                self._dummy_prim_path = ''
            stage = omni.usd.get_context().get_stage()
            stage_url = stage.GetRootLayer().identifier if stage else ''

            if stage_url:
                # Set the entire stage to not be pick-able.
                context = omni.usd.get_context()
                context.set_pickable("/", False)
                # Clear before using, so that we're sure the data is only
                # from the new stage.
                self._camera_attrs.clear()
                # Capture the active camera's camera data, used to reset
                # the scene to a known good state.
                if (prim := context.get_stage().GetPrimAtPath(get_active_viewport_camera_string())):
                    for attr in prim.GetAttributes():
                        self._camera_attrs[attr.GetName()] = attr.Get()
            return

        if event.type == int(omni.usd.StageEventType.ASSETS_LOADED):
            # Get children in stage
            children = self.get_children(
                prim_path="/World",
                filters=["USDGeom", "scope", "xform"],
                recursiveDepth=5
            )

            # Reset the stage to not be pick-able.
            context = omni.usd.get_context()
            context.set_pickable("/", False)

            stage = omni.usd.get_context().get_stage()

            def set_pickable(info, force_true=False):
                # Set prims with DATA_ATTRIBUTE_NAME attribute to be pick-able.
                # Also set children to be pick-able if its parent has DATA_ATTRIBUTE_NAME attribute
                prim = stage.GetPrimAtPath(child['path'])
                if prim.HasAttribute(DATA_ATTRIBUTE_NAME) or force_true:
                    context.set_pickable(child['path'], True)
                    if 'children' in info.keys():
                        for o in info['children']:
                            set_pickable(info=o, force_true=True)
                else:
                    if 'children' in info.keys():
                        for o in info['children']:
                            set_pickable(info=o, force_true=force_true)

            # Set prims with DATA_ATTRIBUTE_NAME attribute to be pick-able.
            stage = omni.usd.get_context().get_stage()
            for child in children:
                set_pickable(info=child)

            # Create a dummy prim and select it
            if self._dummy_prim_feature_on:
                carb.log_info('Assets have loaded. Creating a dummy prim.')
                self._dummy_prim_path = self._create_dummy_prim()
                self._select_dummy_prim()
            return


    def _on_reset_camera(self, event: carb.events.IEvent):
        """
        Handler for `resetStage` event.

        Resets the camera back to values collected when the stage was opened.
        A success message is sent if all attributes are succesfully reset, and error message is set otherwise.
        """
        if event.type == carb.events.type_from_string("resetStage"):
            context = omni.usd.get_context()
            stage = context.get_stage()
            try:
                # Reset the camera.
                # The camera lives on the session layer, which has a higher
                # opinion than the root stage. So we need to explicitly target
                # the session layer when resetting the camera's attributes.
                camera_prim = context.get_stage().GetPrimAtPath(
                    get_active_viewport_camera_string()
                )
                edit_context = Usd.EditContext(
                    stage, Usd.EditTarget(stage.GetSessionLayer())
                )
                with edit_context:
                    for name, value in self._camera_attrs.items():
                        attr = camera_prim.GetAttribute(name)
                        attr.Set(value)
            except Exception as e:
                payload = {"result": "error", "error": str(e)}
            else:
                payload = {"result": "success", "error": ""}
            message_bus = omni.kit.app.get_app().get_message_bus_event_stream()
            event_type = carb.events.type_from_string("resetStageResponse")
            message_bus.dispatch(event_type, payload=payload)
            message_bus.pump()


    def _on_make_pickable(self, event: carb.events.IEvent):
        """
        Handler for `makePrimsPickable` event.

        Enables viewport selection for the provided primitives.
        Sends 'makePrimsPickableResponse' back to streamer with
        current success status.
        """
        if event.type == carb.events.type_from_string("makePrimsPickable"):
            message_bus = omni.kit.app.get_app().get_message_bus_event_stream()
            event_type = carb.events.type_from_string(
                "makePrimsPickableResponse"
            )
            # Reset the stage to not be pick-able.
            context = omni.usd.get_context()
            context.set_pickable("/", False)
            # Set the provided paths to be pick-able.
            try:
                paths = event.payload['paths'] or []
                for path in paths:
                    context.set_pickable(path, True)
            except Exception as e:
                payload = {"result": "error", "error": str(e)}
            else:
                payload = {"result": "success", "error": ""}
            message_bus.dispatch(event_type, payload=payload)
            message_bus.pump()


    def _create_dummy_prim(self) -> str:
        """
        Create a Scope USD Prim in the Session Layer.
        :return: str (USD Prim path of dummy prim)
        """
        carb.log_info('Creating a dummy prim and making it pick-able.')
        context = omni.usd.get_context()
        stage = context.get_stage()
        with Usd.EditContext(stage, stage.GetSessionLayer()):
            scope = UsdGeom.Scope.Define(stage, '/dummy')
            prim = scope.GetPrim()
            context.set_pickable(prim.GetPath().pathString, False)
            return prim.GetPath().pathString


    def _select_dummy_prim(self) -> None:
        """
        Indicate that the dummy prim is being selected and select it.
        Delay indication of it being selected so that selection event
        handlers can trigger while it is being indicated as selected.
        :return:
        """
        # Skip if something is already selected
        context = omni.usd.get_context()
        selection = context.get_selection().get_selected_prim_paths()
        if not self._dummy_prim_path:
            self._dummy_prim_path = self._create_dummy_prim()
        if self._dummy_prim_path in selection:
            carb.log_info('Dummy prim verified as being selected.')
            return
        carb.log_info('Adding dummy prim to selection.')
        self._is_selecting_dummy_prim = True
        selection.append(self._dummy_prim_path)
        sel = omni.usd.get_context().get_selection()
        sel.clear_selected_prim_paths()
        carb.log_info(f"Changing selection: {selection}.")
        sel.set_selected_prim_paths(selection, True)
        async def reset():
            await omni.kit.app.get_app().next_update_async()
            carb.log_info('setting self._is_selecting_dummy_prim to False')
            self._is_selecting_dummy_prim = False
        asyncio.ensure_future(reset())


    def on_shutdown(self):
        """This is called every time the extension is deactivated. It is used
        to clean up the extension state."""
        # Reseting the state.
        self._subscriptions.clear()
        self._is_external_update = False
        self._camera_attrs.clear()
        self._dummy_prim_path = ''
        self._is_selecting_dummy_prim = False
