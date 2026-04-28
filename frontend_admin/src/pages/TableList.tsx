import React, { useState, useEffect } from 'react';
import { Plus, Trash2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getTables, createTable, deleteTable } from '../services/tableService';

const TableList: React.FC = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', tableNo: '' });

  const loadTables = () => {
    setLoading(true);
    getTables()
      .then(setTables)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTables();
  }, []);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTable(formData);
      setIsModalOpen(false);
      setFormData({ name: '', tableNo: '' });
      loadTables();
    } catch (error) {
      alert("Masa eklenirken hata oluştu.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu masayı silmek istediğinize emin misiniz?')) {
      try {
        await deleteTable(id);
        loadTables();
      } catch (error) {
        alert("Silme işlemi başarısız.");
      }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Masalar yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Üst Alan */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Masa Yönetimi</h1>
            <p className="text-gray-600">Restoranınızdaki masaları ve QR kodlarını yönetin</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all shadow-lg font-medium"
          >
            <Plus className="w-5 h-5" />
            Yeni Masa Ekle
          </button>
        </div>

        {/* Masalar Grid Yapısı */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tables.map(table => {
            // Müşterinin QR kodu okuttuğunda gideceği adres (Şimdilik dummy url, ileride müşteri frontend'ine gidecek)
            const qrUrl = `https://app.noirpay.com/menu/${table.qrCodeId}`;

            return (
              <div key={table.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center hover:shadow-md transition-shadow relative group">
                
                {/* Silme Butonu (Sadece hover olunca görünür) */}
                <button 
                  onClick={() => handleDelete(table.id)}
                  className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* QR Kod Çizimi */}
                <div className="p-4 bg-white rounded-xl border-2 border-dashed border-gray-200 mb-4">
                  <QRCodeSVG value={qrUrl} size={120} level="H" />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900">{table.name}</h3>
                <span className="inline-flex mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  {table.tableNo}
                </span>
                
                <div className="mt-4 pt-4 border-t border-gray-100 w-full flex items-center justify-center gap-2 text-xs text-gray-400">
                  <QrCode className="w-4 h-4" />
                  <span className="truncate w-32" title={table.qrCodeId}>{table.qrCodeId}</span>
                </div>
              </div>
            );
          })}
        </div>

        {tables.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 mt-6">
            <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Masa Bulunmuyor</h3>
            <p className="text-gray-500">Karekod sipariş sistemine başlamak için ilk masanızı ekleyin.</p>
          </div>
        )}

      </div>

      {/* Masa Ekleme Modalı */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">Yeni Masa Ekle</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black">✕</button>
            </div>
            <form onSubmit={handleAddTable} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Masa Adı</label>
                <input 
                  required autoFocus
                  type="text"
                  placeholder="Örn: Bahçe Masası"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-black outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Masa Numarası</label>
                <input 
                  required
                  type="text"
                  placeholder="Örn: B-01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-black outline-none"
                  value={formData.tableNo}
                  onChange={e => setFormData({...formData, tableNo: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl">İptal</button>
                <button type="submit" className="px-6 py-2 bg-black text-white rounded-xl hover:bg-gray-800">Masayı Oluştur</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableList;