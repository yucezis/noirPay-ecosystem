import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import ProductList from './pages/ProductList';
import TableList from './pages/TableList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Tüm admin sayfalarını AdminLayout içine sarmalıyoruz */}
        <Route path="/" element={<AdminLayout />}>
          
          {/* Varsayılan ana sayfa (şimdilik boş bir dashboard) */}
          <Route index element={
            <div className="p-8">
              <h1 className="text-2xl font-bold text-gray-800">Hoş Geldiniz</h1>
              <p className="text-gray-500 mt-2">NoirPay yönetim paneli özeti buraya gelecek.</p>
            </div>
          } />
          
          {/* Daha önce yaptığımız sayfalar */}
          <Route path="products" element={<ProductList />} />
          <Route path="tables" element={<TableList />} />
          
          {/* Henüz yapmadığımız sayfalar için geçici alanlar */}
          <Route path="orders" element={<div className="p-8 font-bold">Siparişler Yakında...</div>} />
          <Route path="settings" element={<div className="p-8 font-bold">Ayarlar Yakında...</div>} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;