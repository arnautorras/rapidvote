import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Pagination from 'react-bootstrap/Pagination';
import Row from 'react-bootstrap/Row'
import Spinner from 'react-bootstrap/Spinner';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Table from 'react-bootstrap/Table';

import Header from './Header';

import { DefaultSession, localSession, isAuthenticated } from './Session';
import Helper from './Helper.js';
import getEndpointURL from './requests';

import './Dashboard.css';

const pollsEndpoint = getEndpointURL('/api/users/polls');
const resetEmailEndpoint = getEndpointURL('/api/users/reset/email');
const resetPasswordEndpoint = getEndpointURL('/api/users/reset/password');
const deactivateUserEndpoint = getEndpointURL('/api/users/deactivate');

function getUsersPolls() {
    return axios.post(pollsEndpoint, {}, { withCredentials: true })
        .then(response => [response.data.metadata, true])
        .catch(error => [error.response, false]);
}

function resetUserEmail(data) {
    return axios.post(resetEmailEndpoint, data, { withCredentials: true })
        .then(response => [response.data.metadata, true])
        .catch(error => [error.response.data, false]);
}

function resetUserPassword(data) {
    return axios.post(resetPasswordEndpoint, data, { withCredentials: true })
        .then(response => [response.data.metadata, true])
        .catch(error => [error.response.data, false]);
}

function deactivateUser() {
    return axios.post(deactivateUserEndpoint, {}, { withCredentials:true })
        .then(response => [response.data.metadata, true])
        .catch(error => [error.response, false]);
}

