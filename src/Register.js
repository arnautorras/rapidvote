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
import { isAuthenticated } from './Session';
import getEndpointURL from './requests';
import logo from './voting-box.png'
import './Register.css';

const endpoint = getEndpointURL('/api/users/register');

function registerUser(data) {
    return axios.post(endpoint, data)
        .then(response => [response.data.metadata, true])
        .catch(error => [error.response.data, false]);
}

function Register() {
    const [ email, setEmail ] = useState();
    const [ password, setPassword ] = useState();
    const [ retypePassword, setRetypePassword ] = useState();
    const [ notification, setNotification ] = useState();
    const [ tosAgreed, setTosAgreed ] = useState(false);
    const [ passwordSpec, showPasswordSpec ] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated()) {
            console.log('User already has an account, redirecting...');
            navigate('/dashboard');
        }
    }, [navigate]);

    const handleSubmit = e => {
        e.preventDefault();

        const userData = {
            email: email,
            password: password,
        };
        if (userData.email === '') {
            setNotification('No email was entered.');
            return false;
        }
        if (!Helper.isValidEmail(userData.email)) {
            setNotification('Invalid email address provided.');
            return false;
        }

        if (userData.password === '') {
            setNotification('No password was entered.');
            return false;
        }
        if (!Helper.isValidPassword(userData.password)) {
            setNotification('Password is invalid.');
            showPasswordSpec(true);
            return false;
        }

        if (userData.password !== retypePassword) {
            setNotification('Passwords must match.');
            return false;
        }

        if (!tosAgreed) {
            setNotification('You must agree to the Terms and Conditions.');
            return false;
        }

        registerUser(userData)
            .then(result => {
                const [ response, ok ] = result;
                console.log(response);
                if (!ok) {
                    setNotification(response.message);
                    return;
                }

                navigate('/login');
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
                <title>Rapidvote - Register</title>
            </Helmet>

            <Container>
                <Row id="outer">
                    <Card id="inner">
                        <Card.Body>
                            <h1 id="registerTitle">Register</h1>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="formBasicEmail">
                                    <Form.Label>Email address</Form.Label>
                                    <Form.Control type="email" placeholder="Enter email" 
                                        onChange={e => setEmail(e.target.value)}/>
                                    <Form.Text className="text-muted">
                                        We'll never share your email with anyone else.
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formBasicPassword">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control type="password" placeholder="Password" 
                                        onChange={e => setPassword(e.target.value)}/>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formBasicPasswordConfirm">
                                    <Form.Label>Retype Password</Form.Label>
                                    <Form.Control type="password" placeholder="Retype Password" 
                                        onChange={e => setRetypePassword(e.target.value)}/>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formBasicCheckbox">
                                    <Form.Check type="checkbox" label="I agree to the Terms and Conditions" 
                                        onChange={e => setTosAgreed(!tosAgreed)}/>
                                </Form.Group>
                                { passwordSpec &&
                                <div>
                                    <p>Your password must be at least:</p>
                                    <ul>
                                        <li>8 characters long</li>
                                        <li>Tea</li>
                                        <li>1 uppercase & 1 lowercase character</li>
                                        <li>1 digit</li>
                                        <li>1 special character</li>
                                    </ul> 
                                </div> 
                                }
                                <Button variant="primary" type="submit">
                                    Submit
                                </Button>
                            </Form>

                            <div id="redirectOptions">
                                <div id="loginText">Already have an account?</div>
                                <Button variant="secondary" onClick={() => navigate('/login')}>
                                    Login Here
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

export default Register;
