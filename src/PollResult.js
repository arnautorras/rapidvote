import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import axios from 'axios';

import Accordion from 'react-bootstrap/Accordion';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import Row from 'react-bootstrap/Row';

import Header from './Header';

import { Pie, Bar } from 'react-chartjs-2';
import { ButtonGroup, ToggleButton } from 'react-bootstrap';
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton'
import { Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';

import getEndpointURL from './requests';

import './PollResult.css';

const endpoint = getEndpointURL('/api/polls/results');

function getPollResult(pollId) {
    return axios.get(endpoint + '/' + pollId)
        .then(response => [ response.data.metadata, true ])
        .catch(error => [ error.response.data, false ]);
}

function PollResult() {
    const [ poll, setPoll ] = useState();
    const [ graph, setGraph ] = useState();
    const [ totalVotes, setTotalVotes ] = useState();
    const [radioValue, setRadioValue] = useState('0');
    const [ loading, setLoading ] = useState(true);
    const radios = [
        { name: 'Pie', value: '0' },
        { name: 'Bar', value: '1' },
    ];
    const barRef = useRef();
    const pieRef = useRef();
    let params = useParams();

    useEffect(() => {
        if (!graph) {
            getPollResult(params.pollId)
                .then(result => {
                    const [ response, ok ] = result;
                    console.log('getPollResult response:', response);
                    if (!ok) {
                        console.log("Couldn't get poll result:", response.message);
                        return;
                    }

                    setPoll(response);

                    const [ graph, totalVotes ] = generateGraph(response, barRef, pieRef);
                    setGraph(graph);
                    setTotalVotes(totalVotes);
                    setLoading(false);
                });
        }
    }, [params.pollId, 
        graph, setGraph, 
        radioValue, setRadioValue, 
        poll, setPoll,
        totalVotes, setTotalVotes,
    ]);

    const ShowGraph = () => {
        const graphName = radios[radioValue].name;
        console.log(`Showing graph: ${graphName}`);
        return graph[graphName];
    };

    const downloadPoll = useCallback((fileType, chartType) => {
        const link = document.createElement('a');
        link.download = `results.${fileType}`;
        chartType = (chartType == 0) ? pieRef : barRef;
        link.href = chartType.current.toBase64Image(`image/${fileType}`, 1);
        link.click();
    }, []);

    const convertToCSV = useCallback(() => {
        const options = poll.poll.Options
        let votes = Object.values(poll.count);

        let combined = options.map(function(option, index) {
            return [option, votes[index]];
        });

        let csvContent = "data:text/csv;charset=utf-8,options,votes\n"
            + combined.map(e => e.join(",")).join("\n");

        let encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.download = "results.csv";
        link.href = encodedUri;
        link.click();

    }, [poll, setPoll]);

    const ShowPollDetails = () => {
        return (
            <Accordion id="pollDetails">
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Poll Details</Accordion.Header>
                    <Accordion.Body>
                        <strong>Description: </strong>
                        { poll.poll.Description.length > 0 
                            ? poll.poll.Description
                            : <i>no description was provided</i>
                        } <br/>
                        <strong>Expiration: </strong>
                        { poll.poll.Expiration } <br/>
                        <strong>ID: </strong>
                        { poll.poll.PollId } <br/>
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
        );
    };

    const ShowPollResult = () => {
        if (loading) {
            return (
                <Col>
                    <Row>
                        <h1>Loading poll {params.pollId}</h1>
                    </Row>
                    <Row>
                        <Spinner animation="border"/> 
                    </Row>
                </Col>
            );
        } 

        return (
            <Card id="resultCard" className="text-center">
                <Card.Body>
                    <h1>Results for "{poll.poll.Name}"</h1>
                    <p>Total Votes: <strong>{totalVotes}</strong></p>
                    <ButtonGroup id='button'>
                        {radios.map((radio, idx) => (
                            <ToggleButton
                                className='toggle'
                                key={idx}
                                id={`radio-${idx}`}
                                name="radio"
                                value={radio.value}
                                checked={radioValue === radio.value}
                                onClick={e => setRadioValue(radio.value)}
                            >
                                {radio.name}
                            </ToggleButton>
                        ))}
                    </ButtonGroup>
                    <Container id="chart"> { ShowGraph() } </Container>
                    <Container> { ShowPollDetails() } </Container>
                    <DropdownButton id="downloadButton" title="Download">
                        <Dropdown.Item as="button" onClick={() => downloadPoll('jpeg', radioValue)}>JPEG (.jpeg)</Dropdown.Item>
                        <Dropdown.Item as="button" onClick={() => downloadPoll('png', radioValue)}>PNG (.png)</Dropdown.Item>
                        <Dropdown.Item as="button" onClick={() => convertToCSV()}>CSV (.csv)</Dropdown.Item>
                    </DropdownButton>
                </Card.Body>
            </Card>
        );

    };

    return (
        <React.Fragment>
            <Helmet> 
                <title>{ poll
                    ? `${poll.poll.Name} - Results` 
                    : "Loading poll results..." 
                    }</title>
            </Helmet>
            <Header/>
            <Container id="resultCardWrapper">
                { ShowPollResult() }
            </Container>
        </React.Fragment>
    );
}

function generateGraph(pollResult, barRef, pieRef) {
    const labels = pollResult.poll.Options;
    const name = pollResult.poll.Name;
    let votes = Object.values(pollResult.count);
    let totalVotes = votes.reduce((a, b) => a + b);

    const data = {
        labels: labels,
        datasets: [
            {
                label: name,
                data: votes,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(160, 82, 45, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)',
                    'rgba(255, 118, 208, 0.2)',
                    'rgba(102, 139, 87, 0.2)',
                    'rgba(0, 100, 139, 0.2)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(160, 82, 45, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(255, 118, 208, 1)',
                    'rgba(102, 139, 87, 1)',
                    'rgba(0, 100, 139, 1)',
                ],
                borderWidth: 1.5,
            },
        ],
    };

    const options = {
        indexAxis: 'y',
        responsive: true,
        hover: {
            animationDuration: 0
        },
        plugins: {
            title: {
                display: true,
                text: name,
            },
        },
        ticks: {
            precision: 0
        },
    };

    // Bar Graph
    ChartJS.register(
        CategoryScale,
        LinearScale,
        BarElement,
        Title,
        Tooltip,
        Legend,
    );

    // Pie Graph
    ChartJS.register(ArcElement, Tooltip, Legend);

    const graphs = {
        'Pie': <Pie options={options} data={data} ref={pieRef}/>,
        'Bar': <Bar options={options} data={data} ref={barRef}/>,
    };

    return [graphs, totalVotes];
}

export default PollResult;
