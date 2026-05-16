import api from './api';

export const activityService = {
  async getActivities(projectId, page = 1, limit = 50) {
    const response = await api.get(`/activities/${projectId}?page=${page}&limit=${limit}`);
    return response.data;
  },
};