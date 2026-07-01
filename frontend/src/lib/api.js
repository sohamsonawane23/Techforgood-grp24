import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8000';

// Central axios instance. Attaches the saved auth token (if any) to
// every request, and clears it automatically if the backend ever says
// the token is invalid/expired, so the UI doesn't get stuck "logged in"
// against a token the server has already rejected.
export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('civiccare_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('civiccare_token');
      localStorage.removeItem('civiccare_user');
      // Tell AuthContext the session just died server-side (e.g. the
      // backend restarted with a new JWT_SECRET_KEY and invalidated all
      // tokens). Without this, the React `user` state stays stale and
      // the navbar keeps showing the person as logged in even though
      // every subsequent request - including filing a new complaint -
      // will silently go through as anonymous.
      window.dispatchEvent(new Event('civiccare:session-expired'));
    }
    return Promise.reject(error);
  }
);
