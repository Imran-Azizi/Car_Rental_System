import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const carsAPI = {
  getAll: (params?: any) => api.get('/cars', { params }),
  getById: (id: string) => api.get(`/cars/${id}`),
  create: (data: any) => api.post('/cars', data),
  update: (id: string, data: any) => api.put(`/cars/${id}`, data),
  delete: (id: string) => api.delete(`/cars/${id}`),
  addImage: (id: string, data: FormData) =>
    api.post(`/cars/${id}/images`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteImage: (id: string, imageId: string) => api.delete(`/cars/${id}/images/${imageId}`),
};

const multipartHeaders = { 'Content-Type': 'multipart/form-data' };

export const customersAPI = {
  getAll: (params?: any) => api.get('/customers', { params }),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: FormData | any) =>
    data instanceof FormData
      ? api.post('/customers', data, { headers: multipartHeaders })
      : api.post('/customers', data),
  update: (id: string, data: FormData | any) =>
    data instanceof FormData
      ? api.put(`/customers/${id}`, data, { headers: multipartHeaders })
      : api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

export const guarantorsAPI = {
  getAll: (params?: any) => api.get('/guarantors', { params }),
  getById: (id: string) => api.get(`/guarantors/${id}`),
  create: (data: FormData | any) =>
    data instanceof FormData
      ? api.post('/guarantors', data, { headers: multipartHeaders })
      : api.post('/guarantors', data),
  update: (id: string, data: FormData | any) =>
    data instanceof FormData
      ? api.put(`/guarantors/${id}`, data, { headers: multipartHeaders })
      : api.put(`/guarantors/${id}`, data),
  delete: (id: string) => api.delete(`/guarantors/${id}`),
};

export const contractsAPI = {
  getAll: (params?: any) => api.get('/contracts', { params }),
  getById: (id: string) => api.get(`/contracts/${id}`),
  create: (data: any) => api.post('/contracts', data),
  update: (id: string, data: any) => api.put(`/contracts/${id}`, data),
  markReturned: (id: string) => api.patch(`/contracts/${id}/return`),
  addPayment: (id: string, data: any) => api.post(`/contracts/${id}/payment`, data),
  delete: (id: string) => api.delete(`/contracts/${id}`),
};

export const carOwnersAPI = {
  getAll: (params?: any) => api.get('/car-owners', { params }),
  getById: (id: string) => api.get(`/car-owners/${id}`),
  create: (data: FormData) => api.post('/car-owners', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) => api.put(`/car-owners/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/car-owners/${id}`),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;
