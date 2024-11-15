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

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ServiceState {
    sessionService: {
        address: string;
        desiredState: 'connected' | 'destroyed';
    };
    appId: string;
    version: string;
    profile: string;
    sessionId: string;
    status: number;
}

const initialState: ServiceState = {
    sessionService: {
        address: '',
        desiredState: 'connected'
    },
    appId: 'usd-viewer-msft',
    version: '106.1.0',
    profile: 'azurelb-wss',
    sessionId: '',
    status: 0,
};

const serviceSlice = createSlice({
    name: 'service',
    initialState,
    reducers: {
        setService: (state, action: PayloadAction<{ address: string; desiredState: 'connected' | 'destroyed' }>) => {
            state.sessionService = {
                address: action.payload.address,
                desiredState: action.payload.desiredState
            }
        },
        setSessionId: (state, action: PayloadAction<string>) => {
            state.sessionId = action.payload
        },
        setStatus: (state, action: PayloadAction<number>) => {
            state.status = action.payload
        },
    },
});

export const { setService } = serviceSlice.actions;
export const { setSessionId } = serviceSlice.actions;
export const { setStatus } = serviceSlice.actions;
export default serviceSlice.reducer;
