import { apiClient } from './api';

export const settingsService = {
  async getSettings(siteId: string = 'site-1') {
    const res = await apiClient.get(`/sites/${siteId}/settings`);
    return res.data?.data;
  },

  async updateSettings(siteId: string = 'site-1', settingsData: any) {
    const res = await apiClient.put(`/sites/${siteId}/settings`, settingsData);
    return res.data?.data;
  },

  async uploadFile(file: File, folder: string = 'music') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': undefined,
      },
    });
    return res.data?.data?.url;
  },
};
