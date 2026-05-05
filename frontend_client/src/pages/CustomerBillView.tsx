import React, { useState, useEffect } from 'react';
import { Receipt, Bell, CreditCard, ArrowLeft, History } from 'lucide-react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export default function CustomerBillView() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isRequested, setIsRequested] = useState(false);
  const { tableId } = useParams<{ tableId: string }>();

  useEffect(() => {
    // 1. Masadaki güncel hesabı çek
    const fetchBill = async () => {
      try {
        const response = await axios.get(`https://localhost:7057/api/Order/active-table/${tableId}`);
        // Backend'den gelen veriyi state'e bas
        setItems(response.data.items || []);
        setTotal(response.data.totalAmount || 0);
      } catch (err) {
        console.error("Hesap çekilemedi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [tableId]);

  const handleRequestBill = async () => {
    try {
      // 2. Backend'e "Hesap İste" talebi gönder (Noir-28)
      await axios.post(`https://localhost:7057/api/Order/request-bill/${tableId}`);
      setIsRequested(true);
      alert("Hesap talebiniz başarıyla garsona iletildi. 🥂");
    } catch (err) {
      alert("Bir hata oluştu, lütfen garsonu çağırın.");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-zinc-500">NoirPay Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-200 font-sans selection:bg-orange-500/30">
      {/* Üst Header */}
      <header className="p-6 flex items-center justify-between border-b border-zinc-900">
        <button className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black tracking-widest uppercase italic">NoirPay</h1>
        <button className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
          <History className="w-6 h-6 text-zinc-500" />
        </button>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-8">
        {/* Masa Bilgisi */}
        <section className="text-center space-y-2">
          <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Adisyon Detayı</span>
          <h2 className="text-4xl font-black text-white tracking-tight">Masa 04</h2>
        </section>

        {/* Ürün Listesi */}
        <section className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6 text-zinc-400">
            <Receipt className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-tight">Siparişleriniz</span>
          </div>

          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{item.name}</span>
                  <span className="text-xs text-zinc-500">{item.quantity} adet</span>
                </div>
                <span className="font-mono text-sm text-zinc-300">{(item.price * item.quantity).toFixed(2)} TL</span>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-800 border-dashed flex justify-between items-end">
            <span className="text-sm font-medium text-zinc-500">Toplam Tutar</span>
            <span className="text-3xl font-black text-white italic">{total.toFixed(2)} TL</span>
          </div>
        </section>

        {/* Aksiyon Butonları */}
        <section className="grid grid-cols-1 gap-4">
          <button 
            onClick={handleRequestBill}
            disabled={isRequested}
            className={`flex items-center justify-center gap-3 py-5 rounded-2xl font-black transition-all transform active:scale-95 ${
              isRequested 
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
              : 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
            }`}
          >
            <Bell className={`w-5 h-5 ${isRequested ? 'animate-none' : 'animate-bounce'}`} />
            {isRequested ? 'HESAP İSTENDİ' : 'HESABI İSTE'}
          </button>

          <button className="flex items-center justify-center gap-3 py-5 bg-zinc-900 border border-zinc-800 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-colors">
            <CreditCard className="w-5 h-5" />
            ONLINE ÖDE
          </button>
        </section>

        {/* NoirPuan Wildcard Özelliği */}
        <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-center justify-between">
         
        </div>
      </main>
    </div>
  );
}