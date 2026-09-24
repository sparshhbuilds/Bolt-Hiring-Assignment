// grabbing the backend link from env vars or defaulting to localhost port 5000 so api calls don't break
export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
