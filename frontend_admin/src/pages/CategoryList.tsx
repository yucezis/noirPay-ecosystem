import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Category } from '../types/category';
import { getCategories, deleteCategory } from '../services/categoryService';
import CategoryModal from '../components/CategoryModal'; 

const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);

  const loadCategories = () => {
    setLoading(true);
    getCategories()
      .then(setCategories)
      .catch(err => console.error("Kategoriler yüklenirken hata:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAddCategory = () => {
    setEditingCategory(undefined);
    setModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
      try {
        await deleteCategory(id);
        loadCategories(); 
      } catch (error) {
        alert("Silme işlemi başarısız oldu!");
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Menü yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Üst Kısım */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Kategori Yönetimi</h1>
            <p className="text-gray-600">Tüm kategorileri buradan yönetin</p>
          </div>
          <button
            onClick={handleAddCategory}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            <Plus className="w-5 h-5" />
            Yeni Kategori Ekle
          </button>
        </div>

        {/* Tablo Alanı */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kategori</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        
                        <div className="font-medium text-gray-900">{category.name}</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
                          category.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {category.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {categories.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Kategori Bulunamadı</h3>
              <p className="text-gray-500">Henüz kategori bulunmuyor. Yeni kategori ekleyerek başlayın.</p>
            </div>
          )}
        </div>
      </div>

      {/* Dışarıya Aldığımız Modal Bileşeni */}
      <CategoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        category={editingCategory}
        onRefresh={loadCategories} // Başarılı işlem sonrası listeyi günceller
      />
    </div>
  );
}

export default CategoryList;