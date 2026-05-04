import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import ProductList from './pages/ProductList';
import TableList from './pages/TableList';
import LoginPage from './pages/login'; 
import CategoryList from './pages/CategoryList';
import AddRestaurant from './pages/AddRestaurant';
import ActiveOrders from './pages/ActiveOrders';

// 🛡️ Korumalı Rota: Yetkisiz girişi engeller ve veri senkronizasyonunu sağlar
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const restaurantId = localStorage.getItem('restaurantId');
  
  // Veri yoksa veya bozuksa (undefined) girişe atar
  if (!token || token === 'undefined' || !restaurantId || restaurantId === 'undefined') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Herkese Açık Rota */}
        <Route path="/login" element={<LoginPage />} />

        {/* Korumalı Rota Grubu */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={
            <div className="p-8">
              <h1 className="text-2xl font-bold text-gray-900">Hoş Geldin, Doğa</h1>
              <p className="text-gray-500 mt-2">NoirPay bugün harika görünüyor.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {/* İstatistik Kartları Buraya */}
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