import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import ProductList from './pages/ProductList';
import TableList from './pages/TableList';
import LoginPage from './pages/login'; 
import CategoryList from './pages/CategoryList';
import AddRestaurant from './pages/AddRestaurant';
import ActiveOrders from './pages/ActiveOrders';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const restaurantId = localStorage.getItem('restaurantId');
  
  if (!token || token === 'undefined' || !restaurantId || restaurantId === 'undefined') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={
            <div className="p-8">
              <h1 className="text-2xl font-bold text-gray-900">Hoş Geldin</h1>
              <p className="text-gray-500 mt-2">NoirPay bugün harika görünüyor.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                import { useState, useEffect } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import axios from 'axios';
import { LayoutGrid, Coffee, Users, CheckCircle2, Clock } from 'lucide-react';

// Masa verisi için arayüz
interface Table {
  id: string;
  tableNo: string;
  name: string;
  status: 'Empty' | 'Occupied'; // Backend'den veya aktif order kontrolünden gelecek
}

export default function Dashboard() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. İLK YÜKLEMEDE MASALARI GETİR
  useEffect(() => {
    const fetchTables = async () => {
      try {
        // Not: Backend'de masaları ve aktif adisyon durumlarını dönen bir endpoint'in olduğunu varsayıyoruz.
        // Eğer yoksa bunu şimdilik mock veriyle test edebilirsin.
        const response = await axios.get('https://localhost:7057/api/Table'); 
        
        // Örnek Gelen Veri Formatı Varsayımı:
        // [{ id: '...', tableNo: '1', status: 'Occupied' }, { id: '...', tableNo: '2', status: 'Empty' }]
        setTables(response.data);
      } catch (error) {
        console.error("Masalar çekilemedi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  // 2. 🌟 SIGNALR BAĞLANTISI VE ANLIK DİNLEME 🌟
  useEffect(() => {
    // Backend'deki Hub adresine bağlanıyoruz
    const connection = new HubConnectionBuilder()
      .withUrl("https://localhost:7057/orderHub") // Program.cs'de maplediğin hub adresi
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    const startConnection = async () => {
      try {
        await connection.start();
        console.log("⚡ SignalR Bağlantısı Başarılı! Canlı veriler dinleniyor...");

        // BACKEND'DEN GELEN "TableStatusChanged" SİNYALİNİ YAKALA
        connection.on("TableStatusChanged", (tableId: string, newStatus: string) => {
          console.log(`🔔 Masa Güncellemesi! Masa ID: ${tableId} | Yeni Durum: ${newStatus}`);
          
          // İlgili masanın statüsünü React State'inde anında güncelle
          setTables((prevTables) => 
            prevTables.map((t) => 
              t.id === tableId ? { ...t, status: newStatus as 'Empty' | 'Occupied' } : t
            )
          );
        });

      } catch (err) {
        console.error("SignalR Bağlantı Hatası: ", err);
      }
    };

    startConnection();

    // Sayfa kapandığında bağlantıyı kopar
    return () => {
      connection.stop();
    };
  }, []);

  if (loading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-zinc-500 font-bold">Kasa Yükleniyor...</div>;

  // İstatistikler
  const occupiedCount = tables.filter(t => t.status === 'Occupied').length;
  const emptyCount = tables.filter(t => t.status === 'Empty').length;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-200 font-sans selection:bg-orange-500/30 p-6">
      
      {/* Üst Bar */}
      <header className="flex items-center justify-between pb-8 border-b border-zinc-900 mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-widest uppercase italic text-white flex items-center gap-3">
            <LayoutGrid className="w-6 h-6 text-orange-500" />
            NOIR KASA
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Canlı Masa ve Adisyon Takibi</p>
        </div>
        
        {/* Canlı İstatistikler */}
        <div className="flex gap-4">
          <div className="flex items-center gap-3 bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-800">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-sm font-bold text-white">Dolu: {occupiedCount}</span>
          </div>
          <div className="flex items-center gap-3 bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-800">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm font-bold text-white">Boş: {emptyCount}</span>
          </div>
        </div>
      </header>

      {/* Masa Grid Yapısı */}
      <main className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {tables.map((table) => {
          const isOccupied = table.status === 'Occupied';

          return (
            <div 
              key={table.id}
              className={`relative overflow-hidden p-6 rounded-3xl border transition-all duration-500 cursor-pointer group ${
                isOccupied 
                  ? 'bg-zinc-900/80 border-red-500/30 hover:border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.05)]' 
                  : 'bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700'
              }`}
            >
              {/* Arka plan parlaması (Doluysa) */}
              {isOccupied && (
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
              )}

              <div className="flex justify-between items-start mb-6">
                <h3 className={`text-3xl font-black italic tracking-tighter ${isOccupied ? 'text-white' : 'text-zinc-500'}`}>
                  {table.tableNo}
                </h3>
                
                {/* Durum İkonu */}
                <div className={`p-2 rounded-xl ${isOccupied ? 'bg-red-500/10' : 'bg-zinc-800/50'}`}>
                  {isOccupied ? (
                    <Users className="w-5 h-5 text-red-500" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-zinc-600" />
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className={`text-xs font-bold uppercase tracking-widest ${isOccupied ? 'text-red-400' : 'text-zinc-600'}`}>
                  {isOccupied ? 'Masa Dolu' : 'Müsait'}
                </p>
                {isOccupied && (
                  <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Sipariş Bekleniyor / Açık
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </main>

    </div>
  );
}
              </div>
            </div>
          } />

          <Route path="products" element={<ProductList />} />
          <Route path="add-restaurant" element={<AddRestaurant />} />
          <Route path="categories" element={<CategoryList />} />
          <Route path="tables" element={<TableList />} />
          <Route path="orders" element={<ActiveOrders />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;