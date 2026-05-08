import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom'; 
import { Receipt, Bell, CreditCard, ArrowLeft, History, X, Users, PieChart, CheckSquare, Plus, Minus, Lock } from 'lucide-react';
import axios from 'axios';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  isPaid: boolean;
}

export default function CustomerBillView() {
  const { tableId } = useParams<{ tableId: string }>();

  const [items, setItems] = useState<OrderItem[]>([]);
  const [total, setTotal] = useState(0);
  const [tableNo, setTableNo] = useState<string>(''); 
  const [isActive, setIsActive] = useState<boolean>(true);
  
  const [remainingTotal, setRemainingTotal] = useState(0); 
  
  const [loading, setLoading] = useState(true);
  const [isRequested, setIsRequested] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [numberOfPeople, setNumberOfPeople] = useState<number>(1); 
  
  const [modalView, setModalView] = useState<'options' | 'splitEqually' | 'payByItems' | 'payByAmount' | 'cardForm'>('options'); 
  const [paymentAmount, setPaymentAmount] = useState<string>(''); 
  const [pendingAction, setPendingAction] = useState<'amount' | 'split' | 'items' | null>(null);
  const [finalAmountToPay, setFinalAmountToPay] = useState<number>(0);

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState('');

  const [selectedFlattenedIds, setSelectedFlattenedIds] = useState<string[]>([]);

  const fetchBill = useCallback(async () => {
    if (!tableId) return;
    try {
      const timestamp = new Date().getTime();
      const response = await axios.get(`https://localhost:7057/api/Order/active-table/${tableId}?t=${timestamp}`);
      
      setItems(response.data.items || []);
      setTotal(response.data.totalAmount || 0);
      setRemainingTotal(response.data.remainingAmount || 0); 
      setTableNo(response.data.tableName || "Bilinmiyor");
      setIsActive(response.data.isActive !== undefined ? response.data.isActive : true); 
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setItems([]);
        setRemainingTotal(0);
        setIsActive(false);
      } else {
        console.error("Hesap çekilemedi:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    fetchBill();
  }, [fetchBill]);

  const flattenedItems = useMemo(() => {
    return items.filter(item => !item.isPaid).flatMap(item => {
      return Array.from({ length: item.quantity }).map((_, index) => ({
        uniqueId: `${item.id}-${index}`, 
        originalId: item.id,             
        name: item.name,
        price: item.price,
      }));
    });
  }, [items]);

  const toggleFlattenedSelection = (uniqueId: string) => {
    setSelectedFlattenedIds(prev => 
      prev.includes(uniqueId) ? prev.filter(id => id !== uniqueId) : [...prev, uniqueId]
    );
  };

  const selectedItemsTotal = flattenedItems
    .filter(f => selectedFlattenedIds.includes(f.uniqueId))
    .reduce((sum, f) => sum + f.price, 0);

  const proceedToCard = (action: 'amount' | 'split' | 'items', amount: number) => {
    setPendingAction(action);
    setFinalAmountToPay(amount);
    setModalView('cardForm');
  };

  const resetAndCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setModalView('options');
      setPaymentAmount('');
      setSelectedFlattenedIds([]);
      setCardNumber(''); setExpiry(''); setCvc(''); setCardName('');
      setNumberOfPeople(1);
      setPendingAction(null);
    }, 300);
  };

  const executePayment = async () => {
    const cardPayload = {
      cardNumber: cardNumber.replace(/\s/g, ''),
      expireMonth: expiry.split('/')[0] || '',
      expireYear: expiry.split('/')[1] ? `20${expiry.split('/')[1]}` : '',
      cvc: cvc
    };

    try {
      let response;

      if (pendingAction === 'amount') {
        response = await axios.post(`https://localhost:7057/api/Order/pay-by-amount/${tableId}`, {
          amount: parseFloat(paymentAmount),
          ...cardPayload
        });
      } 
      else if (pendingAction === 'split') {
        response = await axios.post(`https://localhost:7057/api/Order/split-equally/${tableId}`, {
          numberOfPeople: numberOfPeople,
          ...cardPayload
        });
      } 
      else if (pendingAction === 'items') {
        const originalIds = flattenedItems
          .filter(f => selectedFlattenedIds.includes(f.uniqueId))
          .map(f => f.originalId);

        response = await axios.post(`https://localhost:7057/api/Order/pay-selected-item/${tableId}`, {
          itemIds: originalIds,
          ...cardPayload
        });
      }

      alert(response?.data?.message || "Ödeme Başarılı!");
      resetAndCloseModal(); 
      fetchBill();

    } catch (error: any) {
      alert(error.response?.data?.message || "Ödeme işlemi banka veya sistem tarafından reddedildi.");
    }
  };

  const handleBringToTable = async () => {
    try {
      await axios.post(`https://localhost:7057/api/Order/request-bill/${tableId}`);
      setIsRequested(true);
      alert("Hesap talebiniz başarıyla garsona iletildi. 🥂");
    } catch (err) {
      alert("Bir hata oluştu, lütfen garsonu çağırın.");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-zinc-500">NoirPay Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-200 font-sans selection:bg-orange-500/30 relative">
      
      <header className="p-6 flex items-center justify-between border-b border-zinc-900">
        <button className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black tracking-widest uppercase italic">NoirPay</h1>
        <button className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
          <History className="w-6 h-6 text-zinc-500" />
        </button>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-8">
        
        {/* Masa Bilgisi ve Sipariş Durumu */}
        <section className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Adisyon Detayı</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
              {isActive ? 'Aktif' : 'Kapalı'}
            </span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">{tableNo}</h2>
        </section>

        {/* Ürün Listesi */}
        <section className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6 text-zinc-400">
            <Receipt className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-tight">Siparişleriniz</span>
          </div>

          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={index} className={`flex justify-between items-center ${item.isPaid ? 'opacity-40' : ''}`}>
                <div className="flex flex-col">
                  <span className={`text-sm font-bold ${item.isPaid ? 'text-zinc-500 line-through' : 'text-white'}`}>
                    {item.name} {item.isPaid && <span className="text-[10px] text-green-500 no-underline ml-2">(Ödendi)</span>}
                  </span>
                  <span className="text-xs text-zinc-500">{item.quantity} adet</span>
                </div>
                <span className={`font-mono text-sm ${item.isPaid ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>
                  {(item.price * item.quantity).toFixed(2)} TL
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-800 border-dashed flex justify-between items-end">
            <span className="text-sm font-medium text-zinc-500">Kalan Toplam Tutar</span>
            <span className="text-3xl font-black text-white italic">{remainingTotal.toFixed(2)} TL</span>
          </div>
        </section>

        {/* Aksiyon Butonları */}
        <section className="grid grid-cols-1 gap-4">
          
          <button 
            disabled={!isActive || remainingTotal <= 0}
            onClick={() => setIsModalOpen(true)}
            className={`flex items-center justify-center gap-3 py-5 rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] ${
              !isActive || remainingTotal <= 0 
              ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800' 
              : 'bg-white text-black hover:bg-zinc-200 transform active:scale-95'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            {isActive && remainingTotal > 0 ? 'ONLINE ÖDE' : 'HESAP KAPANDI'}
          </button>

          <button 
            onClick={handleBringToTable}
            disabled={isRequested || !isActive}
            className={`flex items-center justify-center gap-3 py-5 bg-zinc-900 border border-zinc-800 rounded-2xl font-bold transition-colors ${
              isRequested || !isActive
              ? 'text-zinc-600 cursor-not-allowed' 
              : 'text-white hover:bg-zinc-800'
            }`}
          >
            <Bell className={`w-5 h-5 ${isRequested || !isActive ? 'animate-none' : 'animate-bounce'}`} />
            {isRequested ? 'TALEP İLETİLDİ' : 'HESABI MASAYA GETİR'}
          </button>
          
        </section>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-0 animate-in fade-in duration-200">
          <div className="bg-[#0D0D0D] border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                {modalView !== 'options' && (
                  <button 
                    onClick={() => {
                      if(modalView === 'cardForm') setModalView(pendingAction === 'amount' ? 'payByAmount' : pendingAction === 'split' ? 'splitEqually' : 'payByItems');
                      else {
                        setModalView('options');
                        setPaymentAmount('');
                        setSelectedFlattenedIds([]);
                        setNumberOfPeople(1);
                      }
                    }} 
                    className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <h3 className="text-xl font-black text-white">
                    {modalView === 'options' ? 'Ödeme Yöntemi' : 
                     modalView === 'splitEqually' ? 'Bölerek Öde' : 
                     modalView === 'payByAmount' ? 'Tutar Gir' : 
                     modalView === 'cardForm' ? 'Kart Bilgileri' : 'Ürün Seç'}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    {modalView === 'cardForm' ? 'Güvenli ödeme altyapısı' : 'Lütfen seçiminizi yapın'}
                  </p>
                </div>
              </div>
              <button 
                onClick={resetAndCloseModal} 
                className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalView === 'options' && (
              <div className="space-y-3 animate-in slide-in-from-left-4 fade-in duration-300">
                <button onClick={() => setModalView('splitEqually')} className="w-full flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-colors group">
                  <div className="p-2 bg-zinc-800 rounded-xl group-hover:bg-zinc-700 transition-colors">
                    <Users className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-bold text-white">Bölerek Öde</span>
                    <span className="text-[10px] text-zinc-500">Kalan borcu kişi sayısına eşit bölün</span>
                  </div>
                </button>

                <button onClick={() => setModalView('payByAmount')} className="w-full flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-colors group">
                  <div className="p-2 bg-zinc-800 rounded-xl group-hover:bg-zinc-700 transition-colors">
                    <PieChart className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-bold text-white">Belirli Bir Kısmını Öde</span>
                    <span className="text-[10px] text-zinc-500">Kendi belirlediğiniz tutarı ödeyin</span>
                  </div>
                </button>

                <button onClick={() => setModalView('payByItems')} className="w-full flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-colors group">
                  <div className="p-2 bg-zinc-800 rounded-xl group-hover:bg-zinc-700 transition-colors">
                    <CheckSquare className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-bold text-white">Ürün Seçerek Öde</span>
                    <span className="text-[10px] text-zinc-500">Sadece yediklerinizi seçip ödeyin</span>
                  </div>
                </button>
              </div>
            )}

            {modalView === 'payByAmount' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="relative">
                  <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0.00" autoFocus
                    className="w-full bg-zinc-900 border border-zinc-800 text-white text-4xl font-black italic p-6 rounded-2xl text-center focus:outline-none focus:border-orange-500 transition-colors placeholder:text-zinc-800"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-600">TL</span>
                </div>
                <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-bold uppercase tracking-widest">Kalan Toplam Borç</span>
                    {/* 🌟 GÜNCELLEME: remainingTotal */}
                    <span className="text-white font-mono">{remainingTotal.toFixed(2)} TL</span>
                  </div>
                </div>
                <button 
                  onClick={() => proceedToCard('amount', parseFloat(paymentAmount))}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > remainingTotal}
                  className={`w-full py-4 font-black rounded-2xl transition-all flex items-center justify-center gap-2 ${
                    paymentAmount && parseFloat(paymentAmount) > 0 && parseFloat(paymentAmount) <= remainingTotal
                      ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800'
                  }`}
                >
                  DEVAM ET
                </button>
              </div>
            )}

            {modalView === 'splitEqually' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                  <span className="text-sm font-bold text-white">Kişi Sayısı</span>
                  <div className="flex items-center gap-5">
                    <button onClick={() => setNumberOfPeople(Math.max(2, numberOfPeople - 1))} disabled={numberOfPeople <= 2} className="w-10 h-10 flex items-center justify-center bg-zinc-800 rounded-full text-zinc-400 hover:text-white disabled:opacity-50"><Minus className="w-5 h-5" /></button>
                    <span className="font-black text-2xl text-white w-4 text-center">{numberOfPeople}</span>
                    <button onClick={() => setNumberOfPeople(numberOfPeople + 1)} className="w-10 h-10 flex items-center justify-center bg-zinc-800 rounded-full text-zinc-400 hover:text-white"><Plus className="w-5 h-5" /></button>
                  </div>
                </div>
                <div className="text-center p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2">Kişi Başı Tutar</p>
                  <p className="text-4xl font-black text-white italic">{(remainingTotal / numberOfPeople).toFixed(2)} <span className="text-xl text-zinc-500">TL</span></p>
                  <p className="text-[10px] text-zinc-500 mt-3 font-medium">
                    * Kalan {remainingTotal.toFixed(2)} TL üzerinden hesaplanmıştır.
                  </p>
                </div>
                <button onClick={() => proceedToCard('split', remainingTotal / numberOfPeople)} className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                  DEVAM ET
                </button>
              </div>
            )}

            {modalView === 'payByItems' && (
              <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {flattenedItems.length === 0 ? (
                    <div className="text-center p-6 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">
                      <p className="text-sm text-zinc-500">Ödenecek ürün kalmadı.</p>
                    </div>
                  ) : (
                    flattenedItems.map((f) => (
                      <div 
                        key={f.uniqueId} 
                        onClick={() => toggleFlattenedSelection(f.uniqueId)} 
                        className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                          selectedFlattenedIds.includes(f.uniqueId) 
                            ? 'bg-orange-500/10 border-orange-500' 
                            : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            selectedFlattenedIds.includes(f.uniqueId) ? 'bg-orange-500 border-orange-500' : 'border-zinc-600'
                          }`}>
                            {selectedFlattenedIds.includes(f.uniqueId) && <CheckSquare className="w-3 h-3 text-black" />}
                          </div>
                          <p className="text-sm font-bold text-white">{f.name}</p>
                        </div>
                        <span className="font-mono text-sm text-white">{f.price.toFixed(2)} TL</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="pt-4 border-t border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-bold text-zinc-400">Seçilen Toplam</span>
                    <span className="text-2xl font-black text-white italic">{selectedItemsTotal.toFixed(2)} TL</span>
                  </div>
                  <button 
                    onClick={() => proceedToCard('items', selectedItemsTotal)} 
                    disabled={selectedFlattenedIds.length === 0} 
                    className={`w-full py-4 font-black rounded-2xl transition-all flex items-center justify-center gap-2 ${
                      selectedFlattenedIds.length > 0 
                        ? 'bg-white text-black hover:bg-zinc-200' 
                        : 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800'
                    }`}
                  >
                    DEVAM ET
                  </button>
                </div>
              </div>
            )}

            {modalView === 'cardForm' && (
              <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Çekilecek Tutar</span>
                  <span className="text-xl font-black text-white italic">{finalAmountToPay.toFixed(2)} TL</span>
                </div>

                <div className="space-y-3">
                  <input type="text" placeholder="Kart Üzerindeki İsim" value={cardName} onChange={(e) => setCardName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 rounded-xl focus:outline-none focus:border-orange-500 transition-colors placeholder:text-zinc-600" />
                  
                  <input type="text" placeholder="Kart Numarası" maxLength={19} value={cardNumber} onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 rounded-xl focus:outline-none focus:border-orange-500 transition-colors placeholder:text-zinc-600 font-mono" />
                  
                  <div className="flex gap-3">
                    <input type="text" placeholder="AA/YY" maxLength={5} value={expiry} onChange={(e) => setExpiry(e.target.value)}
                      className="w-1/2 bg-zinc-900 border border-zinc-800 text-white p-4 rounded-xl focus:outline-none focus:border-orange-500 transition-colors placeholder:text-zinc-600 text-center font-mono" />
                    
                    <input type="text" placeholder="CVC" maxLength={3} value={cvc} onChange={(e) => setCvc(e.target.value)}
                      className="w-1/2 bg-zinc-900 border border-zinc-800 text-white p-4 rounded-xl focus:outline-none focus:border-orange-500 transition-colors placeholder:text-zinc-600 text-center font-mono" />
                  </div>
                </div>

                <button onClick={executePayment} disabled={!cardNumber || !expiry || !cvc} className="w-full mt-4 py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Lock className="w-4 h-4" />
                  GÜVENLİ ÖDEME YAP
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}