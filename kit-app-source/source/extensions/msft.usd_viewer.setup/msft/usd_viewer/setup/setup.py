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
from pathlib import Path

import carb.settings
import carb.tokens
import omni.ext
import omni.kit.app
import omni.kit.imgui as _imgui
import omni.kit.viewport
import omni.usd
import omni.client
from omni.kit.mainwindow import get_main_window
from omni.kit.quicklayout import QuickLayout
from omni.kit.viewport.utility import get_viewport_from_window_name


async def _load_layout(layout_file: str):
    """Loads a provided layout file and ensures the viewport is set to FILL."""
    await omni.kit.app.get_app().next_update_async()
    QuickLayout.load_file(layout_file)

    # Set viewport to FILL
    viewport_api = get_viewport_from_window_name("Viewport")
    if viewport_api and hasattr(viewport_api, "fill_frame"):
        viewport_api.fill_frame = True


class SetupExtension(omni.ext.IExt):
    """Extension that sets up the USD Viewer application."""
    def on_startup(self, _ext_id: str):
        """This is called every time the extension is activated. It is used to
        set up the application and load the stage."""
        self._settings = carb.settings.get_settings()

        # get auto load stage name
        stage_url = self._settings.get_as_string("/app/auto_load_usd")

        if stage_url:
            stage_url = carb.tokens.get_tokens_interface().resolve(stage_url)
            asyncio.ensure_future(self.__open_stage(stage_url))

        self._await_layout = asyncio.ensure_future(self._delayed_layout())
        get_main_window().get_main_menu_bar().visible = False


    async def _delayed_layout(self):
        """This function is used to delay the layout loading until the
        application has finished its initial setup."""
        main_menu_bar = get_main_window().get_main_menu_bar()
        main_menu_bar.visible = False
        # few frame delay to allow automatic Layout of window that want their
        # own positions
        app = omni.kit.app.get_app()
        for _ in range(4):
            await app.next_update_async()  # type: ignore

        settings = carb.settings.get_settings()
        # setup the Layout for your app
        token = "${msft.usd_viewer.setup}/layouts"

        layouts_path = carb.tokens.get_tokens_interface().resolve(token)
        layout_name = settings.get("/app/layout/name")
        layout_file = Path(layouts_path).joinpath(f"{layout_name}.json")

        asyncio.ensure_future(_load_layout(f"{layout_file}"))

        # using imgui directly to adjust some color and Variable
        imgui = _imgui.acquire_imgui()

        # DockSplitterSize is the variable that drive the size of the
        # Dock Split connection
        imgui.push_style_var_float(_imgui.StyleVar.DockSplitterSize, 2)

    async def __open_stage(self, url, frame_delay: int = 5):
        """Opens the provided USD stage and loads the render settings."""
        # default 5 frame delay to allow for Layout
        if frame_delay:
            app = omni.kit.app.get_app()
            for _ in range(frame_delay):
                await app.next_update_async()

        client_url: omni.client.Url = omni.client.break_url_reference(url)
        file_url = url

        if client_url.query and 'sasToken=' in client_url.query:
            file_url = url.replace(f"?{client_url.query}", '')
            host_name = client_url.query[client_url.query.find("&hostName="): client_url.query.find("&containerName=")].replace("&hostName=", "")
            container_name = client_url.query[client_url.query.find("&containerName="):].replace("&containerName=", "")
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

        usd_context = omni.usd.get_context()
        await usd_context.open_stage_async(file_url, omni.usd.UsdContextInitialLoadSet.LOAD_ALL)

        # If this was the first Usd data opened, explicitly restore
        # render-settings now as the renderer may not have been fully
        # setup when the stage was opened.
        if not bool(self._settings.get("/app/content/emptyStageOnStart")):
            usd_context.load_render_settings_from_stage(
                usd_context.get_stage_id())


    def on_shutdown(self):
        """This is called every time the extension is deactivated."""
        return
