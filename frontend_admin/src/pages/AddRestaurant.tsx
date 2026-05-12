import React, { useState, useEffect } from 'react';
import { createRestaurant, getRestaurant, updateRestaurant, type CreateRestaurantRequest } from '../services/restaurantService';
import { Store, MapPin, Phone, Hash } from 'lucide-react';

const AddRestaurant: React.FC = () => {
  const [formData, setFormData] = useState<CreateRestaurantRequest>({
    name: '',
    branchInfo: '',
    address: '',
    phoneNumber: '',
    tableCount: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true); 
  const [isEditMode, setIsEditMode] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    const fetchExistingRestaurant = async () => {
      try {
        const currentRestaurantId = localStorage.getItem('restaurantId');

        if (currentRestaurantId && currentRestaurantId !== 'undefined') {
          setRestaurantId(currentRestaurantId);
          setIsEditMode(true);
          
          const existingData = await getRestaurant(currentRestaurantId);
          if (existingData) {
            setFormData({
              name: existingData.name || '',
              branchInfo: existingData.branchInfo || '',
              address: existingData.address || '',
              phoneNumber: existingData.phoneNumber || '',
              tableCount: existingData.tableCount || 0
            });
          }
        }
      } catch (error) {
        console.error("Restoran bilgileri çekilemedi", error);
      } finally {
        setInitialLoad(false);
      }
    };

    fetchExistingRestaurant();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'tableCount' ? parseInt(value) || 0 : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isEditMode && restaurantId) {
        await updateRestaurant(restaurantId, formData);
        setMessage({ type: 'success', text: 'Restoran bilgileri başarıyla güncellendi! ✨' });
      } else {
        const response = await createRestaurant(formData);
        
        if (response && response.restaurantId) {
           localStorage.setItem('restaurantId', response.restaurantId);
           setRestaurantId(response.restaurantId);
           setIsEditMode(true);
        }
        setMessage({ type: 'success', text: 'Restoran ve masalar başarıyla oluşturuldu! 🎉' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return <div className="p-8 text-center font-medium text-gray-500">Restoran bilgileri yükleniyor...</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isEditMode ? 'Restoran Bilgilerini Güncelle' : 'Restoran Bilgileri'}
            </h2>
            <p className="text-sm text-gray-500">
              {isEditMode ? 'Mevcut restoran bilgilerinizi buradan düzenleyebilirsiniz.' : 'Sisteme yeni bir restoran ve masa düzeni ekleyin.'}
            </p>
          </div>
        </div>

        {message && (
          <div className={`p-4 mb-6 rounded-xl font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restoran Adı</label>
            <input 
              required
              type="text" name="name" value={formData.name} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
              placeholder="Örn: Noir Cafe & Brasserie"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Store className="w-4 h-4"/> Şube Bilgisi</label>
              <input 
                type="text" name="branchInfo" value={formData.branchInfo} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none"
                placeholder="Örn: Kadıköy Şubesi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Hash className="w-4 h-4"/> Masa Sayısı</label>
              <input 
                required
                type="number" min="0" name="tableCount" value={formData.tableCount} onChange={handleChange}
                className={`w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none ${isEditMode ? 'bg-gray-50 text-gray-500' : ''}`}
                placeholder="Örn: 15"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Phone className="w-4 h-4"/> Telefon Numarası</label>
            <input 
              type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none"
              placeholder="Örn: 0212 123 45 67"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><MapPin className="w-4 h-4"/> Adres</label>
            <textarea 
              rows={3} name="address" value={formData.address} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none resize-none"
              placeholder="Açık adres giriniz..."
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 px-4 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? 'İşleniyor...' : (isEditMode ? 'Değişiklikleri Kaydet' : 'Restoranı Kaydet ve Masaları Oluştur')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddRestaurant;