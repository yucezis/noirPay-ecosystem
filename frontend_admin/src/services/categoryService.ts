import type { Category } from '../types/category';

const API_URL = 'http://localhost:7057/api';

export const getCategories = async (): Promise<Category[]> => {
  const token = localStorage.getItem('token'); 
  
  const response = await fetch(`${API_URL}/Category`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error('Kategoriler getirilemedi.');
  return response.json();
};

export const createCategory = async (categoryData: any) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/Category`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(categoryData)
  });

  if (!response.ok) throw new Error('Kategori eklenirken bir hata oluştu.');
  return response.json();
};

export const updateCategory = async (id: string, categoryData: any) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/Category/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(categoryData)
  });

  if (!response.ok) throw new Error('Kategori güncellenemedi.');
  return response.json();
};

export const deleteCategory = async (id: string) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/Category/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Kategori silinemedi.');
  return response.json();
};

