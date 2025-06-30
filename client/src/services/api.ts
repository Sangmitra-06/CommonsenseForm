import axios from 'axios';
import { UserInfo, QuestionResponse } from '../types/index.ts';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    console.log('Request data:', config.data);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.data || error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error config:', error.config);
    
    if (error.response?.status === 429) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    
    if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    if (error.response?.status === 404) {
      throw new Error('Session not found. Please start over.');
    }
    
    if (error.response?.status === 400) {
      const errorMessage = error.response.data?.error || error.response.data?.errors?.[0]?.msg || 'Bad request';
      throw new Error(errorMessage);
    }
    
    throw new Error(error.response?.data?.error || 'An unexpected error occurred');
  }
);

export const createUser = async (userInfo: UserInfo) => {
  try {
    console.log('Creating user with info:', userInfo);
    const response = await api.post('/users/create', userInfo);
    return response.data;
  } catch (error) {
    console.error('Failed to create user:', error);
    throw error;
  }
};

export const getUser = async (sessionId: string) => {
  const response = await api.get(`/users/${sessionId}`);
  return response.data;
};

export const updateUserProgress = async (sessionId: string, progress: any) => {
  const response = await api.put(`/users/${sessionId}/progress`, progress);
  return response.data;
};

export const completeUser = async (sessionId: string) => {
  const response = await api.put(`/users/${sessionId}/complete`);
  return response.data;
};

export const saveResponse = async (response: QuestionResponse) => {
  const apiResponse = await api.post('/responses', response);
  return apiResponse.data;
};

export const saveResponsesBatch = async (sessionId: string, responses: QuestionResponse[]) => {
  const apiResponse = await api.post('/responses/batch', { sessionId, responses });
  return apiResponse.data;
};

export const getUserResponses = async (sessionId: string) => {
  const response = await api.get(`/responses/${sessionId}`);
  return response.data;
};

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};