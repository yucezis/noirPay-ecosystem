import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // 🌟 useParams EKLENDİ
import { Search, ShoppingBag, ChevronRight, Loader2, Plus, Minus, Receipt } from 'lucide-react';
import * as signalR from '@microsoft/signalr';

const API_URL = 'https://localhost:7057/api';
const HUB_URL = 'https://localhost:7057/OrderHub'; 

const CustomerMenu: React.FC = () => {
  const navigate = useNavigate(); 
  
  const { restaurantId, tableId } = useParams<{ restaurantId: string, tableId: string }>();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState<string>(''); 
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        if (!restaurantId) {
           setRestaurant({ name: "Hata", location: "Lütfen geçerli bir QR kod okutun." });
           setLoading(false);
           return; 
        }

        const token = localStorage.getItem('token');
        const headers = { 
          'Authorization': token ? `Bearer ${token}` : '', 
          'Content-Type': 'application/json' 
        };

        const [categoryRes, productRes, restRes] = await Promise.all([
          fetch(`${API_URL}/Category?restaurantId=${restaurantId}`, { headers }),
          fetch(`${API_URL}/Product?restaurantId=${restaurantId}`, { headers }),
          fetch(`${API_URL}/Restaurant/${restaurantId}`, { headers })
        ]);

        const categoryData = await categoryRes.json();
        const productData = await productRes.json();
        
        if(restRes.ok) {
           const restData = await restRes.json();
           setRestaurant(restData);
        }

        setCategories(categoryData);
        setProducts(productData);

        if (categoryData.length > 0) {
          setActiveCategory(String(categoryData[0].id || categoryData[0].Id).toLowerCase());
        }
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMenuData();
  }, [restaurantId]);

  useEffect(() => {
    const connectSignalR = async () => {
      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL)
        .withAutomaticReconnect()
        .build();

      try {
        await newConnection.start();
        setConnection(newConnection);

        const currentTableId = tableId || "A-01"; 
        const groupId = `${restaurantId}-${currentTableId}`;
        await newConnection.invoke("JoinGroup", groupId);

        newConnection.on("ReceiveCartUpdate", (updatedCart: any[]) => {
          setCart(updatedCart);
        });

        newConnection.on("Siparişiniz mutfağa iletildi", () => {
          setIsOrderPlaced(true); 
          setCart([]); 
          broadcastCartUpdate([]); 
        });

      } catch (error) {
        console.error("🔴 SignalR Bağlantı Hatası:", error);
      }
    };

    connectSignalR();

    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, [restaurantId, tableId]);

  const broadcastCartUpdate = async (newCart: any[]) => {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      try {
        const currentTableId = tableId || "A-01"; 
        const groupId = `${restaurantId}-${currentTableId}`;
        
        await connection.invoke("UpdateCart", groupId, newCart);
      } catch (error) {
        console.error("Sepet yayınlanırken hata:", error);
      }
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || !connection) return;

    try {
      const currentTableId = tableId || "A-01"; 
      await connection.invoke("SendOrder", restaurantId, currentTableId, cart);
    } catch (error) {
      alert("Bağlantı hatası: Siparişiniz iletilemedi.");
    }
  };

  const handleGoToBill = () => {
    const currentTableId = tableId || "A-01";
    navigate(`/bill/${currentTableId}`);
  };
  const addToCart = (product: any) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => (item.id || item.Id) === (product.id || product.Id));
      let newCart;
      if (existingItem) {
        newCart = prevCart.map(item => 
          (item.id || item.Id) === (product.id || product.Id) ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        newCart = [...prevCart, { ...product, quantity: 1 }];
      }
      broadcastCartUpdate(newCart);
      return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => {
      const newCart = prevCart.map(item => {
        if ((item.id || item.Id) === productId) {
          return { ...item, quantity: Math.max(0, item.quantity - 1) };
        }
        return item;
      }).filter(item => item.quantity > 0);
      broadcastCartUpdate(newCart);
      return newCart;
    });
  };

  const cartTotalAmount = cart.reduce((total, item) => total + ((item.price || item.Price) * item.quantity), 0);
  const cartTotalItems = cart.reduce((total, item) => total + item.quantity, 0);

  const renderProductCard = (product: any) => {
    const id = product.id || product.Id;
    const name = product.name || product.Name;
    const desc = product.description || product.Description;
    const price = product.price || product.Price || 0;
    const img = product.imageUrl || product.ImageUrl;
    
    const cartItem = cart.find(item => (item.id || item.Id) === id);
    const quantityInCart = cartItem ? cartItem.quantity : 0;

    return (
      <div key={id} className="flex gap-4 p-2 bg-zinc-900/20 hover:bg-zinc-900/40 rounded-[2rem] transition-all duration-300 border border-transparent hover:border-zinc-800 group">
        <div className="relative w-24 h-24 shrink-0 rounded-[1.5rem] overflow-hidden bg-zinc-800">
          {img ? (
            <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600 uppercase">Noir</div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center pr-2">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-zinc-100 group-hover:text-white transition-colors">{name}</h3>
            <span className="font-bold text-sm text-white whitespace-nowrap ml-2">
              {price} <span className="text-[10px] text-zinc-500">TL</span>
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 font-medium leading-relaxed">{desc}</p>
          
          <div className="mt-3 flex justify-end items-center">
            {quantityInCart > 0 ? (
              <div className="flex items-center gap-3 bg-zinc-800/80 rounded-full p-1 shadow-inner border border-zinc-700">
                <button onClick={() => removeFromCart(id)} className="w-7 h-7 flex items-center justify-center bg-zinc-900 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-bold w-4 text-center">{quantityInCart}</span>
                <button onClick={() => addToCart(product)} className="w-7 h-7 flex items-center justify-center bg-white rounded-full text-black hover:bg-zinc-200 transition-colors">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button onClick={() => addToCart(product)} className="p-1.5 bg-white rounded-full text-black hover:bg-zinc-200 transition-colors shadow-lg">
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] text-zinc-400">
        <Loader2 className="w-10 h-10 animate-spin text-white mb-4" />
        <p className="text-sm font-medium tracking-widest uppercase">Mekan Hazırlanıyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 font-sans pb-28">
      {/* HEADER SECTION */}
      <header className="sticky top-0 z-30 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{restaurant?.name || restaurant?.Name || "Restoran"}</h1>
              <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-1 font-medium uppercase tracking-wider">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Açık • {restaurant?.location || restaurant?.Location || "Konum Bulunamadı"}
              </p>
            </div>
            
            {/* 🌟 EKLENDİ: HESABIM BUTONU VE LOGO YANYANA 🌟 */}
            <div className="flex items-center gap-3">
              <button 
                onClick={handleGoToBill} 
                className="h-12 px-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-2 hover:bg-zinc-800 transition-colors shadow-lg"
              >
                <Receipt className="w-5 h-5 text-orange-500" />
                <span className="font-bold text-sm text-white">Hesabım</span>
              </button>
              
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
                <span className="text-xl font-black text-white">{(restaurant?.name || restaurant?.Name || "N").charAt(0).toUpperCase()}</span>
              </div>
            </div>
            
          </div>

          {/* SEARCH BAR */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
            <input 
              type="text" placeholder="Lezzet keşfine çık..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:bg-zinc-900 transition-all placeholder:text-zinc-600"
            />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="px-6 mt-6 max-w-2xl mx-auto space-y-4">
        {/* ... (Arama Sonuçları, Kategoriler ve Sipariş Alındı kısımları aynı) ... */}
        {searchQuery ? (
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-2 mb-4">Arama Sonuçları</h2>
            {products.filter(p => String(p.name || p.Name || "").toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
                <p className="text-zinc-500 text-sm">Aradığınız ürün bulunamadı.</p>
              </div>
            ) : (
              products.filter(p => String(p.name || p.Name || "").toLowerCase().includes(searchQuery.toLowerCase())).map(product => renderProductCard(product))
            )}
          </div>
        ) : (
          categories.map((category) => {
            const catId = String(category.id || category.Id).toLowerCase();
            const catName = category.name || category.Name;
            const isOpen = activeCategory === catId;
            const categoryProducts = products.filter(p => String(p.categoryId || p.CategoryId || "").toLowerCase() === catId);

            if (categoryProducts.length === 0) return null;

            if (isOrderPlaced) {
              return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] text-zinc-100 p-6 text-center animate-in fade-in duration-700">
                  <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                      <span className="text-3xl">👨‍🍳</span>
                    </div>
                  </div>
                  <h1 className="text-3xl font-black mb-2 tracking-tight text-white">Siparişiniz Alındı!</h1>
                  <p className="text-zinc-400 mb-8 max-w-xs leading-relaxed">
                    Lezzetleriniz mutfağa başarıyla iletildi ve şu an şeflerimiz tarafından özenle hazırlanıyor <br/>(Status: Preparing).
                  </p>
                  <button
                    onClick={() => setIsOrderPlaced(false)}
                    className="px-8 py-3 bg-zinc-900 border border-zinc-800 rounded-full text-sm font-bold text-white hover:bg-zinc-800 transition-colors"
                  >
                    Menüye Geri Dön
                  </button>
                </div>
              );
            }

            return (
              <div key={catId} className="flex flex-col gap-3">
                <button
                  onClick={() => setActiveCategory(isOpen ? '' : catId)}
                  className={`flex items-center justify-between w-full p-5 rounded-2xl border transition-all duration-300 ${isOpen ? 'bg-zinc-800/80 border-zinc-700 shadow-lg' : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50'}`}
                >
                  <span className={`font-bold text-lg tracking-tight ${isOpen ? 'text-white' : 'text-zinc-300'}`}>{catName}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-zinc-700' : 'bg-zinc-800'}`}>
                    <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-90 text-white' : ''}`} />
                  </div>
                </button>
                {isOpen && (
                  <div className="flex flex-col gap-4 pt-2 pb-4 animate-in slide-in-from-top-4 fade-in duration-300">
                    {categoryProducts.map(product => renderProductCard(product))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

      {/* FLOATING CART BAR */}
      {cartTotalItems > 0 && (
        <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center pointer-events-none animate-in slide-in-from-bottom-10 fade-in duration-300">
          
          <button 
            onClick={handleCheckout} 
            className="pointer-events-auto bg-white text-black w-full max-w-md rounded-2xl py-4 px-6 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-zinc-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <div className="relative flex items-center gap-4">
              <div className="bg-black text-white p-2 rounded-xl relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cartTotalItems}</span>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Siparişi Tamamla</p>
                <p className="text-sm font-black">{cartTotalAmount.toLocaleString('tr-TR')} TL</p>
              </div>
            </div>
            <div className="relative flex items-center gap-1 text-sm font-bold">
              ÖDE <ChevronRight className="w-4 h-4" />
            </div>
          </button>
          
        </div>
      )}
    </div>
  );
};

export default CustomerMenu;