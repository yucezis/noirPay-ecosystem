import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import ProductList from './pages/ProductList';
import TableList from './pages/TableList';
import LoginPage from './pages/login'; 
import CategoryList from './pages/CategoryList';
import AddRestaurant from './pages/AddRestaurant';
import ActiveOrders from './pages/ActiveOrders';

// 🌟 YENİ: Dashboard'u kendi dosyasından import ediyoruz!
// (Dosya yolunun src/pages/Dashboard.tsx olduğunu varsayarak)
import Dashboard from './pages/Dashboard'; 

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
          {/* 🌟 YENİ: Ana sayfa açıldığında doğrudan Dashboard bileşeni yüklenecek */}
          <Route index element={<Dashboard />} />

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