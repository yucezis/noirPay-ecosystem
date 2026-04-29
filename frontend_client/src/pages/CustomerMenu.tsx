import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag,  ChevronRight, Loader2, Plus } from 'lucide-react';

const API_URL = 'https://localhost:7057/api';

const CustomerMenu: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>(''); 
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        const [categoryRes, productRes] = await Promise.all([
          fetch(`${API_URL}/Category`, { headers }),
          fetch(`${API_URL}/Product`, { headers })
        ]);

        const categoryData = await categoryRes.json();
        const productData = await productRes.json();

        setCategories(categoryData);
        setProducts(productData);

        if (categoryData.length > 0) {
          setActiveCategory(categoryData[0].id || categoryData[0].Id);
        }
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenuData();
  }, []);

  const filteredProducts = products.filter(product => {
    const catId = product.categoryId || product.CategoryId;
    const pName = (product.name || product.Name || "").toLowerCase();
    const matchesCategory = catId === activeCategory;
    const matchesSearch = pName.includes(searchQuery.toLowerCase());
    return searchQuery ? matchesSearch : matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] text-zinc-400">
        <Loader2 className="w-10 h-10 animate-spin text-white mb-4" />
        <p className="text-sm font-medium tracking-widest uppercase">NoirPay</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 font-sans pb-28">
      
      {/* HEADER SECTION */}
      <header className="sticky top-0 z-30 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Noir Cafe</h1>
              <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-1 font-medium uppercase tracking-wider">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Açık • Kadıköy, İstanbul
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
              <span className="text-xl font-black text-white">N</span>
            </div>
          </div>

          {/* SEARCH BAR - Admin Panel Input Stilinde */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
            <input 
              type="text" 
              placeholder="Lezzet keşfine çık..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:bg-zinc-900 transition-all placeholder:text-zinc-600"
            />
          </div>
        </div>

        {/* CATEGORIES - Pill Style */}
        <div className="px-6 pb-4 overflow-x-auto flex gap-2 no-scrollbar">
          {categories.map((category) => {
            const id = category.id || category.Id;
            const name = category.name || category.Name;
            const isActive = activeCategory === id && !searchQuery;
            return (
              <button
                key={id}
                onClick={() => { setActiveCategory(id); setSearchQuery(''); }}
                className={`whitespace-nowrap px-5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive 
                    ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-600'
                }`}
              >
                {name.toUpperCase()}
              </button>
            );
          })}
        </div>
      </header>

      {/* PRODUCT LIST */}
      <main className="px-6 mt-6 max-w-2xl mx-auto space-y-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
            <p className="text-zinc-500 text-sm">Aradığınız ürün bulunamadı.</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const id = product.id || product.Id;
            const name = product.name || product.Name;
            const desc = product.description || product.Description;
            const price = product.price || product.Price || 0;
            const img = product.imageUrl || product.ImageUrl;

            return (
              <div 
                key={id} 
                className="flex gap-4 p-2 bg-zinc-900/20 hover:bg-zinc-900/40 rounded-[2rem] transition-all duration-300 border border-transparent hover:border-zinc-800 group"
              >
                {/* Ürün Görseli */}
                <div className="relative w-24 h-24 shrink-0 rounded-[1.5rem] overflow-hidden bg-zinc-800">
                  {img ? (
                    <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600 uppercase">Noir</div>
                  )}
                </div>

                {/* Ürün Detay */}
                <div className="flex-1 flex flex-col justify-center pr-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-zinc-100 group-hover:text-white transition-colors">{name}</h3>
                    <span className="font-bold text-sm text-white">
                      {price} <span className="text-[10px] text-zinc-500">TL</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 font-medium leading-relaxed">
                    {desc}
                  </p>
                  <div className="mt-3 flex justify-end">
                    <button className="p-1.5 bg-white rounded-full text-black hover:bg-zinc-200 transition-colors shadow-lg">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* FLOATING CART BAR */}
      <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center pointer-events-none">
        <button className="pointer-events-auto bg-white text-black w-full max-w-md rounded-2xl py-4 px-6 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] group overflow-hidden relative">
          <div className="absolute inset-0 bg-zinc-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <div className="relative flex items-center gap-4">
            <div className="bg-black text-white p-2 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Sipariş Hazır mı?</p>
              <p className="text-sm font-black">2 Ürün • 365.00 TL</p>
            </div>
          </div>
          <div className="relative flex items-center gap-1 text-sm font-bold">
            ÖDE <ChevronRight className="w-4 h-4" />
          </div>
        </button>
      </div>

    </div>
  );
};

export default CustomerMenu;