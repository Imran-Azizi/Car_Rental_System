import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: API_URL, withCredentials: true });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

// Separate Axios instance for owner portal (uses ownerToken)
const ownerApi = axios.create({ baseURL: API_URL, withCredentials: true });

ownerApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("ownerToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

ownerApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("ownerToken");
      localStorage.removeItem("ownerUser");
      window.location.href = "/owner-login";
    }
    return Promise.reject(error);
  },
);

export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
  refresh: () => api.post("/auth/refresh"),
  logout: () => api.post("/auth/logout"),
};

export const carsAPI = {
  getAll: (params?: any) => api.get("/cars", { params }),
  getById: (id: string) => api.get(`/cars/${id}`),
  create: (data: any) => api.post("/cars", data),
  update: (id: string, data: any) => api.put(`/cars/${id}`, data),
  delete: (id: string) => api.delete(`/cars/${id}`),
  addImage: (id: string, data: FormData) =>
    api.post(`/cars/${id}/images`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteImage: (id: string, imageId: string) =>
    api.delete(`/cars/${id}/images/${imageId}`),
};

const multipartHeaders = { "Content-Type": "multipart/form-data" };

export const customersAPI = {
  getAll: (params?: any) => api.get("/customers", { params }),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: FormData | any) =>
    data instanceof FormData
      ? api.post("/customers", data, { headers: multipartHeaders })
      : api.post("/customers", data),
  update: (id: string, data: FormData | any) =>
    data instanceof FormData
      ? api.put(`/customers/${id}`, data, { headers: multipartHeaders })
      : api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

export const guarantorsAPI = {
  getAll: (params?: any) => api.get("/guarantors", { params }),
  getById: (id: string) => api.get(`/guarantors/${id}`),
  create: (data: FormData | any) =>
    data instanceof FormData
      ? api.post("/guarantors", data, { headers: multipartHeaders })
      : api.post("/guarantors", data),
  update: (id: string, data: FormData | any) =>
    data instanceof FormData
      ? api.put(`/guarantors/${id}`, data, { headers: multipartHeaders })
      : api.put(`/guarantors/${id}`, data),
  delete: (id: string) => api.delete(`/guarantors/${id}`),
};

const multipart = { "Content-Type": "multipart/form-data" };

export const ordersAPI = {
  getAll: (params?: any) => api.get("/contracts", { params }),
  getById: (id: string) => api.get(`/contracts/${id}`),
  create: (data: FormData | any) =>
    data instanceof FormData
      ? api.post("/contracts", data, { headers: multipart })
      : api.post("/contracts", data),
  update: (id: string, data: FormData | any) =>
    data instanceof FormData
      ? api.put(`/contracts/${id}`, data, { headers: multipart })
      : api.put(`/contracts/${id}`, data),
  markReturned: (id: string) => api.patch(`/contracts/${id}/return`),
  addPayment: (id: string, data: any) =>
    api.post(`/contracts/${id}/payment`, data),
  delete: (id: string) => api.delete(`/contracts/${id}`),
};

export const carOwnersAPI = {
  getAll: (params?: any) => api.get("/car-owners", { params }),
  getById: (id: string) => api.get(`/car-owners/${id}`),
  create: (data: FormData) =>
    api.post("/car-owners", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: string, data: FormData) =>
    api.put(`/car-owners/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id: string) => api.delete(`/car-owners/${id}`),
  getPaymentStats: () => api.get("/car-owners/payment-stats"),
  getNextReceiptNumber: () =>
    api.get("/car-owners/payments/next-receipt-number"),
  getPayments: (params?: any) =>
    api.get("/car-owners/payments/all", { params }),
  getPaymentById: (id: string) => api.get(`/car-owners/payments/${id}`),
  createPayment: (data: any) => api.post("/car-owners/payments", data),
  updatePayment: (id: string, data: any) =>
    api.put(`/car-owners/payments/${id}`, data),
  deletePayment: (id: string) => api.delete(`/car-owners/payments/${id}`),
};

export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
};

export const expensesAPI = {
  getStats: () => api.get("/expenses/stats"),
  getAll: (params?: any) => api.get("/expenses", { params }),
  getById: (id: string) => api.get(`/expenses/${id}`),
  create: (data: FormData | any) =>
    data instanceof FormData
      ? api.post("/expenses", data, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      : api.post("/expenses", data),
  update: (id: string, data: FormData | any) =>
    data instanceof FormData
      ? api.put(`/expenses/${id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      : api.put(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

export const ownerAuthAPI = {
  login: (data: { phoneNumber: string; password: string }) =>
    api.post("/owner-auth/login", data),
  getMe: () => ownerApi.get("/owner-auth/me"),
  refresh: () => ownerApi.post("/owner-auth/refresh"),
  logout: () => ownerApi.post("/owner-auth/logout"),
};

export const ownerPortalAPI = {
  getDashboard: () => ownerApi.get("/owner-portal/dashboard"),
  getCars: (params?: any) => ownerApi.get("/owner-portal/cars", { params }),
  getContracts: (params?: any) =>
    ownerApi.get("/owner-portal/contracts", { params }),
  getPayments: (params?: any) =>
    ownerApi.get("/owner-portal/payments", { params }),
  getNotifications: (params?: any) =>
    ownerApi.get("/owner-portal/notifications", { params }),
  getUnreadCount: () =>
    ownerApi.get("/owner-portal/notifications/unread-count"),
  markNotificationRead: (id: string) =>
    ownerApi.patch(`/owner-portal/notifications/${id}/read`),
  markAllNotificationsRead: () =>
    ownerApi.patch("/owner-portal/notifications/read-all"),
};

export const employeesAPI = {
  getStats: () => api.get("/employees/stats"),
  getAll: (params?: any) => api.get("/employees", { params }),
  getById: (id: string) => api.get(`/employees/${id}`),
  create: (data: any) => api.post("/employees", data),
  update: (id: string, data: any) => api.put(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
  getPayments: (params?: any) => api.get("/employees/payments/all", { params }),
  getPaymentById: (id: string) => api.get(`/employees/payments/${id}`),
  createPayment: (data: any) => api.post("/employees/payments", data),
  deletePayment: (id: string) => api.delete(`/employees/payments/${id}`),
};

export const draftsAPI = {
  getAll: () => api.get("/drafts"),
  getById: (id: string) => api.get(`/drafts/${id}`),
  create: (data: any) => api.post("/drafts", data),
  update: (id: string, data: any) => api.put(`/drafts/${id}`, data),
  delete: (id: string) => api.delete(`/drafts/${id}`),
};

export default api;
