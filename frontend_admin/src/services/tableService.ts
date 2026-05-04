const API_URL = 'https://localhost:7057/api';

export const getTables = async () => {
  const token = localStorage.getItem('token');
  const restaurantId = localStorage.getItem('restaurantId');
  
  // 🛡️ 1. GÜVENLİK KONTROLÜ (İstek gönderilmeden EN BAŞTA olmalı)
  if (!token || !restaurantId || restaurantId === 'undefined') {
    console.error("Token veya ID eksik! Login'e yönlendiriliyor...");
    localStorage.clear();
    window.location.href = '/login';
    return [];
  }

  const response = await fetch(`${API_URL}/Table?restaurantId=${restaurantId}`, {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${token}`, // Token başında Bearer olduğundan emin ol
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  
  if (response.status === 401) {
    console.error("Yetki hatası! Token geçersiz olabilir.");
    // window.location.href = '/login'; // İstersen yetki hatasında girişe atabilirsin
    throw new Error('Oturum süresi dolmuş, lütfen tekrar giriş yapın.');
  }

  if (!response.ok) throw new Error('Masalar getirilemedi.');
  return response.json();
};

export const createTable = async (tableData: any) => {
  const token = localStorage.getItem('token');
  const restaurantId = localStorage.getItem('restaurantId');

  const payload = {
    ...tableData,
    restaurantId: restaurantId
  };

  const response = await fetch(`${API_URL}/Table`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    console.error("Masa ekleme hatası:", errorMsg);
    throw new Error('Masa eklenemedi.');
  }
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