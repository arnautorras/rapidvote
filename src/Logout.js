import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Container from 'react-bootstrap/Container';
import { useNavigate } from 'react-router-dom';
import { DefaultSession, localSession, isAuthenticated } from './Session';
import getEndpointURL from './requests';

const endpoint = getEndpointURL('/api/users/logout');

function logoutUser() {
    return axios.post(endpoint, {}, { withCredentials: true })
        .then(response => [response.data.metadata, true])
        .catch(error => [error.response.data, false]);
}

function Logout() {
    const [ session, setSession ] = useState(localSession());
    const [ logoutStatus, setLogoutStatus ] = useState('Logging out...');
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated()) {
            logoutUser()
                .then(result => {
                    const [ response, ok ] = result;
                    if (!ok) {
                        setLogoutStatus('Failed to send logout request to server') ;
                        return; 
                    }

                    // Clear localStorage and reset Session
                    localStorage.clear(); 
                    setSession(DefaultSession);

                    // Redirect the user to the homepage after logging out
                    navigate('/');
                });
        } else {
            navigate('/');
        }
    }, [navigate, session]);

    return (
        <Container>
            <p>{logoutStatus}</p>
        </Container>
    );
}

export default Logout;
