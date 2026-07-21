import { apiClient } from './api';

export const invitationService = {
  async detectTenant(params?: { subdomain?: string; domain?: string; siteId?: string }) {
    const res = await apiClient.get('/tenant/detect', { params });
    return res.data?.data;
  },

  async getWebsiteDetails(siteId: string) {
    const res = await apiClient.get(`/sites/${siteId}/details`);
    return res.data?.data;
  },

  async getWebsitePlan(siteId: string) {
    const res = await apiClient.get(`/sites/${siteId}/plan`);
    return res.data?.data?.plan || 'royal';
  },
};
