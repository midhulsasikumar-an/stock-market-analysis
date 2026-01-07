import axios from "axios";

const API_KEY = process.env.REACT_APP_FINNHUB_API_KEY;

const finnhub = axios.create({
    baseURL: "https://finnhub.io/api/v1",
    params: {
        token: API_KEY,
    },
});

export default finnhub;
