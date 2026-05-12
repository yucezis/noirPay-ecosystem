import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { LayoutGrid, Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('https://localhost:7057/api/Auth/register', formData);
      
      alert("Kayıt başarılı! Lütfen giriş yapın.");
      navigate('/login');
    } catch (error) {
      console.error("Kayıt hatası:", error);
      alert("Kayıt olurken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-orange-500">
          <LayoutGrid className="w-12 h-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-black tracking-tight text-slate-900 italic uppercase">
          Hesap Oluştur
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          NoirPay dünyasına katılmak için bilgilerinizi girin
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Ad</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input type="text" required value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors" placeholder="Adınız" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Soyad</label>
                <div className="mt-1">
                  <input type="text" required value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="block w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors" placeholder="Soyadınız" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">E-posta Adresi</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors" placeholder="ornek@sirket.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Şifre</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors" placeholder="••••••••" />
              </div>
            </div>

            <div>
              <button type="submit" disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors disabled:opacity-50">
                {loading ? 'KAYDEDİLİYOR...' : 'KAYIT OL'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <p className="text-center text-sm text-slate-500">
              Zaten bir hesabın var mı?{' '}
              <Link to="/login" className="font-bold text-orange-500 hover:text-orange-400 hover:underline transition-colors">
                Giriş Yap
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}