import type { Product } from '../types/product';

const API_URL = 'https://localhost:7057/api';

export const getProducts = async (): Promise<Product[]> => {
  const token = localStorage.getItem('token'); 
  
  const response = await fetch(`${API_URL}/Product`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error('Ürünler getirilemedi.');
  return response.json();
};

export const createProduct = async (productData: any) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/Product`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });

  if (!response.ok) throw new Error('Ürün eklenirken bir hata oluştu.');
  return response.json();
};

export const updateProduct = async (id: string, productData: any) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/Product/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });

  if (!response.ok) throw new Error('Ürün güncellenemedi.');
  return response.json();
};

export const deleteProduct = async (id: string) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/Product/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Ürün silinemedi.');
  return response.json();
};

export const getCategories = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/Category`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Kategoriler getirilemedi.');
  return response.json();
};