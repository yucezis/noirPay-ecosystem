import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import ProductList from './pages/ProductList';
import TableList from './pages/TableList';
import LoginPage from './pages/login'; // Login sayfanı içeri aldık

function App() {
  // Basit bir kimlik kontrolü: LocalStorage'da token var mı?
  // İleride bu kontrolü daha gelişmiş bir AuthContext ile yapabiliriz.
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. LOGIN ROTASI: Uygulama açıldığında ilk durak burası olabilir */}
        <Route path="/login" element={<LoginPage />} />

        {/* 2. KORUMALI ROTALAR: Eğer giriş yapılmadıysa kullanıcıyı Login'e fırlat */}
        <Route 
          path="/" 
          element={isAuthenticated ? <AdminLayout /> : <Navigate to="/login" replace />}
        >
          {/* Dashboard (Ana Sayfa) */}
          <Route index element={
            <div className="p-8">
              <h1 className="text-2xl font-bold text-gray-900">Hoş Geldin, Doğa!</h1>
              <p className="text-gray-500 mt-2">NoirPay bugün harika görünüyor. İşte genel özetin...</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-sm font-medium text-gray-400">Toplam Ürün</p>
                  <p className="text-3xl font-black mt-1">24</p>
                </div>
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-sm font-medium text-gray-400">Aktif Masalar</p>
                  <p className="text-3xl font-black mt-1">12</p>
                </div>
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-sm font-medium text-gray-400">Bugünkü Sipariş</p>
                  <p className="text-3xl font-black mt-1">156</p>
                </div>
              </div>
            </div>
          } />

          {/* Diğer sayfalarımız */}
          <Route path="products" element={<ProductList />} />
          <Route path="tables" element={<TableList />} />
          
          <Route path="orders" element={<div className="p-8 font-bold">Siparişler Paneli Hazırlanıyor...</div>} />
          <Route path="settings" element={<div className="p-8 font-bold">Ayarlar Paneli Hazırlanıyor...</div>} />
        </Route>

        {/* Tanımsız bir sayfaya gidilirse ana sayfaya (dolayısıyla giriş kontrolüne) yönlendir */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;