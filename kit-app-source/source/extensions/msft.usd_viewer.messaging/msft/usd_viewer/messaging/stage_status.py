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
import typing
import asyncio

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

DATA_ATTRIBUTE_NAME = "asset_id"

DEFAULT_SELECTION_OUTLINE_COLOR = carb.Float4([0, 0.635, 0.929, 1])
DEFAULT_SELECTION_SHADE_COLOR = carb.Float4([0, 0, 0, 0])

WARNING_SELECTION_OUTLINE_COLOR = carb.Float4([0.929, 0.110, 0.141, 1])
WARNING_SELECTION_SHADE_COLOR = carb.Float4([1, 0.31, 0, 0.7])
FAULT_SELECTION_OUTLINE_COLOR = carb.Float4([0.929, 0.110, 0.141, 1])
FAULT_SELECTION_SHADE_COLOR = carb.Float4([0.5, 0, 0.0, 0.7])

class StatusManager:
    """This class manages the stage and its related events."""
    def __init__(self):
        self._asset_status_state: typing.Dict[str, str] = {}
        self._selection_groups_invalid: bool = False

        # Internal messaging state
        self._subscriptions = []
        self._default_selection_group: int = -1
        self._warning_selection_group: int = -1
        self._fault_selection_group: int = -1

        # -- register outgoing events/messages
        outgoing = []

        for o in outgoing:
            messaging.register_event_type_to_send(o)

        # -- register incoming events/messages
        incoming = {
            # request to set status of a prim
            'setStatusRequest': self._on_set_status,
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

    def _on_stage_event(self, event):
        if event.type == int(omni.usd.StageEventType.SELECTION_CHANGED):
            asyncio.ensure_future(self._invalidate_selection_groups())
            return

        if event.type == int(omni.usd.StageEventType.OPENING):
            self._asset_status_state = {}
            self._selection_groups_invalid = False
            usd_context = omni.usd.get_context()
            if self._default_selection_group < 0:
                self._default_selection_group = usd_context.register_selection_group()
                usd_context.set_selection_group_outline_color(
                    self._default_selection_group,
                    DEFAULT_SELECTION_OUTLINE_COLOR
                )
                usd_context.set_selection_group_shade_color(
                    self._default_selection_group,
                    DEFAULT_SELECTION_SHADE_COLOR
                )
                # Default selection colors for when assets have not been tagged with a status
                usd_context.set_selection_group_outline_color(
                    255,
                    DEFAULT_SELECTION_OUTLINE_COLOR
                )
                usd_context.set_selection_group_shade_color(
                    255,
                    DEFAULT_SELECTION_SHADE_COLOR
                )
            if self._warning_selection_group < 0:
                self._warning_selection_group = usd_context.register_selection_group()
                carb.log_info(f'self._warning_selection_group: {self._warning_selection_group}')
                usd_context.set_selection_group_outline_color(
                    self._warning_selection_group,
                    WARNING_SELECTION_OUTLINE_COLOR
                )
                usd_context.set_selection_group_shade_color(
                    self._warning_selection_group,
                    WARNING_SELECTION_SHADE_COLOR
                )
            if self._fault_selection_group < 0:
                self._fault_selection_group = usd_context.register_selection_group()
                carb.log_info(f'self._fault_selection_group: {self._fault_selection_group}')
                usd_context.set_selection_group_outline_color(self._fault_selection_group, FAULT_SELECTION_OUTLINE_COLOR)
                usd_context.set_selection_group_shade_color(self._fault_selection_group, FAULT_SELECTION_SHADE_COLOR)

            return

    def _get_prim_path(self, asset_id):
        stage = omni.usd.get_context().get_stage()
        for prim in stage.Traverse():
            # Check if the prim has the specified attribute
            if prim.HasAttribute(DATA_ATTRIBUTE_NAME):
                # Get the attribute object
                attribute = prim.GetAttribute(DATA_ATTRIBUTE_NAME)

                # Get the current value of the attribute
                attribute_value = attribute.Get()

                # Check if the value matches the desired value
                if attribute_value == asset_id:
                    return prim.GetPath().pathString


    def _get_children(self, prim_path, filters=None, recursiveDepth=0):
        """
        Collect any children of the given `prim_path`, potentially filtered by `filters`
        Returns flat list of children
        """
        if not prim_path:
            return []
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
            # Skipping over cameras
            if child_name.startswith('OmniverseKit_'):
                continue
            # Also skipping rendering primitives.
            if prim_path == '/' and child_name == 'Render':
                continue
            children.append(child)

            if child.GetChildren() and recursiveDepth > 0:
                if recursiveDepth > 0:
                    children.extend(self._get_children(prim_path=child.GetPath().pathString, filters=filters, recursiveDepth=recursiveDepth-1))

        return children


    def _on_set_status(self, event: carb.events.IEvent) -> None:
        if event.type == carb.events.type_from_string("setStatusRequest"):
            asset_id: str = event.payload[DATA_ATTRIBUTE_NAME]
            if not asset_id:
                carb.log_warn(f"Empty string for {DATA_ATTRIBUTE_NAME}: skipping asset status change.")
                return

            asset_status: str = event.payload['asset_status']

            prim_path = self._get_prim_path(asset_id=asset_id)

            if not prim_path:
                carb.log_warn(f"No prim path found for {DATA_ATTRIBUTE_NAME}: '{asset_id}'")
                return

            self._asset_status_state[prim_path] = asset_status
            asyncio.ensure_future(self._invalidate_selection_groups())


    async def _invalidate_selection_groups(self):
        if self._selection_groups_invalid:
            return
        self._selection_groups_invalid = True
        await omni.kit.app.get_app().next_update_async()
        self._validate_selection_groups()


    def _validate_selection_groups(self) -> None:
        if not self._selection_groups_invalid:
            return
        self._selection_groups_invalid = False

        if self._fault_selection_group < 0 or self._warning_selection_group < 0:
            return

        for prim_path, status in self._asset_status_state.items():
            self._set_selection_group(prim_path, status)

    def _set_selection_group(self, prim_path: str, status: str) -> None:
        carb.log_info(f"Setting selection group for {prim_path}: {status}")
        usd_context = omni.usd.get_context()
        selected_prim_paths = usd_context.get_selection().get_selected_prim_paths()
        selection_group = self._default_selection_group if prim_path in selected_prim_paths else 0
        if status == 'warning':
            selection_group = self._warning_selection_group
        elif status == 'fault':
            selection_group = self._fault_selection_group

        usd_context.set_selection_group(selection_group, prim_path)

        children = self._get_children(
            prim_path=prim_path,
            filters=["USDGeom", "scope", "xform"],
            recursiveDepth=5
        )

        for child in children:
            carb.log_info(f"Setting selection group for child {child.GetPath().pathString}: {status}")
            usd_context.set_selection_group(selection_group, child.GetPath().pathString)

    def on_shutdown(self):
        """This is called every time the extension is deactivated. It is used
        to clean up the extension state."""
        # Resetting the state.
        self._subscriptions.clear()
        self._asset_status_state = {}
        self._selection_groups_invalid = False
