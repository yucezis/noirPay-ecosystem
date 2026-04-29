const API_URL = 'https://localhost:7057/api';

export const getTables = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/Table`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Masalar getirilemedi.');
  return response.json();
};

export const createTable = async (tableData: { name: string; tableNo: string }) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/Table`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tableData)
  });
  if (!response.ok) throw new Error('Masa eklenemedi.');
  return response.json();
};

export const deleteTable = async (id: string) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/Table/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Masa silinemedi.');
  return response.json();
};