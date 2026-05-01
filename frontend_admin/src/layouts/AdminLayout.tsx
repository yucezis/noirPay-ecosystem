import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Coffee, 
  QrCode, 
  ClipboardList, 
  Settings, 
  LogOut,
  Bell,
  Store,
  Table,
  CheckCircle2
} from 'lucide-react';

const AdminLayout: React.FC = () => {
  const location = useLocation();

  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. LocalStorage'daki bilgileri temizle
    localStorage.removeItem('token');
    localStorage.removeItem('restaurantId'); 
    
    window.location.href = '/login'; 
  };

  // BİLDİRİM STATE'LERİ
  const [toast, setToast] = useState<{table: string, time: string} | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // SİGNALR GLOBAL DİNLEYİCİ
  useEffect(() => {
    const restaurantId = localStorage.getItem('restaurantId');
    if (!restaurantId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7057/orderHub")
      .withAutomaticReconnect()
      .build();

    const startConnection = async () => {
      try {
        await connection.start();
        await connection.invoke("JoinGroup", `Restorant_${restaurantId}`);
        
        connection.on("Yeni sipariş", (data: any) => {
          // Bildirimi ekranda göster
          setToast({
            table: data.tableId || data.TableId,
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
          });
          
          // Okunmamış bildirim sayısını artır
          setUnreadCount(prev => prev + 1);

          // 5 saniye sonra bildirimi ekrandan gizle
          setTimeout(() => {
            setToast(null);
          }, 5000);
        });

      } catch (err) {
        console.error("Global bildirim servisine bağlanılamadı:", err);
      }
    };

    startConnection();

    return () => {
      connection.stop();
    };
  }, []);

  // Menü elemanlarımızı tanımlıyoruz
  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/orders', icon: Table, label: 'Aktif Siparişler' },
    { path: '/***', icon: Table, label: 'Masa Doluluk' },
    { path: '/add-restaurant', icon: Store, label: 'Restorant' },
    { path: '/categories', icon: Coffee, label: 'Kategori Yönetimi' },
    { path: '/products', icon: Coffee, label: 'Ürün Yönetimi' },
    { path: '/tables', icon: QrCode, label: 'Masa Yönetimi' },
    { path: '/settings', icon: Settings, label: 'Ayarlar' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* SOL MENÜ (SIDEBAR) */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm z-10">
        {/* Logo Alanı */}
        <div className="h-16 flex items-center px-6 border-b border-gray-50">
          <div className="flex items-center gap-2 text-xl font-black tracking-tighter text-gray-900">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">N</span>
            </div>
            NOIR<span className="text-gray-400">PAY</span>
          </div>
        </div>

        {/* Navigasyon Linkleri */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Ana Menü</p>
          
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                  isActive 
                    ? 'bg-black text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Alt Kısım - Çıkış Yap */}
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-500 hover:bg-red-50 transition-colors font-medium text-sm"
          >
            <LogOut className="w-5 h-5" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* SAĞ TARAF (HEADER + İÇERİK ALANI) */}
      <div className="flex-1 flex flex-col relative">
        {/* YENİ SİPARİŞ POP-UP BİLDİRİMİ */}
        {toast && (
          <div className="absolute top-20 right-8 bg-white border border-gray-100 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-50 animate-in slide-in-from-right-8 fade-in duration-300 flex items-center gap-4 min-w-[300px]">
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-orange-500 animate-bounce" />
            </div>
            <div className="flex-1">
              <p className="font-black text-gray-900 text-sm">Yeni Sipnpariş Geldi!</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Masa: <span className="text-orange-500 font-bold text-sm">{toast.table}</span> • {toast.time}
              </p>
            </div>
            <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 px-2">
              ✕
            </button>
          </div>
        )}
        
        {/* ÜST BAR (HEADER) */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="text-sm text-gray-500 font-medium">
            Tarih: {new Date().toLocaleDateString('tr-TR')}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Çan İkonu */}
            <button 
              onClick={() => setUnreadCount(0)} // Tıklayınca sayacı sıfırla
              className="relative p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                AD
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-bold text-gray-700 leading-tight">Admin Kullanıcısı</p>
                <p className="text-xs text-gray-500 font-medium">Yönetici</p>
              </div>
            </div>
          </div>
        </header>

        {/* ANA İÇERİK (SAYFALARIN RENDER EDİLECEĞİ YER) */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50">
          {/* Outlet: Hangi URL'deysek o sayfanın içeriği buraya gelir */}
          <Outlet /> 
        </main>
        
      </div>
    </div>
  );
};

export default AdminLayout;