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

import React, { useState } from 'react';
import {
    getStreamingSessions,
    destroyStreamingSession,
    StreamItem,
    StreamingResponse,
} from '../service/Endpoints';
import './SessionManagement.css'

const SessionManagement: React.FC = () => {
    const [streamItems, setStreamItems] = useState<StreamItem[]>([]);
    const sessionService = process.env.SESSION_SERVICE_URL;

    const _getSessions = async () => {
        const response = await getStreamingSessions(sessionService);
        const data = response.data as StreamingResponse;
        setStreamItems(data.items);  // Store the session items in state
    };

    const _destroySession = async (id: string) => {
        await destroyStreamingSession(sessionService, id);  // Call the destroy function
        _getSessions();  // Refresh the sessions after deletion
    };

    const _destroyAllSessions = async () => {
        for (const item of streamItems) {
            await destroyStreamingSession(sessionService, item.id);
        }
        _getSessions();  // Refresh the list after deleting all sessions
    };

    return (

        <div id="sessionManagement">
            <strong>SESSION MANAGEMENT</strong>
            <br></br>
            <button onClick={_getSessions} style={{ fontSize: '12px' }}>Get Sessions</button>

            {streamItems.length > 0 && (
                <>
                    <ul>
                        {streamItems.map((item) => (
                            <li key={item.id}>
                                {item.id}
                                <button
                                    onClick={() => _destroySession(item.id)}
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={_destroyAllSessions}
                    >
                        Delete All Sessions
                    </button>
                </>
            )}
        </div>
    );
};

export default SessionManagement;
