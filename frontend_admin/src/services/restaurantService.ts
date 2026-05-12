import axios from 'axios';

// Backend portunun 7057 olduğundan emin ol
const API_URL = 'https://localhost:7057/api/Restaurant';

export interface CreateRestaurantRequest {
  name: string;
  branchInfo?: string;
  address?: string;
  phoneNumber?: string;
  tableCount: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// 🌟 1. Yeni Restoran Oluştur
export const createRestaurant = async (data: CreateRestaurantRequest) => {
  const response = await axios.post(API_URL, data, getAuthHeaders());
  return response.data;
};

// 🌟 2. İŞTE VITE'IN BULAMADIĞI O FONKSİYON: Restoran Bilgilerini Getir
export const getRestaurant = async (id: string) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

// 🌟 3. Restoran Bilgilerini Güncelle
export const updateRestaurant = async (id: string, data: CreateRestaurantRequest) => {
  const response = await axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
  return response.data;
};