import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form';
import Helper from './Helper.js';
import { localSession, isAuthenticated } from './Session';
import getEndpointURL from './requests';
import './Login.css';
import logo from './voting-box.png'

const endpoint = getEndpointURL('/api/users/login');

function loginUser(data) {
    return axios.post(endpoint, data, { withCredentials: true })
        .then(response => [response.data.metadata, true])
        .catch(error => [error.response.data, false]);
}

function Login() {
    const [ session, setSession ] = useState(localSession());
    const [ email, setEmail ] = useState();
    const [ password, setPassword ] = useState();
    const [ notification, setNotification ] = useState();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated()) {
            console.log('User is already authenticated, redirecting...');
            navigate('/dashboard');
        }
    }, [navigate]);

    const handleSubmit = e => {
        e.preventDefault();

        const userData = {
            email: email,
            password: password,
        };

        if (!userData.email || userData.email === '') {
            setNotification('No email was entered.');
            return;
        }

        if (!Helper.isValidEmail(userData.email)) {
            setNotification('Invalid email address provided.');
            return;
        }

        if (!userData.password || userData.password === '') {
            setNotification('No password was entered.');
            return;
        }

        loginUser(userData)
            .then(result => {
                const [ response, ok ] = result;
                if (!ok) {
                    setNotification(response.message);
                    return;
                }

                // Put the response data in localStorage as `session`
                localStorage.setItem('session', JSON.stringify(response));

                // Redirect the user to the Homepage 
                setSession(response);
                navigate('/dashboard');
            });
    };

    const ShowNotification = () => (
        <Row id="notificationWrapper" className="justify-content-md-center">
            <Alert id="notification" key="0" variant="warning">
                {notification}
            </Alert>
        </Row>
    );

    return (
        <React.Fragment>
            <Container onClick={() => navigate('/')} id="logo">
                <img
                    alt=""
                    src={logo}
                    width="100"
                    height="100"
                />
            </Container>
            <Helmet>
                <title>Rapidvote - Login</title>
            </Helmet>
            <Container id="out">
                <Row id="outer">
                    <Card id="inner">
                        <Card.Body>
                            <h1 id="loginTitle">Login</h1>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="formBasicEmail">
                                    <Form.Label>Email address</Form.Label>
                                    <Form.Control type="email" placeholder="Enter email" 
                                        onChange={e => setEmail(e.target.value)}/>
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formBasicPassword">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control type="password" placeholder="Password" 
                                        onChange={e => setPassword(e.target.value)}/>
                                </Form.Group>
                                <Button variant="primary" type="submit">
                                    Submit
                                </Button>
                            </Form>

                            <div id="redirectOptions">
                                <div id="registerText">Don't have an account?</div>
                                <Button variant="secondary" onClick={() => navigate('/register')}>
                                    Register Here
                                </Button>
                            </div>

                            { notification && ShowNotification() }
                        </Card.Body>
                    </Card>
                </Row>
            </Container>
        </React.Fragment>
    );
}

export default Login;
