/*
SPDX-FileCopyrightText: Copyright (c) 2024 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
SPDX-License-Identifier: MIT

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

import React from 'react';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { Navbar, Button } from 'react-bootstrap';
import { loginRequest } from './authConfig';
import logo from './assets/contoso_logo.png'; // Tell webpack this JS file uses this image
import jumpstart_logo from './assets/jumpstart_logo.png'; // Tell webpack this JS file uses this image

export const NavigationBar: React.FC = () => {
    const { instance } = useMsal();

    const handleLoginRedirect = (): void => {
        instance.loginRedirect(loginRequest).catch((error) => console.log(error));
    };

    const handleLogoutRedirect = (): void => {
        instance.logoutRedirect().catch((error) => console.log(error));
    };

    return (
        <>
            <Navbar className="navbarStyle">
                <a className="navbar-brand" href="/">
                    <img src={logo} />
                </a>

                <AuthenticatedTemplate>
                    <div className="collapse navbar-collapse justify-content-end">
                        <a className="navbar-jumpstart" href="/">
                            <img src={jumpstart_logo} />
                        </a>

                        <Button variant="warning" onClick={handleLogoutRedirect}>
                            Sign out
                        </Button>
                    </div>
                </AuthenticatedTemplate>
                <UnauthenticatedTemplate>
                    <div className="collapse navbar-collapse justify-content-end">
                        <a className="navbar-jumpstart" target='_blank' href="https://github.com/microsoft/NVIDIA-Omniverse-Azure-Operations-Twin">
                            <img src={jumpstart_logo} />
                        </a>

                        <Button onClick={handleLoginRedirect}>Sign in</Button>
                    </div>
                </UnauthenticatedTemplate>
            </Navbar>
        </>
    );
};