import React, { useState, useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { ChefHat, Clock, CheckCircle, UtensilsCrossed } from 'lucide-react';

const HUB_URL = 'https://localhost:7057/orderHub';

// Gelecek olan sipariş verisinin tipini belirliyoruz
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface IncomingOrder {
  orderId: string; // React tarafında benzersiz kılmak için
  tableId: string;
  details: OrderItem[];
  orderTime: Date;
  status: 'preparing' | 'ready';
}

const token = localStorage.getItem("token");
const restaurantId = localStorage.getItem("restaurantId");

const ActiveOrders: React.FC = () => {
  const [orders, setOrders] = useState<IncomingOrder[]>([]);
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

  const RESTAURANT_ID = localStorage.getItem("restaurantId");

  useEffect(() => {
    if(!RESTAURANT_ID){
        console.error("giriş yapınız");
        return;
    }
    const connectSignalR = async () => {
      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL)
        .withAutomaticReconnect()
        .build();

      try {
        await newConnection.start();
        console.log("🟢 Mutfak SignalR Bağlantısı Başarılı!");
        setConnection(newConnection);

        // 1. Mutfak ekranı, "Bu Restoranın" grubuna katılıyor
        // C# tarafında SendOrder metodunda kullandığın grup adı: $"Restorant_{restaurantId}"
        await newConnection.invoke("JoinGroup", `Restorant_${RESTAURANT_ID}`);

        // 2. Müşteriden gelen "Yeni sipariş" bildirimini dinliyoruz
        newConnection.on("Yeni sipariş", (data: { tableId: string, details: any[] }) => {
          console.log("🔥 Yeni Sipariş Düştü!", data);
          
          const newOrder: IncomingOrder = {
            orderId: data.orderId || data.OrderId || "bilinmeyen id", 
            tableId: data.tableId || data.TableId,
            details: data.details || data.Details,
            orderTime: new Date(),
            status: 'preparing'
          };

          // Yeni gelen siparişi listeye ekle
          setOrders(prevOrders => [...prevOrders, newOrder]);
        });

      } catch (error) {
        console.error("🔴 Mutfak SignalR Bağlantı Hatası:", error);
      }
    };

    connectSignalR();

    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, []);

  // Siparişi tamamlandı olarak işaretleme fonksiyonu
  const markAsReady = (orderId: string) => {
    setOrders(prevOrders => prevOrders.filter(order => order.orderId !== orderId));
    // İleride buraya: "Müşterinin ekranına 'Siparişiniz Hazır' bildirimi yolla" eklenebilir.
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