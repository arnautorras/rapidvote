import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card'
import CardGroup from 'react-bootstrap/CardGroup'
import Badge from 'react-bootstrap/Badge'
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Header from './Header';
import './Home.css';

function Home() {
    const navigate = useNavigate();

    return (
        <React.Fragment>
            <Helmet>
                <title>Rapidvote</title>
            </Helmet>
            <Header/>
            <Container id="homeWrapper">
                <Card className="bg-dark text-white">
                    <Card.Img src="https://www.solidbackgrounds.com/images/1920x1080/1920x1080-light-coral-solid-color-background.jpg" alt="Card image" />
                    <Card.ImgOverlay>
                        <br/>
                        <h1>Rapidvote</h1>
                        <p>Create quick and simple polls and share them with voters within seconds!</p>
                        <br/>
                        <br/>
                        <Row id="homeRow">
                            <Col xs>
                                <Button 
                                    variant="outline-dark"
                                    size = "lg"
                                    onClick={() => navigate('/create')}
                                >
                                    Create Poll
                                </Button>
                            </Col>
                            <Col xs>
                                <Button 
                                    variant="outline-dark"
                                    size = "lg"
                                    onClick={() => navigate('/register')}
                                >
                                    Create Account
                                </Button>
                            </Col>
                        </Row>
                        <br/><br/>
                        <Row>
                            <Col lg={12} className="d-none d-lg-block">
                                <img src='https://docs.google.com/drawings/d/e/2PACX-1vRc9PO25OzD4xE00JTglKLM10W2vdUZw8NLm8Hf04gkIWu6eNJoOwgK2xfJ_w6cIDHWLN0DsDgeAfnx/pub?w=979&h=360' alt='...' />
                            </Col>
                        </Row>
                    </Card.ImgOverlay>
                </Card>
                <br/>
                <br/>
                <CardGroup>
                    <Card>
                        <Badge bg="dark"><h3>Anonymous Polls</h3></Badge>
                        <p>Create a poll without logging in. After creating the poll, send a link to your poll
                            by copy and pasting the web address at the top. Then, simply send it to the people 
                            you want to vote on the poll. Polls will close within an hour and others will be unable
                            to vote on that poll once it is closed.</p>
                    </Card>
                    <Card>
                        <Badge bg="dark"><h3>Registered Polls</h3></Badge>
                        <p>Create a poll while logged in. Users who are logged in have the option to restrict their 
                        poll's voters to be logged in. If the option is not chosen, both anonymous and registered 
                        users can vote on the poll. Expiration date and time settings are also available. Send out polls
                        the same way as anonymous polls.</p>
                    </Card>
                    <Card>
                        <Badge bg="dark"><h3>Poll Results</h3></Badge>
                        <p>Polls created by anonymous users cannot be accessed without the link. The poll creator
                        should keep the link to see results. Refresh page to see new votes. Polls created by logged 
                        in users are saved to a dashboard, and results can be accessed at any time. Users also have
                        the ability to close a poll early.</p>
                    </Card>
                </CardGroup>
            </Container>
        </React.Fragment>
    );
}

export default Home;
