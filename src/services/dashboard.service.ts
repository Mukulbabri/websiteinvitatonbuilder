import { apiClient } from './api';

export const dashboardService = {
  async getEvents(siteId: string = 'site-1') {
    const res = await apiClient.get('/events', { params: { siteId } });
    return res.data?.data || [];
  },

  async saveEvent(siteId: string = 'site-1', eventData: any) {
    const res = await apiClient.post('/events', eventData, { params: { siteId } });
    return res.data?.data;
  },

  async deleteEvent(id: string) {
    const res = await apiClient.delete(`/events/${id}`);
    return res.data;
  },

  async reorderEvents(eventIds: string[]) {
    const res = await apiClient.post('/events/reorder', { eventIds });
    return res.data;
  },

  async getRSVPs(siteId: string = 'site-1') {
    const res = await apiClient.get('/rsvp', { params: { siteId } });
    return res.data?.data || [];
  },

  async submitRSVP(siteId: string = 'site-1', rsvpData: any) {
    const res = await apiClient.post('/rsvp', rsvpData, { params: { siteId } });
    return res.data?.data;
  },

  async deleteRSVP(id: string) {
    const res = await apiClient.delete(`/rsvp/${id}`);
    return res.data;
  },

  async getBlessings(siteId: string = 'site-1') {
    const res = await apiClient.get('/blessings', { params: { siteId } });
    return res.data?.data || [];
  },

  async submitBlessing(siteId: string = 'site-1', blessingData: any) {
    const res = await apiClient.post('/blessings', blessingData, { params: { siteId } });
    return res.data?.data;
  },

  async approveBlessing(id: string) {
    const res = await apiClient.put(`/blessings/${id}/approve`);
    return res.data?.data;
  },

  async deleteBlessing(id: string) {
    const res = await apiClient.delete(`/blessings/${id}`);
    return res.data;
  },

  async logVisitor(siteId: string = 'site-1', data?: any) {
    const res = await apiClient.post('/analytics/visitor', data || {}, { params: { siteId } });
    return res.data?.data;
  },

  async getVisitorStats(siteId: string = 'site-1') {
    const res = await apiClient.get('/analytics/stats', { params: { siteId } });
    return res.data?.data;
  },
};
