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

from .stage_loading import LoadingManager
from .stage_management import StageManager
from .stage_status import StatusManager
import omni.ext


# Any class derived from `omni.ext.IExt` in top level module (defined in
# `python.modules` of `extension.toml`) will be instantiated when extension
# gets enabled and `on_startup(ext_id)` will be called. Later when extension
# gets disabled on_shutdown() is called.
class Extension(omni.ext.IExt):
    """This extension manages creating the loading and stage
    messaging managers"""
    def on_startup(self):
        """This is called every time the extension is activated."""
        # Internal messaging state
        self._loading_manager: LoadingManager = LoadingManager()
        self._stage_manager: StageManager = StageManager()
        self._status_manager: StatusManager = StatusManager()

    def on_shutdown(self):
        """This is called every time the extension is deactivated. It is used to
        clean up the extension state."""
        # Resetting the state.
        if self._loading_manager:
            self._loading_manager.on_shutdown()
            self._loading_manager = None
        if self._stage_manager:
            self._stage_manager.on_shutdown()
            self._stage_manager = None
        if self._status_manager:
            self._status_manager.on_shutdown()
            self._status_manager = None
