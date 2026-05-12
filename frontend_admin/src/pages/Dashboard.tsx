import { useState, useEffect } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import axios from 'axios';
import { LayoutGrid, Users, CheckCircle2, Clock, DollarSign, TrendingUp, ShoppingBag } from 'lucide-react';

interface Table {
  id: string;
  tableNo: string;
  name: string;
  status: 'Empty' | 'Occupied';
}

interface DashboardSummary {
  dailyRevenue: number;
  monthlyRevenue: number;
  totalOrdersToday: number;
  activeTablesCount: number;
}

export default function Dashboard() {
  const [tables, setTables] = useState<Table[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [tablesRes, summaryRes] = await Promise.all([
        axios.get('https://localhost:7057/api/Table'),
        axios.get('https://localhost:7057/api/Dashboard/summary')
      ]);

      setTables(tablesRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error("Veriler çekilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl("https://localhost:7057/orderHub")
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    const startConnection = async () => {
      try {
        await connection.start();
        connection.on("TableStatusChanged", (tableId: string, newStatus: string) => {
          setTables((prev) => prev.map((t) => t.id === tableId ? { ...t, status: newStatus as 'Empty' | 'Occupied' } : t));
          fetchData(); 
        });
      } catch (err) {
        console.error("SignalR Bağlantı Hatası: ", err);
      }
    };

    startConnection();
    return () => { connection.stop(); };
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 font-bold">Kasa Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-orange-500/30 p-8 space-y-8">
      
      <header className="flex items-center justify-between pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-black tracking-widest uppercase italic text-gray-900 flex items-center gap-3">
            <LayoutGrid className="w-8 h-8 text-orange-500" />
            NOIR DİJİTAL KASA
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Gerçek Zamanlı Ciro ve Adisyon Takibi</p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 relative overflow-hidden group hover:border-orange-500 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 rounded-2xl"><DollarSign className="w-6 h-6 text-orange-500" /></div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Bugünkü Ciro</p>
            <h2 className="text-3xl font-black text-gray-900 italic">{summary?.dailyRevenue.toFixed(2)} ₺</h2>
          </div>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 relative overflow-hidden group hover:border-green-500 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 rounded-2xl"><TrendingUp className="w-6 h-6 text-green-500" /></div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Aylık Toplam Ciro</p>
            <h2 className="text-3xl font-black text-gray-900 italic">{summary?.monthlyRevenue.toFixed(2)} ₺</h2>
          </div>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 relative overflow-hidden group hover:border-blue-500 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 rounded-2xl"><ShoppingBag className="w-6 h-6 text-blue-500" /></div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Bugünkü Adisyon</p>
            <h2 className="text-3xl font-black text-gray-900">{summary?.totalOrdersToday} <span className="text-lg text-gray-500 font-medium">Sipariş</span></h2>
          </div>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 relative overflow-hidden group hover:border-red-500 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-50 rounded-2xl">
              <Users className={`w-6 h-6 ${summary?.activeTablesCount && summary.activeTablesCount > 0 ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
            {summary?.activeTablesCount && summary.activeTablesCount > 0 && (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Dolu Masalar</p>
            <h2 className="text-3xl font-black text-gray-900">{summary?.activeTablesCount} <span className="text-lg text-gray-500 font-medium">Masa</span></h2>
          </div>
        </div>

      </section>

      <section className="pt-6">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gray-300"></span> RESTORAN DÜZENİ
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {tables.map((table) => {
            const isOccupied = table.status === 'Occupied';

            return (
              <div 
                key={table.id}
                className={`relative overflow-hidden p-6 rounded-3xl border transition-all duration-300 cursor-pointer group ${
                  isOccupied 
                    ? 'bg-white border-red-500 shadow-[0_4px_20px_rgba(239,68,68,0.15)] hover:shadow-[0_4px_25px_rgba(239,68,68,0.25)]' 
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {isOccupied && <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>}
                
                <div className="flex justify-between items-start mb-6">
                  <h3 className={`text-3xl font-black italic tracking-tighter ${isOccupied ? 'text-gray-900' : 'text-gray-400'}`}>
                    {table.tableNo}
                  </h3>
                  <div className={`p-2 rounded-xl ${isOccupied ? 'bg-red-50' : 'bg-gray-50'}`}>
                    {isOccupied ? <Users className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className={`text-xs font-bold uppercase tracking-widest ${isOccupied ? 'text-red-500' : 'text-gray-400'}`}>
                    {isOccupied ? 'Masa Dolu' : 'Müsait'}
                  </p>
                  {isOccupied && (
                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Açık Adisyon
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}