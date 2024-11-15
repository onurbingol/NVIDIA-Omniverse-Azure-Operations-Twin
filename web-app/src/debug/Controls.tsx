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
import { setService } from '../state/slice/serviceSlice';
import { useDispatch, useSelector } from 'react-redux';
import { setServer } from '../state/slice/appStreamSlice';
import { setSelection } from '../state/slice/selectionSlice';
import { setURL } from '../state/slice/usdStorageSlice';
import { setStatus } from '../state/slice/statusSlice';
import { AppDispatch, RootState } from '../state/store';
import './Controls.css';

const Controls: React.FC = () => {
    const dispatch: AppDispatch = useDispatch();

    const sessionService = useSelector((state: RootState) => state.service.sessionService);
    const server = useSelector((state: RootState) => state.appStream.server);
    const assetIds = useSelector((state: RootState) => state.selection.assetIds);

    const [serverValue, setServerValue] = useState<string>(server);
    const [addressValue, setAddressValue] = useState<string>(sessionService.address);

    useEffect(() => {
        setServerValue(server);
    }, [server]);

    useEffect(() => {
        setAddressValue(sessionService.address);
    }, [sessionService]);

    const handleStartSession = () => {
        dispatch(setURL(`/app/samples/stage02.usd`));
        dispatch(setService({ address: addressValue, desiredState: 'connected' }));
    };

    const handleEndSession = () => {
        dispatch(setService({ address: addressValue, desiredState: 'destroyed' }));
    };

    const handleSetServer = () => {
        dispatch(setServer(serverValue));
    };

    const handleEndServer = () => {
        dispatch(setService({ address: addressValue, desiredState: 'destroyed' }));
        dispatch(setServer(''));
    };

    const handleSetSample01URL = () => {
        if (sessionService.address && sessionService.desiredState === 'connected') {
            dispatch(setURL('https://stovusd.blob.core.windows.net/private/scn_houston_facility_3/scn_houston_facility.usd'));
        } else {
            dispatch(setURL('https://stovusd.blob.core.windows.net/private/scn_houston_facility_3/scn_houston_facility.usd'));
        }
    };

    const handleSetSample02URL = () => {
        if (sessionService.address && sessionService.desiredState === 'connected') {
            dispatch(setURL('/app/samples/stage02.usd'));
        } else {
            dispatch(setURL('./samples/stage02.usd'));
        }
    };

    const handleSetSASTokenURL = () => {
        const path = process.env.USD_PATH;           
        const sasToken = process.env.USD_SAS_TOKEN;           
        const hostName = process.env.USD_HOST_NAME;                  
        const containerName = process.env.USD_CONTAINER_NAME;           
        const url = `${path}?sasToken=${sasToken}&hostName=${hostName}&containerName=${containerName}`;
        dispatch(setURL(url));
    };

    const handleSetSelection = (assetId: string) => {
        const updatedSelection = assetIds.includes(assetId)
            ? assetIds.filter(id => id !== assetId)
            : [...assetIds, assetId];
        dispatch(setSelection(updatedSelection));
    };

    const handleSetStatus = (assetId: string, assetStatus: 'nominal' | 'warning' | 'fault') => {
        dispatch(setStatus({ assetId, assetStatus }));
    };

    return (
        <div id="debugControls">
            <strong>DEBUG CONTROLS</strong>

            <div className="section">
                <div className="section-label">Service</div>
                <div className="section-content">
                    <input
                        type="text"
                        placeholder="Enter Service Address"
                        value={addressValue}
                        onChange={(e) => setAddressValue(e.target.value)}
                    />
                    <button onClick={handleStartSession}>Start Session</button>
                    <button onClick={handleEndSession}>End Session</button>
                </div>
            </div>

            <div className="section">
                <div className="section-label">Server</div>
                <div className="section-content">
                    <input
                        type="text"
                        placeholder="Enter Server URL"
                        value={serverValue}
                        onChange={(e) => setServerValue(e.target.value)}
                    />
                    <button onClick={handleSetServer}>Start Local Server</button>
                    <button onClick={handleEndServer}>Stop Local Server</button>
                </div>
            </div>

            <div className="section">
                <div className="section-label">Assets</div>
                <div className="section-content">
                    <button onClick={handleSetSample01URL}>Set Asset 1 URL</button>
                    <button onClick={handleSetSample02URL}>Set Asset 2 URL</button>
                    <button onClick={handleSetSASTokenURL}>Set Asset SAS URL</button>
                </div>
            </div>

            <div className="section">
                <div className="section-label">Selection</div>
                <div className="section-content">
                    <button onClick={() => handleSetSelection('cube')}>cube</button>
                    <button onClick={() => handleSetSelection('sphere')}>sphere</button>
                    <button onClick={() => handleSetSelection('cone')}>cone</button>
                    <button onClick={() => handleSetSelection('group')}>group</button>
                </div>
            </div>

            <div className="section">
                <div className="section-label">Asset State</div>
                <div className="section-content-grid">
                    <button onClick={() => handleSetStatus('cube', 'nominal')} style={{ fontSize: '12px' }}>cube nominal</button>
                    <button onClick={() => handleSetStatus('cube', 'warning')} style={{ fontSize: '12px' }}>cube warning</button>
                    <button onClick={() => handleSetStatus('cube', 'fault')} style={{ fontSize: '12px' }}>cube fault</button>

                    <button onClick={() => handleSetStatus('sphere', 'nominal')} style={{ fontSize: '12px' }}>sphere nominal</button>
                    <button onClick={() => handleSetStatus('sphere', 'warning')} style={{ fontSize: '12px' }}>sphere warning</button>
                    <button onClick={() => handleSetStatus('sphere', 'fault')} style={{ fontSize: '12px' }}>sphere fault</button>

                    <button onClick={() => handleSetStatus('cone', 'nominal')} style={{ fontSize: '12px' }}>cone nominal</button>
                    <button onClick={() => handleSetStatus('cone', 'warning')} style={{ fontSize: '12px' }}>cone warning</button>
                    <button onClick={() => handleSetStatus('cone', 'fault')} style={{ fontSize: '12px' }}>cone fault</button>

                    <button onClick={() => handleSetStatus('group', 'nominal')} style={{ fontSize: '12px' }}>group nominal</button>
                    <button onClick={() => handleSetStatus('group', 'warning')} style={{ fontSize: '12px' }}>group warning</button>
                    <button onClick={() => handleSetStatus('group', 'fault')} style={{ fontSize: '12px' }}>group fault</button>
                </div>
            </div>
        </div>
    );
};

export default Controls;

