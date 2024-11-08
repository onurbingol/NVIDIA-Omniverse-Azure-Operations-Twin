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
                    <img src ={logo} />
                </a>
              
                
                <AuthenticatedTemplate>
                    <div className="collapse navbar-collapse justify-content-end">
                    <a className="navbar-jumpstart" href="/">
                    <img src ={jumpstart_logo} />
                </a>

                        <Button variant="warning" onClick={handleLogoutRedirect}>
                            Sign out
                        </Button>
                    </div>
                </AuthenticatedTemplate>
                <UnauthenticatedTemplate>
                    <div className="collapse navbar-collapse justify-content-end">
                    <a className="navbar-jumpstart" href="/">
                    <img src ={jumpstart_logo} />
                </a>

                        <Button onClick={handleLoginRedirect}>Sign in</Button>
                    </div>
                </UnauthenticatedTemplate>
            </Navbar>
        </>
    );
};