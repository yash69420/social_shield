const API_URL = import.meta.env.VITE_BACKEND_URL;

export const api = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        ...options,
    };

    const response = await fetch(`${API_URL}${endpoint}`, defaultOptions);

    if (!response.ok) {
        throw new Error('API request failed');
    }

    return response.json();
};