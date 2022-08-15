import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { localSession, isAuthenticated } from './Session';
import './Header.css';
import logo from './voting-box.png'

function Header() {
    const [ session, setSession ] = useState(localSession());
    const navigate = useNavigate();

    return (
        <Navbar bg="dark" variant="dark">
            <Container>
                <Navbar.Brand onClick={() => navigate('/')} id="rapLogo"> 
                    <img
                        alt=""
                        src={logo}
                        width="30"
                        height="30"
                        id="logoImage"
                    />{' '}
                    Rapidvote
                </Navbar.Brand>
                <Nav.Link onClick={() => navigate('/create')}>Create Poll</Nav.Link>
                { isAuthenticated()
                    ? 
                        <React.Fragment>
                            <Nav.Link onClick={() => navigate('/dashboard')}>Dashboard</Nav.Link>
                            <Nav.Link onClick={() => navigate('/logout')}>Logout</Nav.Link>
                        </React.Fragment>
                        : 
                        <Nav.Link onClick={() => navigate('/login')}>Login / Register</Nav.Link>
                }
            </Container>
        </Navbar>
    );
}

export default Header;
