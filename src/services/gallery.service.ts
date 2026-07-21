import { apiClient } from './api';

export const galleryService = {
  async getGallery(siteId: string = 'site-1') {
    const res = await apiClient.get('/gallery', { params: { siteId } });
    return res.data?.data || [];
  },

  async addImage(siteId: string = 'site-1', url: string, caption?: string) {
    const res = await apiClient.post('/gallery', { url, caption }, { params: { siteId } });
    return res.data?.data;
  },

  async deleteImage(id: string) {
    const res = await apiClient.delete(`/gallery/${id}`);
    return res.data;
  },
};
