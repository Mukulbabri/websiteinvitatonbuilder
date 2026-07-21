import { apiClient } from './api';

export const authService = {
  async register(data: { email: string; password: string; name?: string; role?: string }) {
    const res = await apiClient.post('/auth/register', data);
    if (res.data?.data?.accessToken) {
      localStorage.setItem('access_token', res.data.data.accessToken);
      localStorage.setItem('refresh_token', res.data.data.refreshToken);
    }
    return res.data;
  },

  async login(email: string, pass: string) {
    const res = await apiClient.post('/auth/login', { email, password: pass });
    if (res.data?.data?.accessToken) {
      localStorage.setItem('access_token', res.data.data.accessToken);
      localStorage.setItem('refresh_token', res.data.data.refreshToken);
    }
    return res.data;
  },

  async getMe() {
    const res = await apiClient.get('/auth/me');
    return res.data?.data?.user;
  },

  async logout() {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } catch (e) {}
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('admin_authenticated');
  },
};
