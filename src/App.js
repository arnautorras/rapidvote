import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import Login from './Login';
import Logout from './Logout';
import Home from './Home';
import Register from './Register';
import CreatePoll from './CreatePoll';
import PollResult from './PollResult';
import VotePoll from './VotePoll';
import './App.css';

function App() {
    return (
        <React.StrictMode>
            <HelmetProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Home/>}/>
                        <Route path="/create" element={<CreatePoll/>}/>
                        <Route path="/dashboard" element={<Dashboard/>}/>
                        <Route path="/login" element={<Login/>}/>
                        <Route path="/logout" element={<Logout/>}/>
                        <Route path="/register" element={<Register/>}/>
                        <Route path="/r/:pollId" element={<PollResult/>}/>
                        <Route path="/:pollId" element={<VotePoll/>}/>
                    </Routes>
                </BrowserRouter>
            </HelmetProvider>
        </React.StrictMode>
    );
}

export default App;
