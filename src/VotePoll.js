import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import Modal from 'react-bootstrap/Modal';
import Header from './Header';
import { localSession } from './Session';
import getEndpointURL from './requests';
import './VotePoll.css';

const viewEndPoint = getEndpointURL('/api/polls/view');
const voteEndPoint = getEndpointURL('/api/polls/vote');
const closeEndPoint = getEndpointURL('/api/polls/close');

function fetchPoll(pollId, data) {
    return axios.post(viewEndPoint + '/' + pollId, data)
        .then(response => [response.data.metadata, true])
        .catch(error => [error.response.data, false]);
}

function castVote(data) {
    return axios.post(voteEndPoint, data, { withCredentials: true })
        .then(response => [response.data.metadata, true])
        .catch(error => [error.response, false]);
}

function closePoll(data) {
    return axios.post(closeEndPoint, data, { withCredentials: false })
        .then(response => [response.data.metadata, true])
        .catch(error => [error.response, false]);
}

function VotePoll() {
    const [ session, setSession ] = useState(localSession());
    const [ poll, setPoll ] = useState();
    const [ pollChoice, setPollChoice ] = useState(-1);
    const [ loading, setLoading ] = useState(true);
    const [ canVote, setCanVote ] = useState(false);
    const [ isOpen, setIsOpen ] = useState(false);
    const [ isOwner, setIsOwner ] = useState(false);
    const [ showPollCloseConfirm, setShowPollCloseConfirm] = useState(false);
    const [ pastVote, setPastVote ] = useState();
    const [ notification, setNotification ] = useState();
    const navigate = useNavigate();
    const params = useParams();

    useEffect(() => {
        if (!poll) {
            const payload = {
                userId: session ? session.userId : null,
            };
            fetchPoll(params.pollId, payload)
                .then(result => {
                    const [ response, ok ] = result;
                    console.log('fetchPoll response:', response);
                    if (!ok) {
                        setCanVote(false);
                        setLoading(false);
                        return;
                    }

                    setPoll(response.poll);
                    setCanVote(response.canVote);
                    setIsOpen(response.poll.Status);
                    setPastVote(response.pastVote);
                    setLoading(false);
                    if(session && response.poll.Creator === session.userId){
                        setIsOwner(true);
                    }else{
                        setIsOwner(false);
                    }
                });
        }
    }, [params.pollId, navigate, session]);

    const handleSubmit = e => {
        e.preventDefault();

        if (pollChoice === -1) {
            setNotification('You must select a poll choice.');
            return;
        }

        // Send a POST request to submit a vote
        const payload = { 
            pollId: params.pollId, 
            choice: pollChoice,
            userId: session ? session.userId : null,
        };
        console.log("castVote payload:", payload);

        castVote(payload)
            .then(result => {
                const [ response, ok ] = result;
                console.log('castVote response:', response);
                if (!ok) {
                    setNotification(response.message);
                    return;
                }
                // After the vote was cast, redirect the user to the poll results
                navigate('/r/' + params.pollId);
            });
    };

    const handlePollClose = () =>{
        const payload = { 
            pollId: params.pollId,
            userId: session ? session.userId : null,
        };
        console.log("closePoll payload:", payload);

        closePoll(payload)
            .then(result => {
                const [ response, ok ] = result;
                console.log('closePoll response:', response);
                if (!ok) {
                    setNotification(response.message);
                    return;
                }else{
                    setIsOpen(false);
                }
                setShowPollCloseConfirm(false);
            });
    }

    const ShowLoading = () => (
        <React.Fragment>
            {loading 
                ? // If we are loading, show a spinner
                <React.Fragment>
                    <h1>Loading Poll {params.pollId}</h1>
                    <Spinner animation="border"/>
                </React.Fragment>
                : // Otherwise, poll couldn't be found!
                <React.Fragment>
                    <h1>Poll {params.pollId} not found!</h1>
                </React.Fragment>
            }
        </React.Fragment>
    );

    const ShowPoll = () => {
        const voteButton = () => {
            if (canVote && isOpen) {
                return (
                    <Button variant='primary' onClick={handleSubmit}>
                        Cast Vote
                    </Button>

                );
            } else {
                return (
                    <React.Fragment>
                        <Button variant='secondary' disabled>
                            Cast Vote
                        </Button>
                        <p> You cannot vote on this poll. </p>
                        <Link to={"/r/" + params.pollId}> View poll result</Link>
                    </React.Fragment>

                );
            }
        };

        const closePollModal = () => (
            <Modal show={showPollCloseConfirm} onHide={() => setShowPollCloseConfirm(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Are you sure?</Modal.Title>
                </Modal.Header>
                <Modal.Body>Once closed, you won't be able to open the poll for voting again.</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPollCloseConfirm(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handlePollClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        );

        const closePollButton = () => {
            if (isOwner) {
                return (
                    <div id="closePollDiv">
                        <br/>
                        <Button 
                            variant="outline-danger" 
                            onClick={() => setShowPollCloseConfirm(true)}
                            disabled={!poll.Status || !isOpen}>
                            {poll.Status ? "Close Poll" : "Poll closed"}
                        </Button>
                    </div>
                );
            }
        };

        const getTitle = _ => {
            if (poll.Description.length > 0) {
                return `${poll.Name} - ${poll.Description}`;
            }
            return `${poll.Name}`;
        };

        return (
            <React.Fragment>
                <Helmet> 
                    <title>{getTitle()}</title>
                </Helmet>
                <Container id="pollCardWrapper">
                    <Card className="text-center">
                        <Card.Body>
                            <h1>{poll.Name}</h1>
                            <p>{poll.Description}</p>
                            <Row>
                                <ButtonGroup vertical>
                                    {poll.Options.map((option, key) => {
                                        return (<Button 
                                            className="optionButton"
                                            key={key} 
                                            variant={
                                                (pastVote && pastVote.PollId)
                                                    ? (pastVote.Choice === key ? "success" : "dark")
                                                    : (pollChoice === key ? "success" : "dark")
                                            }
                                            active={
                                                (pastVote && pastVote.PollId)
                                                    ? pastVote.Choice === key
                                                    : pollChoice === key
                                            }
                                            onClick={() => setPollChoice(key)}
                                            disabled={!canVote || !isOpen}
                                        >
                                            {option}
                                        </Button>
                                        );
                                    })}
                                </ButtonGroup>
                            </Row>
                            { voteButton() }
                            { closePollModal() }
                            { closePollButton() } 
                        </Card.Body>
                    </Card>
                </Container>
            </React.Fragment>
        );
    };

    const ShowNotification = () => (
        <Row id="notificationWrapper" className="justify-content-md-center">
            <Alert id="notification" key="0" variant="danger">
                {notification}
            </Alert>
        </Row>
    );

    return (
        <React.Fragment>
            <Header/>
            <Container>
                { poll ? ShowPoll() : ShowLoading() }
                { notification && ShowNotification() }
            </Container>
        </React.Fragment>
    );
}

export default VotePoll;
