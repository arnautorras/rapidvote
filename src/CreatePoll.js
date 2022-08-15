import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';

import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form';

import Header from './Header';

import { localSession, isAuthenticated } from './Session';
import getEndpointURL from './requests';

import './CreatePoll.css';

const endpoint = getEndpointURL('/api/polls/create');

const MAX_POLL_NAME_LENGTH = 64;
const MAX_POLL_DESCRIPTION_LENGTH = 240;
const MAX_POLL_OPTIONS_TEXT_LENGTH = 64;
const MAX_POLL_OPTIONS_COUNT = 18;

function createPoll(data) {
    return axios.post(endpoint, data)
        .then(response => [response.data.metadata, true])
        .catch(error => [error.response.data, false]);
}

function CreatePoll(props) {
    const [ session, setSession ] = useState(localSession());
    const [ notification, setNotification ] = useState();
    const [ name, setName ] = useState();
    const [ description, setDescription ] = useState();
    const [ requireAuth, setRequireAuth ] = useState(false);
    const [pollOptions, setPollOptions] = useState(
        [{key: 0, value: ''}, {key: 1, value: ''}]
    );
    const [ expirationDate, setExpirationDate ] = useState();
    const navigate = useNavigate();

    const handleSubmit = e => {
        e.preventDefault();

        let optionsDOM = document.body.getElementsByClassName("options");
        let optionsList = [];

        // Only add options that contain some value in the text field
        Array.from(optionsDOM).forEach(optionDOM => {
            if (optionDOM.value.length > 0) {
                optionsList.push(optionDOM.value);
            }
        });

        const now = new Date();
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Create `poll` payload
        const poll = {
            name: name,
            description: description,
            options: optionsList,
            creator: session ? session.userId : null,
            status: true,
            authRequired: requireAuth,
            expiration: expirationDate ? new Date(expirationDate) : oneWeekFromNow
        };

        console.log('Poll expiration:', poll.expiration);

        // Verify all pollData information below

        if (!poll.name || poll.name === '') {
            setNotification("You must specify a name for the poll.");
            return false;
        }

        if (poll.name.length > MAX_POLL_NAME_LENGTH) {
            setNotification(`Poll name can only be up to ${MAX_POLL_NAME_LENGTH} characters.`);
            return false;
        }

        if (poll.expiration < new Date()) {
            setNotification("You must choose a valid expiration date");
            return;
        }

        if (poll.options.length < 2) {
            setNotification("You must have at least 2 options.");
            return false;
        }

        if (poll.options.length > MAX_POLL_OPTIONS_COUNT) {
            setNotification(`You can only have ${MAX_POLL_OPTIONS_COUNT} poll options.`);
            return false;
        }

        console.log('Expiration Date:', poll.expiration);
        console.log('Date now:', new Date());

        console.log("Sending Form:", poll);
        createPoll(poll)
            .then(result => {
                const [ response, ok ] = result;
                console.log("createPoll response:", poll);
                if (!ok) {
                    setNotification(response.message);
                    return;
                }

                navigate('/' + response.pollId);
            });
    };

    const addOption = () => {
        if (pollOptions.length > MAX_POLL_OPTIONS_COUNT) {
            setNotification(`You can only have ${MAX_POLL_OPTIONS_COUNT} poll options.`);
            return;
        }
        setPollOptions(prevState => [...prevState, { key: prevState.length + 1, value: '' }]);
    };

    const ShowCreatePollCard = () => (
            <Card>
                <Card.Body>
                    <h1>Create a Poll</h1>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="formBasicName">
                            <Form.Label>Name</Form.Label>
                            <Form.Control placeholder="Choose a name..."
                                onChange={e => setName(e.target.value)} maxLength={MAX_POLL_NAME_LENGTH}/>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicDescription">
                            <Form.Label>Description (optional)</Form.Label>
                            <Form.Control placeholder="Add a description..." 
                                onChange={e => setDescription(e.target.value)} maxLength={MAX_POLL_DESCRIPTION_LENGTH}/>
                        </Form.Group>

                        { isAuthenticated() &&
                        <React.Fragment>
                            <Form.Group controlId="expireDate">
                                <Form.Label>Select an Expiration Datetime</Form.Label>
                                <Form.Control type="datetime-local" name="expire" 
                                    onChange={e => {
                                        const datetime = new Date(e.target.value).toISOString();
                                        console.log(datetime);
                                        setExpirationDate(datetime);
                                    }}
                                />
                            </Form.Group>
                        </React.Fragment>
                        }

                        <Form.Group className="mb-3" controlId="formOptions">
                            <Form.Label>Options</Form.Label>
                            {
                                pollOptions.map(option => (
                                    <Form.Control key={option.key} className="options" placeholder="Add an option description..."
                                        maxLength={MAX_POLL_OPTIONS_TEXT_LENGTH}/>
                                ))
                            }
                            <Button onClick={addOption} disabled={pollOptions.length === MAX_POLL_OPTIONS_COUNT}>
                                Add an option
                            </Button>
                        </Form.Group>

                        { isAuthenticated() &&
                        <Form.Group className="mb-3" controlId="formBasicCheckbox">
                            <Form.Check type="checkbox" label="Require voters to be logged in" 
                                onChange={e => setRequireAuth(!requireAuth)}/>
                        </Form.Group>
                        }

                        <div style={{marginTop:'10px'}}>
                            <Button variant="primary" type="submit">
                                Create
                            </Button>
                        </div>
                    </Form>

                    { notification && ShowNotification() }
                </Card.Body>
            </Card>
    );

    const ShowNotification = () => (
        <Row id="notificationWrapper" className="justify-content-md-center">
            <Alert id="notification" key="0" variant="warning">
                {notification}
            </Alert>
        </Row>
    );

    return (
        <React.Fragment>
            <Helmet>
                <title>Create a Poll</title>
            </Helmet>
            <Header/>
            <Container id="pollCardWrapper">
                { ShowCreatePollCard() }
            </Container>
        </React.Fragment>
    );
}

export default CreatePoll;
