import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Category } from '../types/category';
import { createCategory, updateCategory, getCategories } from '../services/categoryService';

interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category; 
  onRefresh: () => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ open, onOpenChange, category, onRefresh }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    isActive: true
  });

  // Modal açıldığında kategorileri çek ve (varsa) mevcut ürün verilerini forma doldur
  useEffect(() => {
    if (open) {
      // Kategorileri çek
      getCategories().then(setCategories).catch(console.error);

      if (category) {
        setFormData({
          name: category.name,
          isActive: category.isActive
        });
      } else {
        setFormData({ name: '',  isActive: true });
      }
    }
  }, [open, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (category) {
        // Güncelleme Modu
        await updateCategory(category.id, formData);
      } else {
        await createCategory(formData);
      }
      onRefresh(); // Tabloyu yenile
      onOpenChange(false); // Modalı kapat
    } catch (error) {
      alert("İşlem sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Başlığı */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {category ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {category ? 'Kategori bilgilerini aşağıdan güncelleyebilirsiniz.' : 'Menüye yeni bir kategori ekleyin.'}
            </p>
          </div>
          <button 
            onClick={() => onOpenChange(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Formu */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Adı</label>
              <input 
                required
                type="text"
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>


            <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
              <input 
                id="isActive"
                type="checkbox" 
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              />
              <label htmlFor="isActive" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                Bu kategori şu an satışta (Aktif)
              </label>
            </div>

          </div>

          {/* Modal Alt Kısmı (Butonlar) */}
          <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button 
              disabled={loading}
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:bg-blue-400"
            >
              {loading ? 'İşleniyor...' : (category ? 'Güncelle' : 'Kaydet')}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default CategoryModal;