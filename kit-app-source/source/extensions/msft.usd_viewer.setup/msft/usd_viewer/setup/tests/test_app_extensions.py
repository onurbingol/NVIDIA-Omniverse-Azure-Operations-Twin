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

import omni.kit.app
from omni.kit.test import AsyncTestCase


class TestUSDViewerExtensions(AsyncTestCase):
    # NOTE: Function pulled to remove dependency from omni.kit.core.tests
    def _validate_extensions_load(self):
        failures = []
        manager = omni.kit.app.get_app().get_extension_manager()
        for ext in manager.get_extensions():
            ext_id = ext["id"]
            ext_name = ext["name"]
            info = manager.get_extension_dict(ext_id)

            enabled = ext.get("enabled", False)
            if not enabled:
                continue

            failed = info.get("state/failed", False)
            if failed:
                failures.append(ext_name)

        if len(failures) == 0:
            print("\n[success] All extensions loaded successfully!\n")
        else:
            print("")
            print(f"[error] Found {len(failures)} extensions that could not load:")
            for count, ext in enumerate(failures):
                print(f"  {count+1}: {ext}")
            print("")
        return len(failures)

    async def test_l1_extensions_load(self):
        """Loop all enabled extensions to see if they loaded correctly"""
        self.assertEqual(self._validate_extensions_load(), 0)
