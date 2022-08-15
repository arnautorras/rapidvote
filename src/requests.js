const prod_url = 'https://rapidvote-api.herokuapp.com/';
const dev_url = 'http://localhost:8080';

export default function getEndpointURL(path) {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        return dev_url + path;
    } 
    return prod_url + path;
}
