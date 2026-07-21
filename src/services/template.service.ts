import { apiClient } from './api';

export const templateService = {
  async getTemplates() {
    const res = await apiClient.get('/templates');
    return res.data?.data || [];
  },

  async getCategories() {
    const res = await apiClient.get('/categories');
    return res.data?.data || [];
  },

  async getPlans() {
    const res = await apiClient.get('/plans');
    return res.data?.data || {};
  },
};