function Dashboard() {
    /* Authentication */
    const [ session, setSession ] = useState(localSession());

    /* Polls Tab */
    const [ userPolls, setUserPolls ] = useState([]);
    const [ currentPage, setCurrentPage ] = useState(1);
    const [ filter, setFilter ] = useState();
    const [ loading, setLoading ] = useState(true);

    /* Account Tab */
    const [ email, setEmail ] = useState();
    const [ newEmail, setNewEmail ] = useState();
    const [ password, setPassword ] = useState();
    const [ retypePassword, setRetypePassword ] = useState();
    const [ newPassword, setNewPassword ] = useState();
    const [ showEmailReset, setShowEmailReset] = useState(false);
    const [ showPasswordReset, setShowPasswordReset] = useState(false);
    const [ showDeactivate, setShowDeactivate ] = useState(false);
    const [ passwordSpec, showPasswordSpec ] = useState(false);
    const [ notification, setNotification ] = useState();

    /* Navigation */
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated()) {
            console.log("User is not authenticated, redirecting to home");
            navigate('/');
            return;
        }

        if (userPolls && userPolls.length === 0) {
            console.log("Retrieving polls for user: ", session.userId);
            getUsersPolls()
                .then(result => {
                    const [ response, ok ] = result;
                    console.log("getUsersPolls response:", response);
                    if (!ok) {
                        console.log("Couldn't get user polls: ", response.data.message);
                        if (response.data.metadata.reauthRequired) {
                            navigate('/logout');
                        }
                        return;
                    }

                    console.log(response);

                    if (!response.polls || response.polls.length === 0) {
                        console.log("User does not have any polls.");
                        setLoading(false);
                        return;
                    }

                    const polls = organizePolls(response);
                    setUserPolls(polls);
                    setLoading(false);
                });
        }
    }, [session, navigate, userPolls, filter, setFilter, showEmailReset, showPasswordReset]);

    const ShowNotification = () => {
        if (notification) {
            return (
                <Row id="notificationWrapper" className="justify-content-md-center">
                    <Alert id="notification" key="0" variant={notification.variant} dismissable="true">
                        {notification.message}
                    </Alert>
                </Row>

            );
        }
    };

    const ShowUserPolls = () => {
        const ShowPagination = () => {
            let items = [];
            for (let pageNumber = 1; pageNumber <= userPolls.length; pageNumber++) {
                items.push(
                    <Pagination.Item 
                        key={pageNumber} 
                        active={pageNumber === currentPage}
                        onClick={() => setCurrentPage(pageNumber)}
                    >
                        {pageNumber}
                    </Pagination.Item>
                );
            }
            return <Pagination>{items}</Pagination>;
        };

        const ShowPollsForPage = () => {
            let polls = [];
            userPolls[currentPage - 1]
                .filter(poll => {
                    if (filter && filter.length > 0) {
                        return poll.Name.includes(filter);
                    }
                    return true;
                })
                .forEach((poll, key) => {
                    polls.push(
                        <tr key={key} onClick={e => navigate('/' + poll.PollId)} className="pollTableEntry">
                            <td>{poll.Name}</td>
                            <td>{poll.PollId}</td>
                            <td>{poll.Status ? "Open" : "Closed"}</td>
                            <td>{poll.Expiration}</td>
                        </tr>
                    );
                });
            return polls;
        };

        const ShowLoading = () => {
            return loading 
                ? <Spinner animation="border"/> 
                : <p>You do not have any polls.</p>
        };

        return (
            <Card id="pollsCard">
                <Card.Body>
                    <Card.Title>Your polls:</Card.Title>
                    { (userPolls && userPolls.length > 0) ?
                        <React.Fragment>
                            <Form.Control 
                                type="text" 
                                placeholder="Filter by Name (case-sensitive)" 
                                onChange={e => setFilter(e.target.value)}
                            />
                            <Table striped bordered hover size="sm" id="pollTable">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Poll ID</th>
                                        <th>Status</th>
                                        <th>Expiration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    { ShowPollsForPage() }
                                </tbody>
                            </Table>
                        </React.Fragment>
                        : ShowLoading()
                    }
                    { userPolls && ShowPagination()}
                </Card.Body>
            </Card>
        );
    };

    const ShowUserAccount = () => {
        const resetEmail = e => {
            const userData = {
                email: email,
                password: password,
                newEmail: newEmail,
            };

            if (email === '' || newEmail === ''){
                setNotification({variant: 'warning', message: 'No email was entered.'});
                return false;
            }
            if (password === '') {
                setNotification({variant: 'warning', message: 'No password was entered.'});
                return false;
            }
            if (!Helper.isValidEmail(userData.newEmail)) {
                setNotification({variant: 'warning', message: 'New email is invalid.'});
                return false;
            }

            resetUserEmail(userData)
                .then(result => {
                    const [ response, ok ] = result;
                    console.log(response);
                    if (!ok) {
                        setNotification({variant: 'danger', message: response.message});
                        return;
                    }

                    setNotification({variant: 'success', message: 'Successfully changed email.'});
                    //setShowEmailReset(true);
                    //setShowPasswordReset(false);
                });
        };

        const emailResetModal = () => {
            return (
                <Modal show={showEmailReset} onHide={() => setShowEmailReset(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Reset Email</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <Form>
                            <Form.Group className="mb-3" controlId="formBasicEmail">
                                <Form.Label>Email address</Form.Label>
                                <Form.Control type="email" placeholder="Current email address" 
                                    onChange={e => setEmail(e.target.value)}/>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formBasicPassword">
                                <Form.Label>Password</Form.Label>
                                <Form.Control type="password" placeholder="Password" 
                                    onChange={e => setPassword(e.target.value)}/>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formBasicEmailNew">
                                <Form.Label> New email address</Form.Label>
                                <Form.Control type="email" placeholder="Enter your new email" 
                                    onChange={e => setNewEmail(e.target.value)}/>
                            </Form.Group>
                        </Form>
                        { ShowNotification() }
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="primary" onClick={() => resetEmail()}>Reset Email</Button>
                        <Button variant="secondary" onClick={() => {
                            setShowEmailReset(false);
                            setNotification();
                        }}>Cancel</Button>
                    </Modal.Footer>
                </Modal>
            );
        };

        const resetPassword = e => {
            const userData = {
                password: password,
                newPassword: newPassword
            };

            if (password === '') {
                setNotification({variant: 'warning', message: 'No password was entered.'});
                return false;
            }

            if (userData.retypePassword === '') {
                setNotification({variant: 'warning', message: 'Retype your password to confirm.'});
                return false;
            }

            if (userData.newPassword === '') {
                setNotification({variant: 'warning', message: 'No new password was entered.'});
                return false;
            }

            if (userData.newPassword !== retypePassword) {
                setNotification({variant: 'warning', message: 'Passwords must match.'});
                return false;
            }

            if ( !Helper.isValidPassword( userData.newPassword ) ) {
                setNotification({variant: 'warning', message: 'Invalid password.'});
                showPasswordSpec(true);
                return false;
            }

            resetUserPassword(userData)
                .then(result => {
                    const [ response, ok ] = result;
                    console.log(response);
                    if (!ok) {
                        setNotification(response.message);
                        return;
                    }
                    setNotification({variant: 'success', message: 'Successfully changed password.'});
                });
        };

        const passwordResetModal = () => {
            return (
                <Modal show={showPasswordReset} onHide={() => setShowPasswordReset(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Reset Password</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <Form>
                            <Form.Group className="mb-3" controlId="formBasicPassword">
                                <Form.Label>Password</Form.Label>
                                <Form.Control type="password" placeholder="Password" 
                                    onChange={e => setPassword(e.target.value)}/>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formBasicNewPasswordConfirm">
                                <Form.Label>New Password</Form.Label>
                                <Form.Control type="password" placeholder="Enter your new password" 
                                    onChange={e => setNewPassword(e.target.value)}/>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formBasicPasswordConfirm">
                                <Form.Label>Retype Password</Form.Label>
                                <Form.Control type="password" placeholder="Retype new password" 
                                    onChange={e => setRetypePassword(e.target.value)}/>
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
                        </Form>
                        { ShowNotification() }
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="primary" onClick={() => resetPassword()}>Reset</Button>
                        <Button variant="secondary" onClick={() => {
                            setShowPasswordReset(false);
                            setNotification();
                        }}>Cancel</Button>
                    </Modal.Footer>
                </Modal>
            );
        };

        const deactivateAccount = () => {
            /* TODO: Implement POST request here for account deletion */
            deactivateUser()
                .then(result => {
                    const [ response, ok ] = result;
                    console.log(response);
                    if (!ok) {
                        setNotification(response.message);
                        return;
                    }
                    setNotification({variant: 'success', message: 'User account successfully deactivated'});

                    // Clear localStorage and reset Session
                    localStorage.clear(); 
                    setSession(DefaultSession);
                    navigate('/');
                });
        };

        const deactivateAccountModal = () => {
            return (
                <Modal show={showDeactivate} onHide={() => setShowDeactivate(false)} keyboard={false}>
                    <Modal.Header closeButton>
                        <Modal.Title>Deactivating Account</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        Are you sure you want to deactivate your account?
                        This action is irreversible.
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="danger" onClick={() => deactivateAccount()}>Yes, deactivate</Button>
                        <Button variant="secondary" onClick={() => { 
                            setShowDeactivate(false);
                        }}>Cancel</Button>
                    </Modal.Footer>
                </Modal>
            );
        };

        return (
            <React.Fragment>
                <Card id="accountCard">
                    <Card.Body>
                        <Card.Title>Your account:</Card.Title>
                        <Card.Text>Email: { session.userEmail }</Card.Text>
                        <Container fluid>
                            <Button variant="secondary" onClick={() => setShowEmailReset(true)}>
                                Reset Email
                            </Button>
                            <Button variant="secondary" onClick={() => setShowPasswordReset(true)}>
                                Reset Password
                            </Button>
                            <Button variant="danger" onClick={() => setShowDeactivate(true)}>
                                Deactivate Account
                            </Button>
                        </Container>
                    </Card.Body>
                </Card>
                { emailResetModal() }
                { passwordResetModal() }
                { deactivateAccountModal() }
            </React.Fragment>
        );
    };

    return (
        <React.Fragment>
            <Helmet>
                <title>Dashboard</title>
            </Helmet>
            <Header/>
            <Container fluid id="dashboardContent">
                <Tabs
                    defaultActiveKey="polls"
                    transition={false}
                    id="noanim-tab-example"
                    className="mb-3"
                >
                    <Tab eventKey="polls" title="Polls">
                        { ShowUserPolls() }
                    </Tab>
                    <Tab eventKey="account" title="Account">
                        { ShowUserAccount() }
                    </Tab>
                </Tabs>
            </Container>
        </React.Fragment>
    );
}

function organizePolls(response) {
    let polls = [];
    let temp = [];
    response.polls.forEach(poll => {
        if (temp.length < 10) {
            temp.push(poll);
        } else {
            polls.push(temp);
            temp = [];
        }
    });

    if (temp.length > 0) {
        polls.push(temp);
    }

    return polls;
}

export default Dashboard;
