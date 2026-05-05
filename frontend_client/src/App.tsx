import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerMenu from './pages/CustomerMenu'; 
import CustomerBillView from './pages/CustomerBillView'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/menu/:restaurantId/:tableId" element={<CustomerMenu />} />

        <Route path="/bill/:tableId" element={<CustomerBillView />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;