const API_URL = 'https://localhost:7057/api';

export const getTables = async () => {
  const token = localStorage.getItem('token');
  const restaurantId = localStorage.getItem('restaurantId');
  
  const response = await fetch(`${API_URL}/Table?restaurantId=${restaurantId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!restaurantId || restaurantId === 'undefined' || restaurantId === 'null') {
    localStorage.clear(); // Bozuk veriyi hemen sil
    window.location.href = '/login'; // Kullanıcıyı zorla logine geri at
    throw new Error('Geçersiz restoran bilgisi tespit edildi. Lütfen tekrar giriş yapın.');
  }
  
  return response.json();
};

// tableService.ts içindeki createTable fonksiyonu
export const createTable = async (tableData: { name: string; tableNo: string; restaurantId: string }) => {
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