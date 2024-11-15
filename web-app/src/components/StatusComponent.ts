/*
 * SPDX-FileCopyrightText: Copyright (c) 2024 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

import React, {useEffect} from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '../state/store';

import {AppStreamer} from '@nvidia/omniverse-webrtc-streaming-library';

const StatusComponent: React.FC = () => {
    const assetId = useSelector((state: RootState) => state.status.assetId);
    const assetStatus = useSelector((state: RootState) => state.status.assetStatus);
    const kitState = useSelector((state: RootState) => state.appStream.kitState);

    // React to changes in the server state
    useEffect(() => {
        if (kitState !== 'responsive')
            return;

        const message = {
            event_type: "setStatusRequest",
            payload: {
                asset_id: assetId,
                asset_status: assetStatus
            }
        };
        AppStreamer.sendMessage(JSON.stringify(message));

    }, [assetId, assetStatus]);

    return null;
};

export default StatusComponent;
