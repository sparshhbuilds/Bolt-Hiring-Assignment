// Centralized API Base URL configuration
// In local dev, falls back to http://localhost:5000
// In production (Vercel), uses VITE_API_URL set to your Render backend URL
export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
