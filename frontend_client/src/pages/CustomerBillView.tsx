import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; 
import { Receipt, Bell, CreditCard, ArrowLeft, History, X, Users, PieChart, CheckSquare } from 'lucide-react';
import axios from 'axios';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export default function CustomerBillView() {
  const { tableId } = useParams<{ tableId: string }>();

  // --- API State'leri ---
  const [items, setItems] = useState<OrderItem[]>([]);
  const [total, setTotal] = useState(0);
  const [tableNo, setTableNo] = useState<string>(''); 
  const [isActive, setIsActive] = useState<boolean>(true);
  
  // --- UI State'leri ---
  const [loading, setLoading] = useState(true);
  const [isRequested, setIsRequested] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); 

  useEffect(() => {
    const fetchBill = async () => {
      if (!tableId) return;

      try {
        const response = await axios.get(`https://localhost:7057/api/Order/active-table/${tableId}`);
        
        setItems(response.data.items || []);
        setTotal(response.data.totalAmount || 0);
        setTableNo(response.data.tableNo || "Bilinmiyor"); 
        setIsActive(response.data.isActive !== undefined ? response.data.isActive : true); 

      } catch (err) {
        console.error("Hesap çekilemedi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [tableId]);

  const handleBringToTable = async () => {
    try {
      await axios.post(`https://localhost:7057/api/Order/request-bill/${tableId}`);
      setIsRequested(true);
      alert("Hesap talebiniz başarıyla garsona iletildi. 🥂");
    } catch (err) {
      alert("Bir hata oluştu, lütfen garsonu çağırın.");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-zinc-500">NoirPay Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-200 font-sans selection:bg-orange-500/30 relative">
      
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
        
        {/* Masa Bilgisi ve Sipariş Durumu */}
        <section className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Adisyon Detayı</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
              {isActive ? 'Aktif' : 'Kapalı'}
            </span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">Masa {tableNo}</h2>
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
          
          {/* 1. ONLINE ÖDE BUTONU (MODALI AÇAR) */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-3 py-5 bg-white text-black rounded-2xl font-black hover:bg-zinc-200 transition-all transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <CreditCard className="w-5 h-5" />
            ONLINE ÖDE
          </button>

          {/* 2. HESABI MASAYA GETİR BUTONU */}
          <button 
            onClick={handleBringToTable}
            disabled={isRequested}
            className={`flex items-center justify-center gap-3 py-5 bg-zinc-900 border border-zinc-800 rounded-2xl font-bold transition-colors ${
              isRequested 
              ? 'text-zinc-500 cursor-not-allowed' 
              : 'text-white hover:bg-zinc-800'
            }`}
          >
            <Bell className={`w-5 h-5 ${isRequested ? 'animate-none' : 'animate-bounce'}`} />
            {isRequested ? 'TALEP İLETİLDİ' : 'HESABI MASAYA GETİR'}
          </button>
          
        </section>

        {/* NoirPuan Wildcard Özelliği */}
        <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-center justify-between">
         
        </div>
      </main>

      {/* ÖDEME SEÇENEKLERİ MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-0 animate-in fade-in duration-200">
          <div className="bg-[#0D0D0D] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-white">Ödeme Yöntemi</h3>
                <p className="text-xs text-zinc-500 mt-1">Lütfen ödeme şeklini seçin</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Butonları */}
            <div className="space-y-3">
              <button className="w-full flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-colors group">
                <div className="p-2 bg-zinc-800 rounded-xl group-hover:bg-zinc-700 transition-colors">
                  <Users className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold text-white">Bölerek Öde</span>
                  <span className="text-[10px] text-zinc-500">Hesabı kişi sayısına eşit bölün</span>
                </div>
              </button>

              <button className="w-full flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-colors group">
                <div className="p-2 bg-zinc-800 rounded-xl group-hover:bg-zinc-700 transition-colors">
                  <PieChart className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold text-white">Belirli Bir Kısmını Öde</span>
                  <span className="text-[10px] text-zinc-500">Kendi belirlediğiniz tutarı ödeyin</span>
                </div>
              </button>

              <button className="w-full flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-colors group">
                <div className="p-2 bg-zinc-800 rounded-xl group-hover:bg-zinc-700 transition-colors">
                  <CheckSquare className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold text-white">Ürün Seçerek Öde</span>
                  <span className="text-[10px] text-zinc-500">Sadece yediklerinizi ödeyin</span>
                </div>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}