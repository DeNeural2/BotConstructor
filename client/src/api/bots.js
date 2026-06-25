import api from './client';

export const getBots = () => api.get('/bots').then((r) => r.data);
export const getBot = (id) => api.get(`/bots/${id}`).then((r) => r.data);
export const createBot = (data) => api.post('/bots', data).then((r) => r.data);
export const updateBot = (id, data) => api.put(`/bots/${id}`, data).then((r) => r.data);
export const deleteBot = (id) => api.delete(`/bots/${id}`).then((r) => r.data);
export const startBot = (id) => api.post(`/bots/${id}/start`).then((r) => r.data);
export const stopBot = (id) => api.post(`/bots/${id}/stop`).then((r) => r.data);
export const clearBotToken = (id) => api.delete(`/bots/${id}/token`).then((r) => r.data);
