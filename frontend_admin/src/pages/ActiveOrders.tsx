import React, { useState, useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { ChefHat, Clock, CheckCircle, UtensilsCrossed } from 'lucide-react';
import axios from 'axios';

const HUB_URL = 'https://localhost:7057/orderHub';

// Arayüz ve Veritabanı tiplerini eşliyoruz
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
}

interface IncomingOrder {
  orderId: string;
  tableId: string;
  tableName?: string; // Masa adı (Masa 1 gibi)
  details: OrderItem[];
  orderTime: Date;
  status: 'preparing' | 'ready';
}

const ActiveOrders: React.FC = () => {
  const [orders, setOrders] = useState<IncomingOrder[]>([]);

  useEffect(() => {
    // 1. KASADAN VERİLERİ ÇEK
    const restaurantId = localStorage.getItem("restaurantId");
    const token = localStorage.getItem("token");

    if (!restaurantId || restaurantId === 'undefined' || !token) {
      console.warn("⚠️ Oturum bilgileri eksik. İstek gönderilmedi.");
      return; 
    }

    // 2. VERİTABANINDAN MEVCUT SİPARİŞLERİ ÇEK 
    const fetchExistingOrders = async () => {
      try {
        // Backend'deki OrderController endpoint'ine gidiyoruz
        const response = await axios.get(`https://localhost:7057/api/Order/active/${restaurantId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const mappedOrders = response.data.map((o: any) => ({
          orderId: o.id || o.Id,
          tableId: o.tableId || o.TableId,
          tableName: o.tableName || o.TableName,
          details: o.items || o.orderItems || [],
          orderTime: new Date(o.createdTime || o.CreatedTime || o.createdAt),
          status: 'preparing'
        }));

        setOrders(mappedOrders);
        console.log("✅ DB'deki siparişler başarıyla yüklendi.");
      } catch (err) {
        console.error("🔴 Sipariş çekme hatası:", err);
      }
    };

    // 3. SIGNALR İLE CANLI BAĞLANTIYI KUR
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .build();

    const startSignalR = async () => {
      try {
        await newConnection.start();
        console.log("🟢 SignalR Hub Bağlantısı Aktif.");

        await newConnection.invoke("JoinGroup", `Restorant_${restaurantId}`);

        newConnection.on("Yeni sipariş", (data: any) => {
          console.log("🔥 Anlık Sipariş Düştü:", data);
          
          const newOrder: IncomingOrder = {
            orderId: data.orderId || data.Id || Math.random().toString(),
            tableId: data.tableId || data.TableId,
            details: data.details || data.Details || [],
            orderTime: new Date(),
            status: 'preparing'
          };

          setOrders(prev => [...prev, newOrder]);
        });
      } catch (err) {
        console.error("🔴 SignalR hatası:", err);
      }
    };

    fetchExistingOrders();
    startSignalR();

    // Sayfa kapandığında bağlantıyı durdur
    return () => {
      if (newConnection) newConnection.stop();
    };
  }, []); // Sadece sayfa açıldığında bir kez çalışır

  // Siparişi tamamla butonu için fonksiyon
  const markAsReady = async (orderId: string) => {
  const token = localStorage.getItem("token");

  try {
    // 1. Backend'e "Bu sipariş bitti" de
    await axios.post(`https://localhost:7057/api/Order/complete/${orderId}`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // 2. Local State'den kaldır (Arayüzde şık bir kaybolma efekti için)
    setOrders(prev => prev.filter(o => o.orderId !== orderId));
    
    console.log(`✅ Sipariş ${orderId} tamamlandı.`);
  } catch (err) {
    console.error("🔴 Sipariş tamamlanırken hata oluştu:", err);
    alert("Sipariş durumu güncellenemedi, lütfen bağlantınızı kontrol edin.");
  }
};


  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 p-8 font-sans">
      
      {/* HEADER SECTION */}
      <header className="flex items-center justify-between mb-10 pb-6 border-b border-zinc-800/50">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-orange-500" />
            Aktif Siparişler
          </h1>
          <p className="text-sm text-zinc-500 mt-2 font-medium tracking-wide uppercase">
            Mutfak Yönetim Ekranı (KDS)
          </p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-800">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
          <span className="text-sm font-bold text-zinc-300">Sistem Aktif</span>
        </div>
      </header>

      {/* SİPARİŞLER IZGARASI */}
      <main>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-50">
            <UtensilsCrossed className="w-20 h-20 text-zinc-700 mb-6" />
            <p className="text-xl font-bold text-zinc-500">Şu an aktif sipariş bulunmuyor</p>
            <p className="text-sm text-zinc-600 mt-2">Müşterilerden gelen siparişler burada belirecektir.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div 
                key={order.orderId} 
                className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-colors animate-in slide-in-from-bottom-4 fade-in duration-500"
              >
                {/* Yeni Sipariş Parlaması (Animasyonlu Arka Plan) */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 to-yellow-500"></div>

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-white">{order.tableId}</h2>
                    <div className="flex items-center gap-1.5 text-xs text-orange-400 mt-1 font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      {order.orderTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-wider rounded-lg border border-orange-500/20">
                    Hazırlanıyor
                  </span>
                </div>

                <div className="space-y-4 mb-8 min-h-[120px]">
                  {order.details.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center bg-zinc-800 text-white font-bold rounded-md text-xs">
                          {item.quantity || item.Quantity}x
                        </span>
                        <span className="font-semibold text-zinc-300">{item.name || item.Name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => markAsReady(order.orderId)}
                  className="w-full py-4 bg-white hover:bg-zinc-200 text-black rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  Siparişi Tamamla
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

    </div>
  );
};

export default ActiveOrders;