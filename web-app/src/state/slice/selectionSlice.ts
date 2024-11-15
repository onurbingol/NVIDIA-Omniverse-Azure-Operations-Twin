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

interface SelectionState {
    assetIds: string[];
    selectionChangeOrigin: 'kit' | 'client';
}

const initialState: SelectionState = {
    assetIds: [],
    selectionChangeOrigin: 'client', // default to client
};

const selectionSlice = createSlice({
    name: 'selection',
    initialState,
    reducers: {
        setSelection: (state, action: PayloadAction<string[]>) => {
            state.assetIds = action.payload;
        },
        setSelectionChangeOrigin: (state, action: PayloadAction<'kit' | 'client'>) => {
            state.selectionChangeOrigin = action.payload;
        },
        setSelectionWithOrigin: (
            state,
            action: PayloadAction<{ assetIds: string[]; origin: 'kit' | 'client' }>
        ) => {
            state.selectionChangeOrigin = action.payload.origin;
            state.assetIds = action.payload.assetIds;
        },
    },
});

export const { setSelection } = selectionSlice.actions;
export const { setSelectionChangeOrigin } = selectionSlice.actions;
export const { setSelectionWithOrigin } = selectionSlice.actions;
export default selectionSlice.reducer;
