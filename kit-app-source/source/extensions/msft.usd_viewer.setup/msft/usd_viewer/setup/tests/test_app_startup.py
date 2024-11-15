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

import json
import time
from typing import Tuple

import carb.settings
import omni.kit.app
from omni.kit.test import AsyncTestCase


class TestAppStartup(AsyncTestCase):
    def app_startup_time(self, test_id: str) -> float:
        """Get startup time - send to nvdf"""
        test_start_time = time.monotonic()
        startup_time = omni.kit.app.get_app().get_time_since_start_s()
        test_result = {"startup_time_s": startup_time}
        print(f"App Startup time: {startup_time}")
        return startup_time

    def app_startup_warning_count(self, test_id: str) -> Tuple[int, int]:
        """Get the count of warnings during startup - send to nvdf"""
        test_start_time = time.monotonic()
        warning_count = 0
        error_count = 0
        log_file_path = carb.settings.get_settings().get("/log/file")
        with open(log_file_path, "r") as file:
            for line in file:
                if "[Warning]" in line:
                    warning_count += 1
                elif "[Error]" in line:
                    error_count += 1

        test_result = {"startup_warning_count": warning_count, "startup_error_count": error_count}
        print(f"App Startup Warning count: {warning_count}")
        print(f"App Startup Error count: {error_count}")
        return warning_count, error_count

    async def test_l1_app_startup_time(self):
        """Get startup time - send to nvdf"""
        for _ in range(60):
            await omni.kit.app.get_app().next_update_async()

        self.app_startup_time(self.id())
        self.assertTrue(True)

    async def test_l1_app_startup_warning_count(self):
        """Get the count of warnings during startup - send to nvdf"""
        for _ in range(60):
            await omni.kit.app.get_app().next_update_async()

        self.app_startup_warning_count(self.id())
        self.assertTrue(True)

    async def test_l1_app_startup_fsd_enabled(self):
        """Check if Fabric Scene Delegate is enabled at startup"""

        fsd_enabled: bool = carb.settings.get_settings().get("/app/useFabricSceneDelegate")
        self.assertTrue(fsd_enabled)
