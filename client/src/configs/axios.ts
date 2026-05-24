import axios from "axios";

const baseURL = import.meta.env.VITE_BASEURL;
const api = axios.create({
    baseURL: baseURL || "http://localhost:3000",
    withCredentials: true,
});

export default api;