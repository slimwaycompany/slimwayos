import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default api;

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const usersApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: Record<string, unknown>) => api.patch('/users/profile', data),
};

export const weightApi = {
  getAll: () => api.get('/weight'),
  create: (data: { weight: number; date: string; notes?: string }) =>
    api.post('/weight', data),
  delete: (id: string) => api.delete(`/weight/${id}`),
};
