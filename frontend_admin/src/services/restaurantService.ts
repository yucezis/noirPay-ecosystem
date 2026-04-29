const API_URL = 'https://localhost:7057/api'; 

export interface CreateRestaurantRequest {
  name: string;
  branchInfo?: string;
  address?: string;
  phoneNumber?: string;
  tableCount: number;
}

export const createRestaurant = async (data: CreateRestaurantRequest) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/Restaurant`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Restoran oluşturulamadı.');
  }
  
  return response.json();
};