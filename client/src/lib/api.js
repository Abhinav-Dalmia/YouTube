import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('yt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export const mediaUrl = (url) => url || '';
export const formatViews = (count = 0) => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K views`;
  return `${count} views`;
};
export const timeAgo = (date) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [unit, value] of units) if (seconds >= value) { const n = Math.floor(seconds / value); return `${n} ${unit}${n > 1 ? 's' : ''} ago`; }
  return 'just now';
};
export const initials = (name = 'User') => name.trim().split(/\s+/).slice(0, 2).map((v) => v[0]).join('').toUpperCase();
export default api;
