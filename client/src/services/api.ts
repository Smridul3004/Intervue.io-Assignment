import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

export const pollApi = {
    getActive: () => api.get('/polls/active'),
    getHistory: () => api.get('/polls/history'),
    getById: (id: string) => api.get(`/polls/${id}`),
    create: (data: { question: string; options: string[]; timeLimit?: number }) =>
        api.post('/polls', data),
};

export const studentApi = {
    register: (data: { name: string; sessionId: string }) =>
        api.post('/students/register', data),
    getBySessionId: (sessionId: string) =>
        api.get(`/students/${sessionId}`),
};

export const voteApi = {
    submit: (pollId: string, data: { studentId: string; optionId: string }) =>
        api.post(`/polls/${pollId}/vote`, data),
};

export default api;
