import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle global errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const { response } = error;
        if (response) {
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('token');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login?expired=true';
                }
            } else if (response.status === 500) {
                console.error('SERVER_ERROR:', response.data);
            }
        } else {
            // Network error
            console.error('NETWORK_ERROR:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;
