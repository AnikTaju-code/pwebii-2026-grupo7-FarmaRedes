import axios from 'axios';
const api = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || ''}/api`, timeout: 12000 });
api.interceptors.request.use(c => {
  const t = localStorage.getItem('fr_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use(
  r => r,
  e => Promise.reject(new Error(e.response?.data?.erro || e.message || 'Falha de ligação')),
);
export default api;
