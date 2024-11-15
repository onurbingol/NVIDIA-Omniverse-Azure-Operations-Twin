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

import Keycloak from 'keycloak-js';
//@ts-ignore
import Cookies from 'js-cookie';

let keycloak: Keycloak | null = null;
let initPromise: Promise<void> | null = null;

export const initKeycloak = (onAuthenticatedCallback: () => void) => {
  // This is where a user could slot in their own authentication/authorisation solution.
  // The receiving ends expects something like a JWT token
  if (!initPromise) {
    keycloak = new Keycloak({
      url: '',
      realm: 'ovas',
      clientId: ''
    });

    initPromise = keycloak?.init({ onLoad: 'login-required' }).then((authenticated) => {
      if (authenticated) {
        const token = keycloak?.token || '';
        Cookies.set('authToken', token, { secure: true, sameSite: 'Strict', expires: 1 });
        onAuthenticatedCallback();
      } else {
        console.warn('Not authenticated!');
      }
    }).catch((error) => {
      console.error('Keycloak initialization failed:', error);
    });
  }
  return initPromise;
};

export const getAuthToken = () => Cookies.get('authToken');
