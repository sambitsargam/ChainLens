import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for LLM processing
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * API Client for backend communication
 */

export const getTopics = async () => {
  const response = await api.get('/api/topics');
  return response.data;
};

export const compareAndPublish = async (payload) => {
  const response = await api.post('/api/compare-and-publish', payload);
  return response.data;
};

export const searchNotes = async (topic) => {
  const response = await api.get('/api/notes/search', {
    params: { topic },
  });
  return response.data;
};

export const getNoteByUAL = async (ual) => {
  const encodedUAL = encodeURIComponent(ual);
  const response = await api.get(`/api/notes/${encodedUAL}`);
  return response.data;
};

export const getNotesTopics = async () => {
  const response = await api.get('/api/notes/topics');
  return response.data;
};

export default {
  getTopics,
  compareAndPublish,
  searchNotes,
  getNoteByUAL,
  getNotesTopics,
};
