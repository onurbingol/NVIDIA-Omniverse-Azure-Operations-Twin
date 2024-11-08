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

const Controls: React.FC = () => {
    const dispatch: AppDispatch = useDispatch();
    const [isVisible, setIsVisible] = useState(true);

    // Select values from Redux state
    const sessionService = useSelector((state: RootState) => state.service.sessionService);
    const server = useSelector((state: RootState) => state.appStream.server);
    const assetIds = useSelector((state: RootState) => state.selection.assetIds);

    // Initialize local state with Redux values
    const [serverValue, setServerValue] = useState<string>(server);
    const [addressValue, setAddressValue] = useState<string>(sessionService.address);

    // Update local state when Redux state changes
    useEffect(() => {
        setServerValue(server);
    }, [server]);

    useEffect(() => {
        setAddressValue(sessionService.address);
    }, [sessionService]);

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

    const handleSetService = () => {
        dispatch(setURL(`/app/samples/stage02.usd`)); // Setting URL to load as container starts.
        dispatch(setService({ address: addressValue, desiredState: 'connected' }));
    };

    const handleEndService = () => {
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
        if (sessionService.address && sessionService.desiredState == 'connected') {
            dispatch(setURL('/app/samples/stage01.usd'));
        }
        else {
            dispatch(setURL('./samples/stage01.usd'));
        }
    };

    const handleSetSample02URL = () => {
        if (sessionService.address && sessionService.desiredState == 'connected') {
            dispatch(setURL('/app/samples/stage02.usd'));
        }
        else {
            dispatch(setURL('./samples/stage02.usd'));
        }
    };

    const handleSetSASTokenURL = () => {
        const path = 'https://stovusd.blob.core.windows.net/private/scn_houston_facility_3/scn_houston_facility.usd';            // For example: https://abc.blob.core.windows.net/my_storage/my_file.usda
        const sasToken = 'sp=r&st=2024-11-08T15:17:47Z&se=2024-11-08T23:17:47Z&spr=https&sv=2022-11-02&sr=c&sig=9Vr%2FySxwge5UDkQ1CV1KdJ2Zc9RPJPqZ1qsS5%2FF3gZY%3D';        // Provide a valid SAS Token here
        const hostName = 'stovusd.blob.core.windows.net';        // For example: abc.blob.core.windows.net
        const containerName = 'private';   // For example: my_storage
        const url = `${path}?sasToken=${sasToken}&hostName=${hostName}&containerName=${containerName}`;
        dispatch(setURL(url));
    };

    const handleSetSelection = (assetId: string) => {
        let updatedSelection;

        if (assetIds.includes(assetId)) {
            updatedSelection = assetIds.filter(id => id !== assetId);
        } else {
            updatedSelection = [...assetIds, assetId];
        }
        dispatch(setSelection(updatedSelection));
    };

    const handleSetStatus = (assetId: string, assetStatus: 'nominal' | 'warning' | 'fault') => {
        dispatch(setStatus({ assetId: assetId, assetStatus: assetStatus }));
    };

    if (!isVisible) return null;

    return (
        <div style={{ marginBottom: '1px', fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
            <strong>DEBUG CONTROLS</strong>

            {/* Service Section */}
            <div style={{display: 'flex', alignItems: 'center', gap: '1px'}}>
                <div style={{flex: '0 0 80px'}}>Service</div>
                <div style={{flex: 1, display: 'flex', gap: '1px'}}>
                    <input
                        type="text"
                        placeholder="Enter Service Address"
                        value={addressValue}
                        onChange={(e) => setAddressValue(e.target.value)}
                        style={{flex: 1, fontSize: '12px'}}
                    />
                    <button onClick={handleSetService} style={{fontSize: '12px'}}>Start Service</button>
                    <button onClick={handleEndService} style={{fontSize: '12px'}}>End Service</button>
                </div>
            </div>

            {/* Server Section */}
            <div style={{display: 'flex', alignItems: 'center', gap: '1px', marginTop: '2px'}}>
                <div style={{flex: '0 0 80px'}}>Server</div>
                <div style={{flex: 1, display: 'flex', gap: '1px'}}>
                    <input
                        type="text"
                        placeholder="Enter Server URL"
                        value={serverValue}
                        onChange={(e) => setServerValue(e.target.value)}
                        style={{ flex: 2, fontSize: '12px' }}
                    />
                    <button onClick={handleSetServer} style={{ fontSize: '12px' }}>Start Local Server</button>
                    <button onClick={handleEndServer} style={{ fontSize: '12px' }}>Stop Local Server</button>
                </div>
            </div>

            {/* Asset Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1px', marginTop: '2px' }}>
                <div style={{ flex: '0 0 80px' }}>Assets</div>
                <div style={{ flex: 1, display: 'flex', gap: '1px' }}>
                    <button onClick={handleSetSample01URL} style={{ fontSize: '12px' }}>Set Asset 1 URL</button>
                    <button onClick={handleSetSample02URL} style={{ fontSize: '12px' }}>Set Asset 2 URL</button>
                    <button onClick={handleSetSASTokenURL} style={{ fontSize: '12px' }}>Set SAS Asset URL</button>
                </div>
            </div>

            {/* Selection Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1px', marginTop: '2px' }}>
                <div style={{ flex: '0 0 80px' }}>Selection</div>
                <div style={{ flex: 1, display: 'flex', gap: '1px' }}>
                    <button onClick={() => handleSetSelection('cube')} style={{ fontSize: '12px' }}>cube</button>
                    <button onClick={() => handleSetSelection('sphere')} style={{ fontSize: '12px' }}>sphere</button>
                    <button onClick={() => handleSetSelection('cone')} style={{ fontSize: '12px' }}>cone</button>
                    <button onClick={() => handleSetSelection('group')} style={{ fontSize: '12px' }}>group</button>
                </div>
            </div>

            {/* Asset Status Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1px', marginTop: '2px' }}>
                <div style={{ flex: '0 0 80px' }}>Asset State</div>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1px' }}>
                    <button onClick={() => handleSetStatus('Pump 1', 'nominal')} style={{ fontSize: '12px' }}>Pump 1 nominal</button>
                    <button onClick={() => handleSetStatus('Pump 1', 'warning')} style={{ fontSize: '12px' }}>Pump 1 warning</button>
                    <button onClick={() => handleSetStatus('Pump 1', 'fault')} style={{ fontSize: '12px' }}>Pump 1 fault</button>

                    <button onClick={() => handleSetStatus('Fluid Cell', 'nominal')} style={{ fontSize: '12px' }}>Fluid Cell nominal</button>
                    <button onClick={() => handleSetStatus('Fluid Cell', 'warning')} style={{ fontSize: '12px' }}>Fluid Cell warning</button>
                    <button onClick={() => handleSetStatus('Fluid Cell', 'fault')} style={{ fontSize: '12px' }}>Fluid Cell fault</button>

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
