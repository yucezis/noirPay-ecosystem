import React, { useState, useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { ChefHat, Clock, CheckCircle, UtensilsCrossed } from 'lucide-react';
import axios from 'axios';

const HUB_URL = 'https://localhost:7057/orderHub';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
}

interface IncomingOrder {
  orderId: string;
  tableId: string;
  tableName?: string;
  details: OrderItem[];
  orderTime: Date;
}

const ActiveOrders: React.FC = () => {
  const [orders, setOrders] = useState<IncomingOrder[]>([]);

  useEffect(() => {
    const restaurantId = localStorage.getItem("restaurantId");
    const token = localStorage.getItem("token");

    if (!restaurantId || restaurantId === 'undefined' || !token) {
      console.warn("⚠️ Oturum bilgileri eksik.");
      return; 
    }

    // 1. MEVCUT AKTİF SİPARİŞLERİ GETİR
    const fetchExistingOrders = async () => {
      try {
        const response = await axios.get(`https://localhost:7057/api/Order/active/${restaurantId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const mappedOrders = response.data.map((o: any) => ({
          orderId: o.id || o.Id,
          tableId: o.tableId || o.TableId,
          tableName: o.tableName || o.TableName,
          details: o.items || o.orderItems || [],
          orderTime: new Date(o.createdAt || o.CreatedTime || Date.now())
        }));

        setOrders(mappedOrders);
      } catch (err) {
        console.error("🔴 Sipariş çekme hatası:", err);
      }
    };

    // 2. SIGNALR CANLI BAĞLANTI
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .build();

    const startSignalR = async () => {
      try {
        await newConnection.start();
        await newConnection.invoke("JoinGroup", `Restorant_${restaurantId}`);

        newConnection.on("Yeni sipariş", (data: any) => {
          const newOrder: IncomingOrder = {
            orderId: data.orderId || data.Id,
            tableId: data.tableId || data.TableId,
            tableName: data.tableName || data.TableName,
            details: data.details || data.Details || [],
            orderTime: new Date()
          };
          setOrders(prev => [...prev, newOrder]);
        });
      } catch (err) {
        console.error("🔴 SignalR hatası:", err);
      }
    };

    fetchExistingOrders();
    startSignalR();

    return () => {
      if (newConnection) newConnection.stop();
    };
  }, []);

  // 3. TESLİM ET FONKSİYONU
  const markAsDelivered = async (orderId: string) => {
    const token = localStorage.getItem("token");

    try {
      // Backend'deki yeni 'deliver' endpoint'ine istek atıyoruz
      await axios.post(`https://localhost:7057/api/Order/deliver/${orderId}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Mutfak ekranından (local state) kaldırıyoruz
      setOrders(prev => prev.filter(o => o.orderId !== orderId));
      console.log(`✅ Sipariş ${orderId} teslim edildi.`);
    } catch (err) {
      console.error("🔴 Teslim hatası:", err);
      alert("Sipariş durumu güncellenemedi.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 p-8 font-sans">
      
      {/* HEADER */}
      <header className="flex items-center justify-between mb-10 pb-6 border-b border-zinc-800/50">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-orange-500" />
            Mutfak Paneli
          </h1>
          <p className="text-sm text-zinc-500 mt-2 font-medium tracking-wide uppercase">
            Hazırlanan ve Bekleyen Siparişler
          </p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-800">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
          <span className="text-sm font-bold text-zinc-300">Canlı Bağlantı Aktif</span>
        </div>
      </header>

      {/* SİPARİŞ LİSTESİ */}
      <main>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-50">
            <UtensilsCrossed className="w-20 h-20 text-zinc-700 mb-6" />
            <p className="text-xl font-bold text-zinc-500">Mutfak şu an sakin...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div 
                key={order.orderId} 
                className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-all duration-300"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 to-yellow-500"></div>

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-white leading-tight">
                                {order.tableName}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-orange-400 mt-1 font-bold">
                      <Clock className="w-3.5 h-3.5" />
                          {order.orderTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase tracking-wider rounded-lg border border-orange-500/20">
                    Bekliyor
                  </span>
                </div>

                <div className="space-y-4 mb-8 min-h-[120px]">
                  {order.details.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center bg-zinc-800 text-white font-bold rounded-md text-xs">
                          {item.quantity}x
                        </span>
                        <span className="font-semibold text-zinc-300">{item.name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => markAsDelivered(order.orderId)}
                  className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <CheckCircle className="w-5 h-5" />
                  TESLİM ET
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