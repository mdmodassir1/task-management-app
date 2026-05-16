import api from './api';

export const taskService = {
  // Get all tasks with pagination and filters
  async getAllTasks(projectId, page = 1, limit = 20, filters = {}) {
    let url = `/tasks?projectId=${projectId}&page=${page}&limit=${limit}`;
    
    if (filters.status && filters.status !== '') url += `&status=${filters.status}`;
    if (filters.priority && filters.priority !== '') url += `&priority=${filters.priority}`;
    if (filters.search && filters.search !== '') url += `&search=${encodeURIComponent(filters.search)}`;
    
    const response = await api.get(url);
    return response.data;
  },

  // Get single task by ID
  async getTaskById(id) {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Create new task
  async createTask(taskData) {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  // Update task
  async updateTask(id, taskData) {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  // Delete task
  async deleteTask(id) {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  // Update task status (for drag and drop)
  async updateTaskStatus(id, status, orderIndex) {
    const response = await api.patch(`/tasks/${id}/status`, { status, orderIndex });
    return response.data;
  },

  // Add comment to task
  async addComment(taskId, text) {
    const response = await api.post(`/tasks/${taskId}/comments`, { text });
    return response.data;
  },

  // Delete comment from task
  async deleteComment(taskId, commentId) {
    const response = await api.delete(`/tasks/${taskId}/comments/${commentId}`);
    return response.data;
  },
};