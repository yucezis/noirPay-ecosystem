import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, CreditCard, Utensils, ShoppingBag, TrendingUp } from 'lucide-react';
import axios from 'axios';

export default function LoginPage() { 
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🛡️ 1. ÇİFT TIKLAMA KONTROLÜ
    // Eğer halihazırda bir istek varsa, ikinciyi başlatma
    if (isLoading) return;

    setIsLoading(true);

    try {
        const response = await axios.post("https://localhost:7057/api/auth/login", { 
            email, 
            password 
        });
        
        // 🕵️‍♂️ 2. VERİ DOĞRULAMA (HAYATİ ÖNEMDE!)
        // Sadece ve sadece veri gelmişse kasaya dokunuyoruz
        if (response.data && response.data.accessToken && response.data.restaurantId) {
            const token = response.data.accessToken;
            const restId = response.data.restaurantId;

            // Önce nükleer temizlik
            localStorage.clear();

            // Sonra sağlam veriyi yaz
            localStorage.setItem("token", token);
            localStorage.setItem("restaurantId", restId);

            console.log("✅ Giriş başarılı, veriler kasaya kilitlendi.");
            
            // Reload yapmadan yumuşak geçiş
            navigate('/'); 
        } else {
            console.error("❌ Sunucu başarılı döndü ama beklenen veriler pakette yok!");
        }

    } catch (err: any) {
        console.error("❌ Giriş işlemi başarısız:", err);
        alert("Giriş yapılamadı, lütfen bilgilerinizi kontrol edin.");
    } finally {
        // İstek bittiğinde kilidi kaldır
        setIsLoading(false);
    }
};

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-100 to-slate-200">
      {/* LEFT: FORM SECTION */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-12 border border-white/20">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-4 mb-10">
            <div className="bg-gradient-to-br from-slate-900 to-slate-700 p-4 rounded-2xl shadow-lg">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">NoirPay</h1>
              <p className="text-sm text-slate-500">Restoran Yönetim Sistemi</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-slate-900">Hoş Geldiniz 👋</h2>
            <p className="text-base text-slate-500 mt-1">Hesabınıza giriş yapın</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresi"
                required
                className="w-full pl-12 pr-4 py-4 rounded-xl text-base bg-slate-100 border border-transparent focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-300 transition outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifre"
                required
                className="w-full pl-12 pr-12 py-4 rounded-xl text-base bg-slate-100 border border-transparent focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-300 transition outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="flex items-center justify-between text-base">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-slate-900 w-4 h-4"
                />
                Beni hatırla
              </label>
              <button type="button" className="text-slate-700 hover:underline font-medium">Şifremi unuttum?</button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 text-lg rounded-xl bg-slate-900 text-white font-medium transition shadow-lg ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-800'}`}
            >
              {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-8 text-slate-400 text-sm">
            <div className="flex-1 h-px bg-slate-200" />
            veya
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <p className="text-center text-base text-slate-500">
            Hesabın yok mu? <button type="button" className="text-slate-900 font-medium hover:underline">Kaydol</button>
          </p>
        </div>
      </div>

      {/* RIGHT: INFO SECTION */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-black" />
        <div className="absolute w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -top-20 -right-20" />
        <div className="absolute w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl -bottom-20 -left-20" />

        <div className="relative z-10 text-white max-w-xl p-12">
          <h2 className="text-4xl font-semibold mb-6 leading-tight">
            NoirPay ile Restoranını<br />Dijitalleştir
          </h2>
          <p className="text-lg text-slate-300 mb-12">
            Tüm operasyonlarını tek panelden yönet. Daha hızlı, daha akıllı ve daha karlı.
          </p>

          <div className="space-y-8 text-lg">
            <div className="flex items-center gap-4 group">
              <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition">
                <Utensils size={28} />
              </div>
              <p>Dijital menü yönetimi</p>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition">
                <ShoppingBag size={28} />
              </div>
              <p>Anlık sipariş takibi</p>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition">
                <TrendingUp size={28} />
              </div>
              <p>Gelişmiş raporlama & analiz</p>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-6 text-center border-t border-white/10 pt-8">
            <div>
              <p className="text-2xl font-semibold">500+</p>
              <span className="text-slate-400 text-sm">Restoran</span>
            </div>
            <div>
              <p className="text-2xl font-semibold">50K+</p>
              <span className="text-slate-400 text-sm">Sipariş</span>
            </div>
            <div>
              <p className="text-2xl font-semibold">99.9%</p>
              <span className="text-slate-400 text-sm">Uptime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}