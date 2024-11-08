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
import React, { useState, useEffect } from 'react';
import {
    getStreamingSessions,
    destroyStreamingSession,
    StreamItem,
    StreamingResponse,
} from '../service/Endpoints';

const Controls: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [streamItems, setStreamItems] = useState<StreamItem[]>([]);
    const sessionService = `https://ov-streaming.iai-contoso.com/`;

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'm') {
                setIsVisible((prev) => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

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

    if (!isVisible) return null;

    return (
        <div style={{ marginBottom: '1px', fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
            <strong>SESSION MANAGEMENT</strong>
            <button onClick={_getSessions} style={{ fontSize: '12px' }}>Get Sessions</button>

            {/* List of sessions */}
            {streamItems.length > 0 && (
                <>
                    <ul>
                        {streamItems.map((item) => (
                            <li key={item.id} style={{ marginBottom: '5px' }}>
                                {item.id}
                                <button
                                    onClick={() => _destroySession(item.id)}
                                    style={{ marginLeft: '10px', fontSize: '12px' }}
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* Delete All Sessions Button */}
                    <button
                        onClick={_destroyAllSessions}
                        style={{ marginTop: '10px', fontSize: '12px' }}
                    >
                        Delete All Sessions
                    </button>
                </>
            )}
        </div>
    );
};

export default Controls;
