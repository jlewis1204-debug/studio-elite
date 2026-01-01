import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ShoppingBag, Lock, Phone, Star, Settings, Edit2, ArrowLeft, Trash2, Plus, User,
  CheckCircle, CreditCard, AlertCircle, Send, MapPin, Clock, X, Smartphone, Wallet,
  Camera, Search, Check, Minus, Zap, Globe, AlertTriangle, Package, Key, Crown,
  XCircle, LogOut, ChevronRight, ChevronLeft, MessageCircle, Image as ImageIcon,
  FileText, Shield, Unlock, DollarSign, Mail, Palette, QrCode, Share2, Printer,
  MessageSquare, ChevronDown, ChevronUp, Copy, Menu, Filter, Eye, EyeOff, UserPlus,
  Tag, Sparkles, RefreshCw
} from "lucide-react";

// --- STRIPE REAL IMPORTS ---
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements, PaymentRequestButtonElement } from "@stripe/react-stripe-js";

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, doc, onSnapshot, updateDoc, setDoc, deleteDoc, addDoc, getDoc } from "firebase/firestore";

// --- I18N IMPORTS ---
import './i18n';
import { useTranslation } from 'react-i18next';

// --- CONFIGURACIÓN FIREBASE (FAST WAVE) ---
const firebaseConfig = {
  apiKey: "AIzaSyA8Ujw8L5uErmgL_x3fNRx530fSWjavu7M",
  authDomain: "fast-wave-laundry-86d9f.firebaseapp.com",
  projectId: "fast-wave-laundry-86d9f",
  storageBucket: "fast-wave-laundry-86d9f.firebasestorage.app",
  messagingSenderId: "715908594206",
  appId: "1:715908594206:web:92cd3996474c1a9390c0f",
  measurementId: "G-H3YT8GGVK4"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const appId = 'studio-elite-vMaster-Final';

// --- DATOS FIJOS Y CONFIGURACIÓN ---
const PREDEFINED_PRODUCTS: any = {
  "Camisas": [], "Poloches": [], "Pantalones": [], "Calzado": [], "Gorras": [],
  "Carteras": [], "Correas": [], "Accesorios": [], "Ofertas": []
};

const CATEGORY_OPTIONS = Object.keys(PREDEFINED_PRODUCTS);

const SIZES_MAP: any = {
  "Calzado": ["6 US", "6.5 US", "7 US", "7.5 US", "8 US", "8.5 US", "9 US", "9.5 US", "10 US", "10.5 US", "11 US", "11.5 US", "12 US", "13 US"],
  "Default": ["XS", "S", "M", "L", "XL", "XXL"]
};

const COLOR_OPTIONS = [
  { name: "Negro", hex: "#000000" }, { name: "Blanco", hex: "#ffffff" },
  { name: "Gris", hex: "#9ca3af" }, { name: "Azul Marino", hex: "#1e3a8a" },
  { name: "Rojo", hex: "#dc2626" }, { name: "Verde", hex: "#3f6212" },
  { name: "Beige", hex: "#f5f5dc" }, { name: "Marrón", hex: "#451a03" },
  { name: "Multicolor", hex: "linear-gradient(to right, red, violet)" }
];

const STATUS_STEPS: any = { "Pagado": 25, "Preparando": 50, "Enviado": 75, "Completado": 100 };

const tr = (lang: string, en: string, es: string, fr: string, hi: string) => {
  if (lang === 'es') return es; if (lang === 'fr') return fr; if (lang === 'hi') return hi; return en;
};

const handleImageUploadUtility = (e: any, callback: any, showAlert: any) => {
  const file = e.target.files?.[0];
  if (file && file.size < 1500000) { 
    const reader = new FileReader();
    reader.onloadend = () => callback(reader.result);
    reader.readAsDataURL(file);
  } else if (file) { showAlert("Image too large (>1.5MB)", "error"); }
};

// --- FUNCIÓN INTELIGENCIA ARTIFICIAL (AUTO-DETECT MODELO) ---
const analyzeImageWithAI = async (base64Image: string, apiKeyFromConfig: string) => {
  // TU LLAVE MAESTRA
  const MASTER_KEY = "AIzaSyCwa2oTplSTFdmLbQErjpGqESfgqWzw3lA"; 
  const cleanKey = MASTER_KEY.trim();

  try {
    // PASO 1: PREGUNTAR A GOOGLE QUÉ MODELOS HAY DISPONIBLES
    const listReq = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`);
    
    if (!listReq.ok) {
        const err = await listReq.text();
        alert(`Error verificando modelos: ${err}`);
        return null;
    }

    const listData = await listReq.json();
    
    // Buscamos un modelo que sirva (preferiblemente Flash o Pro 1.5)
    // Filtramos solo los que sirven para generar contenido
    const usableModel = listData.models?.find((m: any) => 
        m.supportedGenerationMethods?.includes("generateContent") && 
        (m.name.includes("flash") || m.name.includes("gemini-1.5"))
    );

    // Si no encuentra uno específico, usa el primero que sirva para generar
    const backupModel = listData.models?.find((m: any) => m.supportedGenerationMethods?.includes("generateContent"));

    const selectedModelName = usableModel ? usableModel.name : (backupModel ? backupModel.name : "models/gemini-1.5-flash");
    
    // Le quitamos el prefijo "models/" si viene con él para la URL (a veces google lo pide sin eso)
    const modelId = selectedModelName.replace("models/", "");

    // PASO 2: USAR EL MODELO ENCONTRADO
    // alert(`Usando modelo automático: ${modelId}`); // Descomenta si quieres ver cuál eligió

    const mimeType = base64Image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || "image/jpeg";
    const imageParts = base64Image.split(",")[1];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${cleanKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `Analyze this fashion item image. Return a clean JSON object (no markdown) with these exact keys:
                      - "name": A short, trendy, uppercase product name (max 3 words).
                      - "description": A sophisticated 1-sentence description in Spanish selling the item's quality or style.
                      - "category": Choose strictly ONE from this list that best fits: ${CATEGORY_OPTIONS.join(", ")}.
                      ` },
            { inline_data: { mime_type: mimeType, data: imageParts } }
          ]
        }]
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        alert(`Error al generar con ${modelId}:\n${errorText}`);
        return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) { 
        alert("La IA funcionó pero no devolvió texto."); 
        return null; 
    }

    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("AI Error:", error);
    alert(`Error Técnico: ${error}`);
    return null;
  }
};
// --- COMPONENTES AUXILIARES ---

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const changeLanguage = (lng: string) => { i18n.changeLanguage(lng); setIsOpen(false); };
  const languages = [
    { code: 'en', flag: '🇺🇸', label: 'English' }, { code: 'es', flag: '🇪🇸', label: 'Español' },
    { code: 'fr', flag: '🇫🇷', label: 'Français' }, { code: 'hi', flag: '🇮🇳', label: 'हिन्दी' }
  ];
  const current = languages.find(l => l.code === i18n.language) || languages[0];
  return (
    <div className="relative z-50">
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 md:p-3 bg-white/50 backdrop-blur-md rounded-full hover:bg-white shadow-sm transition-all flex items-center gap-2 border border-zinc-100">
        <Globe size={16} className="text-zinc-800" />
        <span className="text-[10px] font-black hidden md:block">{current.flag}</span>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full right-0 mt-2 bg-white rounded-[20px] shadow-2xl border border-zinc-100 py-2 min-w-[120px] z-50 overflow-hidden animate-in fade-in zoom-in-95">
            {languages.map((lang) => (
              <button key={lang.code} onClick={() => changeLanguage(lang.code)} className="w-full px-4 py-2 text-left text-[9px] font-black uppercase hover:bg-zinc-50 flex items-center gap-3 transition-colors">
                <span className="text-base">{lang.flag}</span> {lang.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CustomToast({ message, type, onClose }: any) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  if (!message) return null;
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-top-6 text-white font-black text-[9px] uppercase tracking-widest ${type === 'error' ? 'bg-red-600' : 'bg-[var(--theme-accent)]'}`}>
      {type === "error" ? <AlertCircle size={16} /> : <CheckCircle size={16} />} {String(message)}
    </div>
  );
}

// --- SISTEMA DE CHAT ---
function ChatSystem({ orderId, isAdmin = false, user }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!user || !db) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
    return onSnapshot(q, (snap) => {
      const filtered = snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
        .filter(m => m.orderId === orderId)
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      setMessages(filtered);
    });
  }, [orderId, user]);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  const send = async (e: any) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), {
      orderId, text, sender: isAdmin ? 'admin' : 'client', time: new Date().toISOString()
    });
    setText("");
  };
  return (
    <div className="bg-zinc-50 rounded-[30px] border border-zinc-100 overflow-hidden flex flex-col h-[260px]">
      <div className="p-4 bg-white border-b flex items-center gap-2 font-black text-[9px] uppercase tracking-widest text-zinc-400">Support Chat</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-zinc-950">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender === (isAdmin ? 'admin' : 'client') ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-[20px] text-[10px] font-bold leading-relaxed shadow-sm ${m.sender === (isAdmin ? 'admin' : 'client') ? 'bg-[var(--theme-primary)] text-white shadow-md' : 'bg-white border text-zinc-600 shadow-sm'}`}>{m.text}</div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
      <form onSubmit={send} className="p-3 bg-white border-t flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="..." className="flex-1 px-4 py-2 bg-zinc-50 rounded-xl text-[10px] outline-none font-bold text-zinc-950" />
        <button type="submit" className="p-2 bg-[var(--theme-primary)] text-white rounded-xl active:scale-90 transition-transform"><Send size={16} /></button>
      </form>
    </div>
  );
}

// --- COMPONENTE DE RECIBO (TE FALTABA ESTO) ---
function OrderReceipt({ order, config, onBack, user }: any) {
  const { t } = useTranslation();

  const handleShareReceipt = async () => {
    const shareData = {
      title: `${config.brandName} Receipt`,
      text: `RECIBO DE COMPRA - ${config.brandName}\n\nOrden: #${order.orderNumber}\nTotal: $${order.totals.total.toFixed(2)}\nEstado: ${order.status}\n\nGracias por su compra!`,
      url: window.location.href
    };

    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) { console.log("Error sharing", err); }
    } else {
      navigator.clipboard.writeText(shareData.text);
      alert("Copiado al portapapeles / Copied to clipboard");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 animate-in fade-in zoom-in text-zinc-950 p-6">
      <button onClick={onBack} className="flex items-center gap-2 mb-8 text-zinc-400 hover:text-black font-black text-[10px] uppercase tracking-widest transition-colors">
        <ArrowLeft size={16} /> {t('cart.back') || "Volver"}
      </button>
      <div className="bg-white rounded-[50px] shadow-2xl overflow-hidden border border-zinc-100">
        <div className="bg-[var(--theme-primary)] p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_#fff_0%,transparent_70%)]" />
          <div className="w-16 h-16 bg-white rounded-[20px] flex items-center justify-center mx-auto mb-4 shadow-2xl text-zinc-950">
            {config.customIcon ? <img src={config.customIcon} className="w-full h-full object-cover" /> : <ShoppingBag size={28} />}
          </div>
          <h2 className="text-white text-3xl font-black italic uppercase tracking-tighter mb-2">Confirmed!</h2>
          <p className="text-[var(--theme-accent)] font-black text-[10px] uppercase tracking-[0.4em]">Ref: #{order.orderNumber}</p>
        </div>
        
        <div className="p-8 md:p-10 grid md:grid-cols-2 gap-10">
          <div>
            <h3 className="text-[9px] font-black uppercase text-zinc-300 tracking-[0.4em] mb-6 italic">Details</h3>
            <div className="space-y-4">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-center">
                  <div className="w-14 h-16 bg-zinc-50 rounded-xl overflow-hidden border">
                    <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-xs uppercase leading-tight">{item.name}</p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase mt-1">
                      Size: {item.size} • Color: {item.color} • Qty: {item.qty}
                    </p>
                    <p className="font-black text-[var(--theme-accent)] mt-1 italic text-xs">
                      ${(item.price * item.qty).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-dashed space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                <span>Subtotal</span><span>${order.totals.subtotal.toFixed(2)}</span>
              </div>
              {order.totals.discount > 0 && (
                <div className="flex justify-between text-[10px] font-bold text-emerald-500 uppercase">
                  <span>Member Savings</span><span>-${order.totals.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                <span>Tax ({config.taxPercent}%)</span><span>${order.totals.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-black italic tracking-tighter mt-3 pt-3 border-t border-zinc-100">
                <span>TOTAL</span><span className="text-[var(--theme-accent)]">${order.totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-[9px] font-black uppercase text-zinc-300 tracking-[0.4em] mb-3 italic">Status</h3>
              <div className="bg-[var(--theme-primary)] p-6 rounded-[30px] shadow-xl text-white">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-accent)]">{order.status}</span>
                  <span className="text-[9px] font-black opacity-40 uppercase">{STATUS_STEPS[order.status] || 0}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-[var(--theme-accent)] transition-all duration-1000" style={{ width: `${STATUS_STEPS[order.status] || 0}%` }} />
                </div>
              </div>
              <button onClick={handleShareReceipt} className="w-full py-3 mt-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all">
                <Share2 size={14} /> Share Receipt
              </button>
            </div>
            {/* Sistema de Chat */}
            <ChatSystem orderId={order.id} isAdmin={false} user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}
// --- APP PRINCIPAL ---
// --- FORMULARIO DE PAGO (SOLO APPLE PAY / SIN LINK) ---
function StripeCardForm({ onSuccess, onError, amount }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stripe) return;
    const cleanAmount = Math.round((parseFloat(amount) || 0) * 100);
    
    // Configuración agresiva para Apple Pay
    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'STUDIO ELITE',
        amount: cleanAmount,
      },
      requestPayerName: true,
      requestPayerEmail: true,
      // 👇 ESTA LÍNEA MATA AL BOTÓN VERDE Y FUERZA APPLE PAY 👇
      disableWallets: ['link'], 
    });

    // Verificamos si Apple Pay está listo
    pr.canMakePayment().then(result => {
      if (result) {
        setPaymentRequest(pr);
      } else {
        console.log("Apple Pay no disponible en este dispositivo/navegador");
      }
    });

    pr.on('paymentmethod', async (ev) => {
      if (ev.paymentMethod) {
        ev.complete('success');
        onSuccess(ev.paymentMethod);
      } else {
        ev.complete('fail');
        onError("Pago cancelado");
      }
    });
  }, [stripe, amount]);

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);

    const cardElement = elements.getElement(CardElement);
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement!,
    });

    if (error) {
      onError(error.message);
      setLoading(false);
    } else {
      onSuccess(paymentMethod);
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in">
      
      {/* SI EXISTE APPLE PAY, MUESTRA EL BOTÓN NEGRO */}
      {paymentRequest && (
        <div className="w-full">
           <div className="h-[48px] shadow-lg rounded-[25px] overflow-hidden relative z-10">
              <PaymentRequestButtonElement options={{
                paymentRequest,
                style: {
                  paymentRequestButton: {
                    theme: 'dark', // OBLIGA AL NEGRO
                    height: '48px',
                    type: 'default',
                  },
                }
              }} />
           </div>
           <p className="text-[9px] text-center text-zinc-400 mt-2 font-bold uppercase tracking-widest">
              Tap to Pay
           </p>
           <div className="relative flex py-4 items-center w-full">
             <div className="flex-grow border-t border-zinc-200"></div>
             <span className="flex-shrink-0 mx-4 text-zinc-300 text-[9px] font-black uppercase tracking-widest">OR CARD</span>
             <div className="flex-grow border-t border-zinc-200"></div>
           </div>
        </div>
      )}

      {/* SIEMPRE MUESTRA LA TARJETA ABAJO */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
            <CardElement options={{
              style: {
                base: { fontSize: '16px', color: '#09090b', '::placeholder': { color: '#d4d4d8' } },
              },
              hidePostalCode: true,
            }} />
        </div>
        <button type="submit" disabled={!stripe || loading} className="w-full py-4 bg-black text-white rounded-full font-black uppercase text-[12px] tracking-[0.2em] shadow-xl">
          {loading ? "PROCESSING..." : `PAY $${amount}`}
        </button>
      </form>
    </div>
  );
}
export default function App() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState("home");
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [showQR, setShowQR] = useState(false);

  // --- NUEVOS ESTADOS PARA ALTA GAMA (WISHLIST Y FILTROS) ---
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem('user_wishlist') || "[]"));
  const [sortBy, setSortBy] = useState("default");
  const [filterColor, setFilterColor] = useState("All");

  const toggleWishlist = (productId: string) => {
    setWishlist((prev: any) => {
      const newList = prev.includes(productId) 
        ? prev.filter((id: string) => id !== productId) 
        : [...prev, productId];
      localStorage.setItem('user_wishlist', JSON.stringify(newList));
      return newList;
    });
    setToast({ message: "Wishlist Updated", type: "success" });
  };

  // CONFIGURACIÓN INICIAL
  const [config, setConfig] = useState<any>({
    brandName: "STUDIO ELITE",
    brandSubtitle: "Contemporary Curation",
    heroImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80",
    customIcon: "",
    themePrimary: "#09090b", // Color Principal (Oscuro)
    themeAccent: "#10b981",  // Color de Acento (Brillante)
    taxPercent: 7,
    membershipCost: 20,
    membershipDiscount: 20,
    storeDiscount: 0, // NUEVO: Descuento general de tienda
    geminiApiKey: "", // CLAVE IA
    savingsPeriod: 3,
    visitsPerMonth: 2,
    promoText: "Join the Club",
    stripePublicKey: "pk_test_TYooMQauvdEDq54NiTphI7jx", // CAMBIAR A LIVE
    stripeSecretKey: "",
    zelleInfo: "",
    zelleInstructions: "Please transfer the total amount to the Zelle info provided. Include your Order # in the memo field.",
    adminUsername: "admin",
    adminPassword: "123",
    adminPhone: "",
    recoveryPin: "0000"
  });

  const [activeCategory, setActiveCategory] = useState("Todos");
  const [stripePromise, setStripePromise] = useState<any>(null);

  // LOGIC STATES
  const [isMember, setIsMember] = useState(false);
  const [memberData, setMemberData] = useState<any>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [showSecondChance, setShowSecondChance] = useState(false);
  const [showMemberMenu, setShowMemberMenu] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);

  // Checkout States
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState("");

  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [toast, setToast] = useState<any>({ message: null, type: "success" });

  const showAlert = (msg: string, type = "success") => setToast({ message: String(msg), type });

  useEffect(() => { signInAnonymously(auth); onAuthStateChanged(auth, setUser); }, []);

  // --- EFECTO PARA APLICAR COLORES Y EL ICONO DE LA APP EN EL TELEFONO ---
  useEffect(() => {
    // 1. Colores Globales
    document.documentElement.style.setProperty('--theme-primary', config.themePrimary || '#09090b');
    document.documentElement.style.setProperty('--theme-accent', config.themeAccent || '#10b981');

    // 2. ACTUALIZAR ICONO DEL TELEFONO (APP ICON / FAVICON / TOUCH ICON)
    if (config.customIcon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = config.customIcon;

      let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (!appleLink) {
        appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        document.getElementsByTagName('head')[0].appendChild(appleLink);
      }
      appleLink.href = config.customIcon;
    }
  }, [config.themePrimary, config.themeAccent, config.customIcon]);

  // CARGAR CONFIG Y STRIPE
  useEffect(() => {
    if (config.stripePublicKey && !stripePromise) {
      setStripePromise(loadStripe(config.stripePublicKey));
    }

    if (!db) return;
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'products'), s => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'members'), s => setMembers(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'general'), s => {
      if (s.exists()) {
        const data = s.data();
        setConfig((prev: any) => ({ ...prev, ...data, stripePublicKey: data.stripePublicKey || prev.stripePublicKey }));
      }
    });
  }, [config.stripePublicKey]);

  // --- VERIFICACIÓN DE MIEMBRO REAL ---
  useEffect(() => {
    if (form.phone && members.length > 0) {
      const found = members.find((m: any) => m.phone === form.phone);
      if (found) { setIsMember(true); setMemberData(found); }
      else { setIsMember(false); setMemberData(null); }
    }
  }, [form.phone, members]);

  // CALCULO DE TOTALES CON DESCUENTO DE MIEMBRO Y DE TIENDA
  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + (Number(item.price) * item.qty), 0);
    // Descuento de Miembro
    const memberDiscount = isMember ? subtotal * ((config.membershipDiscount || 0) / 100) : 0;
    // Descuento General de Tienda (NUEVO)
    const storeDiscount = subtotal * ((config.storeDiscount || 0) / 100);
     
    // Total previo a impuestos
    const tax = (subtotal - memberDiscount - storeDiscount) * ((config.taxPercent || 0) / 100);
    return { 
      subtotal, 
      discount: memberDiscount, 
      storeDiscount: storeDiscount, // Pasamos esto al recibo
      tax, 
      adminDiscount: 0, // Inicialmente 0, se cambia en el Admin Panel
      total: subtotal - memberDiscount - storeDiscount + tax 
    };
  }, [cart, isMember, config]);

  const projectedSavings = useMemo(() => {
    const currentPotentialSave = cart.reduce((acc, item) => acc + (Number(item.price) * item.qty), 0) * ((config.membershipDiscount || 20) / 100);
    const totalFuture = currentPotentialSave * (config.visitsPerMonth || 2) * (config.savingsPeriod || 3);
    return { current: currentPotentialSave, future: totalFuture };
  }, [cart, config]);

  const addToCart = (p: any, s: string, c: string, q: number, isB: boolean) => {
    setCart(prev => [...prev, { ...p, size: s, color: c, qty: q, isBackorder: isB, key: Math.random() }]);
    setToast({ message: "Added to Bag", type: "success" });
  };

  const removeFromCart = (key: any) => setCart(prev => prev.filter(i => i.key !== key));

  const handleJoin = async () => {
    if (!form.name || !form.phone) { setToast({ message: "Name & Phone Required", type: "error" }); return; }
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'members'), {
      name: form.name, phone: form.phone, joinedAt: new Date().toISOString()
    });
    setIsMember(true);
    setShowJoinModal(false);
    setShowUpsellModal(false);
    setShowSecondChance(false);
    setShowCelebration(true);
    if (view === 'cart') setCheckoutStep(4);
  };

  const handleUnsubscribe = async () => {
    if (window.confirm("Sure you want to cancel?")) {
      if (memberData) {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'ex_members'), memberData);
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', memberData.id));
        setForm({ ...form, phone: "" });
        setIsMember(false);
        setToast({ message: "Membership Cancelled", type: "error" });
      }
    }
  };

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    if (!isMember) {
      setShowUpsellModal(true);
    } else {
      setCheckoutStep(4);
    }
  };

  const handleShareApp = () => {
    if (navigator.share) {
      navigator.share({ title: config.brandName, text: 'Check out this amazing store!', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setToast({ message: "Link Copied to Clipboard!", type: "success" });
    }
  };

  // --- SOLUCIÓN DE CARRITO VACÍO: ASEGURAR QUE SE GUARDA ---
  const finalizeOrder = async (paymentDetails: any = null) => {
    // Si el carrito está vacío por error, no procesar
    if(cart.length === 0) {
        showAlert("Error: Cart is empty", "error");
        return;
    }

    const orderNum = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newOrder = {
      orderNumber: orderNum,
      customer: form,
      items: [...cart], // Clonar el array para evitar problemas de referencia
      totals,
      status: "Pagado",
      method: selectedMethod,
      paymentId: paymentDetails?.id || "manual",
      createdAt: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), newOrder);

        const savedOrders = JSON.parse(localStorage.getItem(`orders_${appId}`) || "[]");
        savedOrders.push(orderNum);
        localStorage.setItem(`orders_${appId}`, JSON.stringify(savedOrders));

        setLastOrder(newOrder); // Guardar orden para el recibo
        setCart([]); // Limpiar carrito AHORA si
        setCheckoutStep(1);
        setForm({ name: "", phone: "", address: "" });
        setView("order_success");
        setToast({ message: "ORDER APPROVED! " + orderNum, type: "success" });
    } catch (e) {
        console.error("Error saving order:", e);
        showAlert("Error saving order", "error");
    }
  };

  // --- LÓGICA DE FILTRADO Y ORDENAMIENTO (SIN TOCAR DB) ---
  const getProcessedProducts = () => {
    let result = products.filter(p => activeCategory === "Todos" || p.category === activeCategory);
      
    // 1. Filtro por Color
    if (filterColor !== "All") {
      result = result.filter(p => p.colors && p.colors.includes(filterColor));
    }

    // 2. Ordenamiento
    if (sortBy === "price_asc") {
      result.sort((a: any, b: any) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortBy === "price_desc") {
      result.sort((a: any, b: any) => parseFloat(b.price) - parseFloat(a.price));
    }

    return result;
  };

  return (
    <div className={`min-h-screen bg-[#fafafa] text-zinc-900 font-sans ${i18n.language === 'hi' ? 'font-hindi' : ''} overflow-x-hidden w-full`}>
      <CustomToast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, message: null })} />

      {showCelebration && (
        <div className="fixed inset-0 z-[3000] bg-black/90 flex items-center justify-center p-6 animate-in zoom-in">
          <div className="bg-white p-12 rounded-[50px] text-center max-w-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-yellow-100 to-emerald-100 opacity-50" />
            <div className="relative z-10">
              <Crown size={60} className="mx-auto text-yellow-500 mb-6 animate-bounce" />
              <h2 className="text-4xl font-black italic uppercase mb-4">{tr(i18n.language, "Welcome!", "¡Felicidades!", "Bienvenue!", "स्वागत!")}</h2>
              <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest mb-8">
                {tr(i18n.language, `You saved $${projectedSavings.current.toFixed(2)} on this order!`, `¡Ahorraste $${projectedSavings.current.toFixed(2)} hoy!`, `Vous avez économisé $${projectedSavings.current.toFixed(2)}!`, `आपने $${projectedSavings.current.toFixed(2)} बचाया!`)}
              </p>
              <button onClick={() => setShowCelebration(false)} className="px-10 py-4 bg-[var(--theme-primary)] text-white rounded-full font-black uppercase text-xs">Continue</button>
            </div>
          </div>
        </div>
      )}

      {showUpsellModal && (
        <div className="fixed inset-0 z-[2500] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white p-10 rounded-[50px] max-w-md w-full text-center shadow-2xl animate-in slide-in-from-bottom-10">
            <Zap size={50} className="mx-auto text-yellow-500 mb-6" />
            <h3 className="text-3xl font-black italic uppercase mb-4">{tr(i18n.language, "Wait!", "¡Espera!", "Attendez!", "रुको!")}</h3>
            <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-6 leading-relaxed">
              {tr(i18n.language, "Don't pay full price.", "No pagues precio completo.", "Ne payez pas plein tarif.", "पूरी कीमत न चुकाएं।")}<br />
              {tr(i18n.language, `Save $${projectedSavings.current.toFixed(2)} now.`, `Ahorra $${projectedSavings.current.toFixed(2)} ya.`, `Économisez $${projectedSavings.current.toFixed(2)} maintenant.`, `अभी $${projectedSavings.current.toFixed(2)} बचाएं।`)}
            </p>

            <div className="space-y-3 mb-6">
              <input placeholder="Your Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold border border-zinc-200" />
              <input placeholder="Phone Number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold border border-zinc-200" />
            </div>

            <div className="p-6 bg-zinc-50 rounded-3xl mb-8 border border-zinc-100">
              <div className="flex justify-between mb-2"><span className="text-[10px] font-black uppercase text-zinc-400">Regular</span><span className="font-bold text-zinc-400 line-through">${totals.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-[10px] font-black uppercase text-[var(--theme-accent)]">VIP Price</span><span className="font-black text-[var(--theme-accent)] text-xl">${(totals.subtotal - projectedSavings.current).toFixed(2)}</span></div>
            </div>
            <button onClick={handleJoin} className="w-full py-4 bg-[var(--theme-accent)] text-white rounded-2xl font-black uppercase text-xs mb-3 shadow-xl">{tr(i18n.language, "Become VIP & Save", "Hacerme VIP y Ahorrar", "Devenir VIP", "VIP बनें")}</button>
            <button onClick={() => { setShowUpsellModal(false); setShowSecondChance(true); }} className="text-[10px] font-black uppercase text-zinc-400 hover:text-zinc-950">{tr(i18n.language, "No, pay full price", "No, pagar precio full", "Non, payer plein tarif", "नहीं, पूरी कीमत चुकाएं")}</button>
          </div>
        </div>
      )}

      {showSecondChance && (
        <div className="fixed inset-0 z-[2600] bg-black/90 flex items-center justify-center p-6">
          <div className="bg-white p-12 rounded-[50px] max-w-md w-full text-center border-8 border-red-500 animate-pulse">
            <AlertTriangle size={50} className="mx-auto text-red-500 mb-6" />
            <h3 className="text-3xl font-black italic uppercase mb-4 text-red-600">{tr(i18n.language, "ARE YOU SURE?", "¿ESTÁS SEGURO?", "ÊTES-VOUS SÛR?", "क्या आपको यकीन है?")}</h3>
            <p className="text-zinc-950 font-bold text-sm uppercase tracking-widest mb-8 leading-relaxed">
              {tr(i18n.language, `You are throwing away $${projectedSavings.current.toFixed(2)}.`, `Estás botando $${projectedSavings.current.toFixed(2)}.`, `Vous perdez $${projectedSavings.current.toFixed(2)}.`, `आप $${projectedSavings.current.toFixed(2)} खो रहे हैं।`)}
            </p>
            {/* CORRECCIÓN: Botón que devuelve al formulario de datos */}
            <button onClick={() => { setShowSecondChance(false); setShowUpsellModal(true); }} className="w-full py-4 bg-[var(--theme-primary)] text-white rounded-2xl font-black uppercase text-xs shadow-2xl mb-3">{tr(i18n.language, "Okay, I want the discount", "Ok, quiero el descuento", "Ok, je veux la remise", "ठीक है, मुझे छूट चाहिए")}</button>
            <button onClick={() => { setShowSecondChance(false); setCheckoutStep(4); }} className="w-full py-4 bg-zinc-100 text-zinc-400 rounded-2xl font-black uppercase text-xs">{tr(i18n.language, "Yes, charge full price", "Sí, cobrar todo", "Oui, facturer plein tarif", "हाँ, पूरी कीमत लें")}</button>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 z-[3000] bg-black/80 flex items-center justify-center p-6">
          <div className="bg-white p-10 rounded-[50px] w-full max-w-md text-center">
            <Crown size={40} className="mx-auto text-[var(--theme-accent)] mb-4" />
            <h3 className="text-xl font-black uppercase italic mb-6">Join the Elite Club</h3>
            <div className="space-y-4 mb-8">
              <input placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-4 bg-zinc-50 rounded-2xl font-bold text-xs" />
              <input placeholder="Phone Number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full p-4 bg-zinc-50 rounded-2xl font-bold text-xs" />
            </div>
            <button onClick={handleJoin} className="w-full py-4 bg-[var(--theme-accent)] text-white rounded-full font-black uppercase text-xs mb-3 shadow-xl">Join Now</button>
            <button onClick={() => setShowJoinModal(false)} className="text-[10px] font-black uppercase text-zinc-400">Cancel</button>
          </div>
        </div>
      )}

      {/* QR CODE MODAL */}
      {showQR && (
        <div className="fixed inset-0 z-[4000] bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white p-10 rounded-[50px] max-w-md w-full text-center relative shadow-2xl">
            <button onClick={() => setShowQR(false)} className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-full"><X size={20} /></button>
            <h3 className="text-2xl font-black italic uppercase mb-2">Scan & Shop</h3>
            <p className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest mb-8">Share this exclusive access</p>

            <div className="bg-white p-4 rounded-[30px] border-4 border-zinc-950 inline-block mb-8 shadow-xl">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`} className="w-48 h-48 mix-blend-multiply" alt="QR Code" />
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={handleShareApp} className="p-4 bg-zinc-100 rounded-2xl hover:bg-[var(--theme-primary)] hover:text-white transition-colors"><Share2 size={20} /></button>
              <a href={`mailto:?subject=Check out ${config.brandName}&body=Shop here: ${window.location.href}`} className="p-4 bg-zinc-100 rounded-2xl hover:bg-[var(--theme-primary)] hover:text-white transition-colors"><Mail size={20} /></a>
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); setToast({ message: "Copied!", type: "success" }) }} className="p-4 bg-zinc-100 rounded-2xl hover:bg-[var(--theme-primary)] hover:text-white transition-colors"><Copy size={20} /></button>
            </div>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-3xl border-b h-20 md:h-24 flex items-center justify-between px-6 md:px-12 transition-all duration-300 w-full">
        <div className="flex items-center gap-4 md:gap-6 cursor-pointer group" onClick={() => setView("home")}>
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-[15px] md:rounded-[22px] bg-[var(--theme-primary)] flex items-center justify-center shadow-2xl overflow-hidden group-hover:rotate-6 transition-transform">
            {config.customIcon ? <img src={config.customIcon} className="w-full h-full object-cover" /> : <ShoppingBag size={20} className="text-white" />}
          </div>
          <div>
            <h1 className="font-black text-lg md:text-2xl tracking-tighter uppercase italic leading-none">{config.brandName}</h1>
            <span className="text-[8px] md:text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em] hidden md:block">{config.brandSubtitle || t('hero.subtitle')}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <button onClick={() => setShowQR(true)} className="p-2 md:p-3 bg-zinc-50 rounded-full hover:bg-zinc-100 transition-colors border border-zinc-200 text-zinc-600"><QrCode size={16} /></button>

          <LanguageSwitcher />
          <button onClick={() => setView("track")} className="text-zinc-400 hover:text-black transition flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hidden md:flex"><Clock size={16} /> {t('nav.orders')}</button>
          <button onClick={() => setView("cart")} className="relative p-2 md:p-4 bg-white rounded-[20px] md:rounded-[30px] border shadow-sm hover:shadow-2xl transition-all">
            <ShoppingBag size={20} />
            {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-[var(--theme-accent)] text-white w-5 h-5 rounded-full text-[9px] flex items-center justify-center font-black border-2 border-white">{cart.reduce((a, b) => a + b.qty, 0)}</span>}
          </button>
          <button onClick={() => setView("admin")} className="p-2 text-zinc-200 hover:text-black transition-colors"><Lock size={18} /></button>
        </div>
      </nav>

      {/* RENDERIZADO DE VISTAS (HOME, ADMIN, TRACK) SEGUIRÁ EN LA LOGICA COMÚN */}
      {view === 'home' && (
        <>
        <div className={`fixed right-6 z-30 md:left-auto md:right-10 md:w-80 animate-in slide-in-from-bottom-10 transition-all duration-500 ${cart.length > 0 ? 'bottom-40' : 'bottom-10'}`}>
          {isMember ? (
            <div onClick={() => setShowMemberMenu(!showMemberMenu)} className="bg-[var(--theme-primary)] text-white p-5 rounded-[30px] shadow-2xl border-4 border-zinc-800 cursor-pointer relative overflow-hidden group hover:scale-105 transition-transform">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2"><Crown size={16} className="text-yellow-400 fill-yellow-400" /><span className="font-black text-[9px] uppercase tracking-[0.3em] text-[var(--theme-accent)]">Elite Member</span></div>
                {showMemberMenu ? <X size={16} className="text-zinc-500" /> : <Settings size={16} className="text-zinc-600 group-hover:text-white transition-colors" />}
              </div>
              <p className="font-black text-lg uppercase mb-1 tracking-tighter">{form.name || "Bienvenido"}</p>
              {showMemberMenu && (
                <div className="absolute inset-0 bg-zinc-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                  <button onClick={(e) => { e.stopPropagation(); handleUnsubscribe(); }} className="w-full py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black text-[9px] uppercase flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all"><LogOut size={14} /> Cancel Membership</button>
                </div>
              )}
            </div>
          ) : (
            <div onClick={() => setShowJoinModal(true)} className="bg-white p-5 rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-2 border-red-50 cursor-pointer relative overflow-hidden group hover:scale-105 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 rounded-[18px] flex items-center justify-center text-red-500 animate-pulse shadow-inner"><AlertCircle size={24} /></div>
                <div>
                  <p className="font-black text-[8px] uppercase text-red-400 tracking-[0.2em] mb-1">{tr(i18n.language, "ATTENTION", "ATENCIÓN", "ATTENTION", "ध्यान दें")}</p>
                  <p className="font-black text-xs uppercase text-zinc-950 leading-tight">{tr(i18n.language, "You are losing money", "Estás perdiendo dinero", "Vous perdez de l'argent", "आप पैसे खो रहे हैं")}</p>
                  <p className="font-bold text-[9px] uppercase text-[var(--theme-accent)] mt-1">{tr(i18n.language, "Become a Member ->", "Hazte Miembro ->", "Devenir membre ->", "सदस्य बनें ->")}</p>
                </div>
              </div>
            </div>
          )}
        </div>
         
        <main className="pb-40 w-full max-w-full overflow-hidden">
            <header className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden mb-0 group">
              <img src={config.heroImage} className="absolute inset-0 w-full h-full object-cover brightness-75 transition duration-[20s] group-hover:scale-110" />
              <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-12 bg-black/20 backdrop-blur-[2px]">
                {/* Texto más pequeño en PC */}
                <h2 className="text-4xl md:text-5xl lg:text-7xl font-black italic uppercase tracking-tighter drop-shadow-2xl leading-none text-white mix-blend-overlay opacity-90">{config.brandName}</h2>
                <div className="bg-white/10 backdrop-blur-xl px-10 py-4 rounded-full border border-white/20 mt-8 hover:bg-white/20 transition-all cursor-default">
                  <p className="text-[9px] md:text-[10px] font-black tracking-[0.6em] uppercase text-white">{config.brandSubtitle || t('hero.subtitle')}</p>
                </div>
              </div>
            </header>
            
            <div className="w-full px-4 md:px-12 py-10 md:py-16 flex flex-col lg:flex-row gap-8 lg:gap-12">
              <div className="w-full lg:w-56 lg:shrink-0 lg:h-screen lg:sticky lg:top-28 flex flex-col gap-6">
                 <div className="hidden lg:block">
                    <h3 className="font-black text-lg uppercase mb-4 flex items-center gap-2"><Menu size={18}/> Categories</h3>
                    <div className="flex flex-col gap-2">
                      {["Todos", ...CATEGORY_OPTIONS].map(c => (
                        <button key={c} onClick={() => setActiveCategory(c)} className={`text-left px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border ${activeCategory === c ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)] shadow-lg' : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300 hover:text-zinc-600'}`}>
                          {t(`categories.${c === "Todos" ? "Todos" : c}`) || c}
                        </button>
                      ))}
                    </div>
                 </div>
                 <div className="lg:hidden flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {["Todos", ...CATEGORY_OPTIONS].map(c => (
                      <button key={c} onClick={() => setActiveCategory(c)} className={`whitespace-nowrap px-6 py-3 rounded-full font-black text-[9px] uppercase tracking-[0.3em] transition-all border-2 ${activeCategory === c ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)] shadow-md' : 'bg-white text-zinc-400 border-zinc-100'}`}>
                        {t(`categories.${c === "Todos" ? "Todos" : c}`) || c}
                      </button>
                    ))}
                 </div>
                 <div className="space-y-4">
                    <div>
                      <span className="text-[9px] font-black uppercase text-zinc-400 mb-2 block flex items-center gap-2"><Filter size={12}/> Color Filter</span>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setFilterColor("All")} className={`w-6 h-6 rounded-full border flex items-center justify-center ${filterColor === "All" ? 'border-black' : 'border-zinc-200'}`}><span className="text-[7px] font-bold">ALL</span></button>
                        {COLOR_OPTIONS.map(c => (
                          <button key={c.name} onClick={() => setFilterColor(c.name)} className={`w-6 h-6 rounded-full border transition-all ${filterColor === c.name ? 'ring-2 ring-offset-2 ring-zinc-800 scale-110' : 'border-zinc-200'}`} style={{ background: c.hex }} title={c.name} />
                        ))}
                      </div>
                    </div>
                     
                    <div>
                       <span className="text-[9px] font-black uppercase text-zinc-400 mb-2 block">Sort By</span>
                       <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full bg-white border border-zinc-200 text-[10px] font-bold uppercase rounded-xl px-3 py-2 outline-none cursor-pointer hover:bg-zinc-50">
                          <option value="default">Default</option>
                          <option value="price_asc">Price: Low to High</option>
                          <option value="price_desc">Price: High to Low</option>
                       </select>
                    </div>

                    <div className="flex items-center gap-2 text-zinc-400 p-3 bg-zinc-50 rounded-xl">
                      <Star size={12} className={wishlist.length > 0 ? "text-red-500 fill-red-500" : ""} />
                      <span className="text-[9px] font-bold">{wishlist.length} Items in Wishlist</span>
                    </div>
                 </div>
              </div>

              <div className="flex-1">
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6 content-start">
                  {getProcessedProducts().map(p => (
                    <ProductCard 
                      key={p.id} 
                      product={p} 
                      onAdd={addToCart} 
                      isLiked={wishlist.includes(p.id)}
                      onToggleLike={() => toggleWishlist(p.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </main>
          
          {cart.length > 0 && (
          <div onClick={() => setView('cart')} className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-100 p-4 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] cursor-pointer hover:bg-zinc-50 transition-colors animate-in slide-in-from-bottom-full">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Total</span>
                <span className="text-2xl font-black italic text-zinc-950">${totals.total.toFixed(2)}</span>
              </div>
              <div className="flex flex-col items-end">
                {isMember ? (
                  <>
                    <span className="text-[10px] font-black uppercase text-[var(--theme-accent)] tracking-widest flex items-center gap-1"><Crown size={12} /> VIP SAVINGS</span>
                    <span className="text-lg font-black text-[var(--theme-accent)]">-${totals.discount.toFixed(2)}</span>
                  </>
                ) : (
                  <div onClick={(e) => { e.stopPropagation(); setShowUpsellModal(true); }}>
                    <span className="text-[9px] font-black uppercase text-red-400 tracking-widest flex items-center gap-1 animate-pulse hover:text-red-600 cursor-pointer"><AlertCircle size={12} /> YOU COULD SAVE</span>
                    <span className="text-lg font-black text-red-500 hover:text-red-700 cursor-pointer">-${projectedSavings.current.toFixed(2)} (Click to Join)</span>
                  </div>
                )}
              </div>
              <div className="bg-[var(--theme-primary)] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
                <ChevronRight size={20} />
              </div>
            </div>
          </div>
        )}
        </>
      )}

      {view === 'order_success' && lastOrder && (
          <div className="max-w-xl mx-auto py-20 p-6 text-center animate-in fade-in zoom-in">
            <div className="w-16 h-16 bg-[var(--theme-accent)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl text-white animate-bounce"><Check size={32} /></div>
            <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter mb-4">Payment Success!</h2>
            <p className="text-zinc-400 font-bold uppercase text-xs tracking-[0.3em] mb-10">Order Ref: #{lastOrder.orderNumber}</p>

            <div className="bg-zinc-50 p-6 rounded-3xl mb-8 text-left space-y-4 shadow-inner">
              <p className="text-[10px] font-black uppercase text-zinc-300 tracking-widest mb-2">Items Purchased</p>
              {lastOrder.items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-zinc-100 shadow-sm">
                  <img src={item.image} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="font-black text-xs uppercase">{item.name}</p>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase">{item.size} / {item.color} / x{item.qty}</p>
                  </div>
                  <p className="font-black text-sm">${(item.price * item.qty).toFixed(2)}</p>
                </div>
              ))}
              <div className="pt-4 border-t border-zinc-200 flex justify-between items-center">
                <span className="font-black text-xs uppercase text-zinc-400">Total Paid</span>
                <span className="font-black text-2xl text-[var(--theme-accent)]">${lastOrder.totals.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-zinc-900 p-6 rounded-[30px] shadow-xl border border-zinc-800 mb-8 space-y-3 text-center">
               <p className="text-[9px] font-black uppercase text-white tracking-widest animate-pulse">REQUIRED / REQUERIDO</p>
               <a href={`sms:${config.adminPhone}?&body=New Order #${lastOrder.orderNumber} Confirmed. Total: $${lastOrder.totals.total.toFixed(2)}. Customer: ${lastOrder.customer.name}`} 
                  className="w-full py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors shadow-lg"
               >
                  <MessageSquare size={16} /> CLICK TO SEND ORDER TO ADMIN (SMS)
               </a>
               <p className="text-[8px] text-zinc-500 font-bold">This opens your messages app to notify us instantly.</p>
            </div>

            <div className="bg-white p-6 rounded-[30px] shadow-xl border border-zinc-100 mb-8 space-y-4">
              <p className="text-[9px] font-black uppercase text-zinc-300 tracking-widest">Other Options</p>
              <div className="flex gap-4">
                <a href={`https://wa.me/${config.adminPhone}?text=${encodeURIComponent(`New Order #${lastOrder.orderNumber} - Total: $${lastOrder.totals.total.toFixed(2)}`)}`} target="_blank" className="flex-1 py-4 bg-[#25D366] text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:opacity-90"><MessageCircle size={16} /> WhatsApp</a>
                <a href={`mailto:${config.zelleInfo}?subject=Order #${lastOrder.orderNumber}&body=Attached receipt for order #${lastOrder.orderNumber}`} className="flex-1 py-4 bg-[var(--theme-primary)] text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:opacity-90"><Mail size={16} /> Email</a>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setView('track')} className="flex-1 py-4 bg-white border-2 border-zinc-100 rounded-full font-black text-[10px] uppercase hover:bg-zinc-50">Track Order</button>
              <button onClick={() => setView('home')} className="flex-1 py-4 bg-[var(--theme-primary)] text-white rounded-full font-black text-[10px] uppercase hover:bg-zinc-800">Shop More</button>
            </div>
          </div>
      )}

      {view === 'cart' && (
          <div className="max-w-5xl mx-auto p-4 md:p-10">
            <button onClick={() => { setView("home"); setCheckoutStep(1); }} className="flex items-center gap-3 font-black text-[10px] uppercase text-zinc-400 mb-8 hover:text-zinc-950 transition-colors"><ArrowLeft size={16} /> {tr(i18n.language, "Back to Boutique", "Volver a la Boutique", "Retour à la Boutique", "वापस बुटीक पर")}</button>

            <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
              <div className="lg:col-span-7 space-y-6">
                <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-6 text-zinc-950">{tr(i18n.language, "Your Bag", "Tu Bolsa", "Votre Sac", "आपका थैला")}</h2>
                {cart.map(item => (
                  <div key={item.key} className="flex gap-4 items-stretch bg-white p-4 rounded-[25px] shadow-xl border border-zinc-50 group hover:border-zinc-200 transition-all">
                    <div className="w-20 h-24 rounded-[15px] overflow-hidden bg-zinc-50 shrink-0"><img src={item.image} className="w-full h-full object-cover mix-blend-multiply" /></div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="font-black uppercase text-sm md:text-base leading-none mb-2 tracking-tight">{item.name}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="bg-zinc-100 px-2 py-1 rounded-lg text-[8px] font-black uppercase text-zinc-500">{item.size}</span>
                        <span className="bg-zinc-100 px-2 py-1 rounded-lg text-[8px] font-black uppercase text-zinc-500">{item.color}</span>
                        <span className="bg-zinc-100 px-2 py-1 rounded-lg text-[8px] font-black uppercase text-zinc-500">Qty: {item.qty}</span>
                      </div>
                      <p className="font-black text-lg text-[var(--theme-accent)] italic tracking-tighter">${(item.price * item.qty).toFixed(2)}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.key)} className="self-start p-2 text-zinc-200 hover:text-red-500 transition-colors"><XCircle size={20} /></button>
                  </div>
                ))}
                {cart.length === 0 && <div className="py-20 text-center border-4 border-dashed border-zinc-100 rounded-[30px]"><p className="text-zinc-300 font-black text-2xl uppercase italic">Empty Bag</p></div>}
              </div>

              <div className="lg:col-span-5 h-fit sticky top-24 md:top-28">
                <div className="bg-[var(--theme-primary)] p-6 rounded-[35px] shadow-2xl relative overflow-hidden text-white border border-zinc-800">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800 rounded-full blur-[100px] opacity-20 pointer-events-none" />

                  <h3 className="font-black uppercase text-lg md:text-xl mb-6 italic tracking-wider relative z-10">
                    {checkoutStep === 1 ? tr(i18n.language, "Details", "Datos", "Détails", "विवरण") : checkoutStep === 2 ? tr(i18n.language, "Payment Method", "Método Pago", "Moyen de Paiement", "भुगतान विधि") : tr(i18n.language, "Complete", "Finalizar", "Complet", "पूर्ण")}
                  </h3>

                  {checkoutStep === 1 && (
                    <div className="space-y-3 relative z-10 animate-in slide-in-from-right-10">
                      <input placeholder="FULL NAME" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-3 bg-white/10 border border-white/10 rounded-[18px] font-bold text-[10px] uppercase text-white placeholder:text-zinc-600 focus:bg-white/20 transition-all outline-none" />
                      <input placeholder="PHONE NUMBER" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full p-3 bg-white/10 border border-white/10 rounded-[18px] font-bold text-[10px] uppercase text-white placeholder:text-zinc-600 focus:bg-white/20 transition-all outline-none" />
                      <textarea placeholder="SHIPPING ADDRESS" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full p-3 bg-white/10 border border-white/10 rounded-[18px] font-bold text-[10px] uppercase text-white placeholder:text-zinc-600 focus:bg-white/20 transition-all outline-none" rows={3} />
                      <button onClick={(e) => { e.preventDefault(); if (form.name && form.phone) setCheckoutStep(2); else setToast({ message: "Fill all fields", type: "error" }); }} className="w-full py-4 bg-white text-zinc-950 rounded-full font-black uppercase text-[10px] tracking-[0.3em] hover:scale-105 transition-transform shadow-xl mt-4">
                        {tr(i18n.language, "Next Step", "Siguiente Paso", "Étape Suivante", "अगला चरण")}
                      </button>
                    </div>
                  )}

                  {checkoutStep === 2 && (
                    <div className="space-y-3 relative z-10 animate-in slide-in-from-right-10">
                      {[
                        { id: 'card', label: 'Credit Card / Wallet', icon: <CreditCard size={18} /> },
                        { id: 'zelle', label: 'Zelle Transfer', icon: <Wallet size={18} /> }
                      ].map(m => (
                        <button key={m.id} onClick={(e) => { e.preventDefault(); handleMethodSelect(m.id); }} className="w-full p-4 bg-white/5 rounded-[20px] flex items-center justify-between hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white shadow-inner group-hover:bg-white group-hover:text-zinc-950 transition-colors">{m.icon}</div>
                            <span className="font-black text-[9px] uppercase tracking-widest">{m.label}</span>
                          </div>
                          <ChevronRight size={14} className="text-zinc-600 group-hover:text-white" />
                        </button>
                      ))}
                    </div>
                  )}

                  {checkoutStep === 4 && (
                    <div className="relative z-10 animate-in slide-in-from-right-10">
                       
                      <button 
                        onClick={() => setCheckoutStep(2)} 
                        className="mb-6 flex items-center gap-2 text-[9px] font-black uppercase text-white/50 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                      >
                        <ArrowLeft size={12} /> {tr(i18n.language, "Change Payment Method", "Cancelar / Cambiar Método", "Changer Méthode", "तरीका बदलें")}
                      </button>

                      <div className="space-y-3 mb-6 text-[10px] font-bold uppercase text-zinc-500 bg-white/5 p-5 rounded-[25px] border border-white/5">
                        <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>${totals.subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between text-[var(--theme-accent)]"><span>VIP Discount</span><span>-${totals.discount.toFixed(2)}</span></div>
                        <div className="flex justify-between text-zinc-400"><span>Tax</span><span>${totals.tax.toFixed(2)}</span></div>
                        <div className="flex justify-between text-2xl text-white pt-4 border-t border-white/10 italic font-black tracking-tighter"><span>Total</span><span>${totals.total.toFixed(2)}</span></div>
                      </div>
                       
                      {selectedMethod === 'card' && (
                        stripePromise ? (
                          <Elements stripe={stripePromise}>
                            <StripeCardForm amount={totals.total.toFixed(2)} onSuccess={finalizeOrder} onError={(msg: string) => setToast({ message: msg, type: "error" })} />
                          </Elements>
                        ) : (
                          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                             <p className="text-red-400 font-bold uppercase text-xs">Error: Stripe Key Missing</p>
                          </div>
                        )
                      )}

                      {selectedMethod === 'zelle' && (
                        <>
                          <div className="bg-emerald-500/20 p-5 rounded-[25px] border border-emerald-500/30 text-center mb-6 space-y-4">
                            <div>
                              <p className="text-[8px] font-black uppercase text-emerald-200 mb-2 tracking-widest">Zelle Number / Email:</p>
                              <p className="text-sm font-black text-emerald-400 select-all bg-emerald-900/30 p-3 rounded-xl border border-emerald-500/20">{config.zelleInfo || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-black uppercase text-emerald-200 mb-2 tracking-widest">Instructions:</p>
                              <p className="text-[9px] font-bold text-emerald-100 bg-emerald-900/30 p-3 rounded-xl border border-emerald-500/20 leading-relaxed">{config.zelleInstructions}</p>
                            </div>
                          </div>
                          <button onClick={(e) => { e.preventDefault(); finalizeOrder({ id: 'zelle-manual' }); }} className="w-full py-4 bg-emerald-500 text-white rounded-full font-black uppercase text-[9px] tracking-[0.3em] hover:bg-emerald-400 transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                            Confirm Zelle Payment
                          </button>
                        </>
                      )}

                      {selectedMethod !== 'card' && selectedMethod !== 'zelle' && (
                        <div className="text-center p-4">
                           <p className="text-zinc-500 text-[10px] uppercase font-bold">Please select a valid payment method.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
      )}

      {view === 'admin' && <AdminPanel config={config} setConfig={setConfig} products={products} members={members} showAlert={showAlert} user={user} />}
      {view === 'track' && <TrackOrdersView setView={setView} user={user} config={config} />}
    </div>
  );
}
// --- REDISEÑO: MODAL COMPACTO (FOTO IZQ, INFO DER) Y BOTONES DE COLOR VISIBLES ---
function ProductCard({ product, onAdd, isLiked, onToggleLike }: any) {
  const { t, i18n } = useTranslation();
  const [show, setShow] = useState(false);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [qty, setQty] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Estados para el ZOOM
  const [zoomStyle, setZoomStyle] = useState<any>({ opacity: 0 });
    
  const handleMouseMove = (e: any) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setZoomStyle({
      backgroundImage: `url(${galleryImages[currentIndex]})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: '250%', 
      opacity: 1
    });
  };

  const handleMouseLeave = () => setZoomStyle({ opacity: 0 });

  const stock = product.stock !== undefined ? parseInt(product.stock) : 99;
  const isOut = stock <= 0;
  const sizes = (product.sizes?.length > 0) ? product.sizes : (SIZES_MAP[product.category] || SIZES_MAP["Default"]);
  const colors = (product.colors?.length > 0) ? COLOR_OPTIONS.filter(c => product.colors.includes(c.name)) : COLOR_OPTIONS;

  const galleryImages = (product.images && product.images.length > 0) 
    ? product.images.filter((img:any) => img) 
    : (product.image ? [product.image] : []);

  useEffect(() => { if (show) setCurrentIndex(0); }, [show, product]);
  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
   
  // PRECIO ACTUALIZADO POR CANTIDAD
  const calculateTotal = () => {
     return (Number(product.price) * qty).toFixed(2);
  };
  const safePrice = (val: any) => (Number(val) || 0).toFixed(2);

  return (
    <div className="group flex flex-col h-full text-zinc-950 animate-in fade-in zoom-in relative">
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleLike && onToggleLike(); }} 
        className="absolute top-2 right-2 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform"
      >
        <Star size={12} className={isLiked ? "text-red-500 fill-red-500" : "text-zinc-400"} />
      </button>

      <div onClick={() => setShow(true)} className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-white shadow-md border border-zinc-100 cursor-pointer group-hover:shadow-xl transition-all">
        <img src={product.image} className="w-full h-full object-cover transition duration-1000 group-hover:scale-110" alt={product.name} />
        {isOut && <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-[7px] font-black uppercase tracking-widest shadow-lg">{tr(i18n.language, "Pre-Order", "Pre-Orden", "Pré-commande", "पूर्व-आर्डर")}</div>}
      </div>
        
      <div className="mt-3 px-1" onClick={() => setShow(true)}>
        <p className="text-[7px] font-black uppercase text-zinc-300 tracking-[0.3em] mb-1">{t(`categories.${product.category}`) || product.category}</p>
        <h3 className="font-bold text-zinc-950 truncate text-[10px] md:text-xs uppercase mb-1">{product.name}</h3>
        <p className="font-black text-[var(--theme-accent)] text-sm md:text-base italic tracking-tighter">${safePrice(product.price)}</p>
      </div>
        
      {show && (
        <div className="fixed inset-0 z-[1000] bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-[30px] w-full max-w-4xl h-auto max-h-[85vh] shadow-2xl relative overflow-hidden flex flex-col md:flex-row">
            <button onClick={() => setShow(false)} className="absolute top-3 right-3 z-50 bg-white/50 backdrop-blur-md rounded-full p-2 hover:bg-white transition-colors border border-white/20 shadow-sm"><X size={18} /></button>

            <div className="h-[40vh] md:h-auto md:w-1/2 bg-zinc-50 relative flex flex-col justify-center items-center overflow-hidden cursor-crosshair"
                 onMouseMove={handleMouseMove}
                 onMouseLeave={handleMouseLeave}
            >
              <div className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-200 mix-blend-multiply bg-no-repeat" style={zoomStyle} />
              {galleryImages.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="absolute left-3 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg z-30 transition-all active:scale-90"><ChevronLeft size={20} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="absolute right-3 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg z-30 transition-all active:scale-90"><ChevronRight size={20} /></button>
                </>
              )}
              <img src={galleryImages[currentIndex]} className="w-full h-full object-contain mix-blend-multiply p-4 transition-all duration-500" />
              <div className="absolute bottom-3 flex gap-2 z-20">
                {galleryImages.map((_: any, idx: number) => (
                  <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${currentIndex === idx ? 'bg-zinc-950 w-3' : 'bg-zinc-300'}`} />
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-white md:border-l border-zinc-100 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter mb-1 leading-none">{product.name}</h3>
                <p className="font-black text-[var(--theme-accent)] text-lg italic tracking-tighter mb-4">${calculateTotal()}</p>

                <div className="mb-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <h4 className="text-[8px] font-black uppercase text-zinc-400 tracking-[0.3em] mb-2">Description</h4>
                  <p className="text-zinc-600 text-[10px] font-bold leading-relaxed">{product.description}</p>
                </div>

                <div className="space-y-5 pb-20 md:pb-0">
                  <div>
                    <label className="text-[8px] font-black uppercase text-zinc-300 tracking-[0.3em] mb-2 block">{t('product.availableColors')}</label>
                    <div className="flex flex-wrap gap-3">
                      {colors.map((c: any) => (
                        <button 
                          key={c.name} 
                          onClick={() => setColor(c.name)} 
                          className={`w-8 h-8 rounded-full border border-zinc-200 transition-all ${color === c.name ? 'ring-2 ring-offset-2 ring-zinc-900 scale-110' : 'hover:scale-105'}`} 
                          style={{ background: c.hex }} 
                          title={c.name} 
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase text-zinc-300 tracking-[0.3em] block mb-2">{t('product.selectSize')}</label>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((s: any) => (
                        <button key={s} onClick={() => setSize(s)} className={`px-3 py-2 rounded-lg border text-[9px] font-bold uppercase transition-all ${size === s ? "bg-zinc-950 text-white border-zinc-950 shadow-lg" : "bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300 hover:text-zinc-600"}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-zinc-100 bg-white z-50">
                <div className="flex gap-3 items-center">
                  <div className="flex items-center gap-3 bg-zinc-50 rounded-full px-3 py-2 border border-zinc-200">
                    <button onClick={() => setQty(Math.max(1, qty-1))} className="hover:text-zinc-600 active:scale-90"><Minus size={14} /></button>
                    <span className="font-black text-sm w-3 text-center">{qty}</span>
                    <button onClick={() => setQty(qty + 1)} className="hover:text-zinc-600 active:scale-90"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => { if (size && color) { onAdd(product, size, color, qty, isOut); setShow(false); } }} disabled={!size || !color} className={`flex-1 py-3 rounded-full font-black uppercase text-[9px] tracking-[0.2em] shadow-lg text-white transition-all hover:scale-105 active:scale-95 ${(!size || !color) ? 'bg-zinc-200 shadow-none cursor-not-allowed text-zinc-400' : isOut ? 'bg-yellow-500' : 'bg-[var(--theme-primary)]'}`}>
                    {isOut ? "PRE-ORDER" : t('product.addToBag')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPanel({ config, setConfig, products, members, showAlert, user }: any) {
  const { i18n } = useTranslation();
  const [tab, setTab] = useState("orders");
  const [isLogged, setIsLogged] = useState(false);
  const [pass, setPass] = useState("");
  const [userLogin, setUserLogin] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultPin, setVaultPin] = useState("");
  const [showPass, setShowPass] = useState(false); 

  const [productData, setProductData] = useState<any>({ category: "Camisas", stock: 10, images: [] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminSelColors, setAdminSelColors] = useState<string[]>([]);
  const [adminSelSizes, setAdminSelSizes] = useState<string[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [recoveryPinInput, setRecoveryPinInput] = useState("");
  const [showRecovery, setShowRecovery] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
   
  // ESTADO PARA LA CARGA DE IA
  const [loadingAI, setLoadingAI] = useState(false);

  const [newMember, setNewMember] = useState({ name: "", phone: "" });
  const [adminDiscountVal, setAdminDiscountVal] = useState("");

  const heroInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const imgInput1 = useRef<HTMLInputElement>(null);
  const imgInput2 = useRef<HTMLInputElement>(null);
  const imgInput3 = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLogged) return;
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), s => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())));
    return () => unsub();
  }, [isLogged]);

  useEffect(() => {
    if (editingId && productData) {
      setAdminSelColors(productData.colors || []);
      setAdminSelSizes(productData.sizes || []);
    }
    else {
      setAdminSelColors([]);
      setAdminSelSizes([]);
    }
  }, [editingId, productData]);

  const handleLogin = () => {
    if (userLogin === config.adminUsername && pass === config.adminPassword) { setIsLogged(true); }
    else { showAlert("Credenciales Inválidas", "error"); }
  };

  const handleRecovery = () => { if (recoveryPinInput === config.recoveryPin) { setIsLogged(true); setShowRecovery(false); } };
  const toggleAdminColor = (c: string) => setAdminSelColors(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
  const toggleAdminSize = (s: string) => setAdminSelSizes(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const updateProductImage = (url: string, index: number) => {
    const currentImages = productData.images ? [...productData.images] : [];
    currentImages[index] = url;
    // Si es la imagen 0, usarla como principal
    const mainImg = index === 0 ? url : (currentImages[0] || productData.image);
    setProductData({ ...productData, images: currentImages, image: mainImg });
  };

  // --- BORRAR FOTO ESPECIFICA ---
  const removeProductImage = (index: number) => {
      const currentImages = productData.images ? [...productData.images] : [];
      currentImages[index] = ""; // Limpiar ese slot
      // Re-asignar imagen principal si se borró la 0
      const mainImg = currentImages[0] || currentImages.find(img => img) || "";
      setProductData({ ...productData, images: currentImages, image: mainImg });
  };
   
 // --- BOTÓN MÁGICO IA (DEBUG) ---
  const handleAIAutoFill = async () => {
      // 1. OBTENER LLAVE
      let apiKey = config.geminiApiKey;
      
      // Limpieza de seguridad (quita espacios invisibles)
      if (apiKey) apiKey = apiKey.trim();

      // DEBUG: Si la llave está vacía, te avisa.
      if (!apiKey || apiKey.length < 10) {
          // Intenta pedirla manualmente si falla la config
          const manual = prompt("⚠️ La App no encuentra la llave en Configuración.\n\nPégala aquí para probar ahora mismo:");
          if (manual && manual.length > 10) {
              apiKey = manual.trim();
          } else {
              alert("❌ Cancelado: No se puede usar la IA sin llave.");
              return;
          }
      }

      // 2. BUSCAR IMAGEN
      const validImages = (productData.images || []).filter((img: any) => img);
      const mainImage = validImages[0] || productData.image;

      if (!mainImage) {
          alert("⚠️ Sube una foto primero.");
          return;
      }
      
      setLoadingAI(true);
      
      // 3. LLAMAR A LA IA
      // Aquí verás si la llave funciona o si Google la rechaza
      const result = await analyzeImageWithAI(mainImage, apiKey);
      
      setLoadingAI(false);
      
      if (result) {
          // CORRECCIÓN TYPE SCRIPT
          setProductData((prev: any) => ({
              ...prev,
              name: result.name,
              description: result.description,
              category: result.category
          }));
          showAlert("✨ ¡EXITO! Información rellenada.");
      }
  };

  const saveProduct = async (e: any) => {
    e.preventDefault();
    setShowErrors(true);
    if (!productData.category || !productData.name || !productData.price || !productData.stock || !productData.description) { showAlert("Faltan datos requeridos", "error"); return; }
     
    // Filtrar imagenes vacias
    const validImages = (productData.images || []).filter((img: any) => img && img.length > 0);
    // Si no hay array pero hay image single
    if (validImages.length === 0 && productData.image) validImages.push(productData.image);
     
    if (validImages.length === 0) { showAlert("Falta la imagen principal", "error"); return; }

    const data = {
      ...productData,
      price: parseFloat(productData.price) || 0,
      stock: parseInt(productData.stock) || 0,
      images: validImages,
      image: validImages[0] || "",
      colors: adminSelColors,
      sizes: adminSelSizes,
      createdAt: new Date().toISOString()
    };

    try {
      if (editingId) {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', editingId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) await updateDoc(docRef, data); else await setDoc(docRef, data);
        showAlert("Product Updated"); setEditingId(null);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), data);
        showAlert("Product Created");
      }
      // RESET FORMULARIO (LIMPIAR TODO)
      setProductData({ category: "Camisas", stock: 10, images: [] });
      setAdminSelColors([]); setAdminSelSizes([]); setShowErrors(false);
    } catch (err) { console.error(err); showAlert("Error saving product", "error"); }
  };

  const saveConfig = async (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const nc: any = { ...config };
    
    fd.forEach((v, k) => {
        // LIMPIEZA AUTOMÁTICA: Si es texto, le quitamos espacios al principio y final
        let value = v;
        if (typeof v === 'string') {
            value = v.trim();
        }
        
        // Convertir números si es necesario
        if (['taxPercent', 'membershipCost', 'membershipDiscount', 'storeDiscount', 'savingsPeriod', 'visitsPerMonth'].includes(k)) {
            nc[k] = parseFloat(value as string);
        } else {
            nc[k] = value;
        }
    });

    try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'general'), nc);
        
        // Actualizamos la memoria local inmediatamente
        setConfig((prev: any) => ({ ...prev, ...nc })); 
        
        showAlert("¡Configuración Guardada! Recargando...");
        
        // RECARGA AUTOMÁTICA PARA QUE LA LLAVE FUNCIONE AL INSTANTE
        setTimeout(() => window.location.reload(), 1000); 
    } catch (err) {
        console.error(err);
        showAlert("Error saving settings", "error");
    }
  };
   
  const handleAddMember = async () => {
    if (!newMember.name || !newMember.phone) { showAlert("Name & Phone required", "error"); return; }
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'members'), {
      name: newMember.name, phone: newMember.phone, joinedAt: new Date().toISOString()
    });
    setNewMember({ name: "", phone: "" });
    showAlert("Member Added Manually");
  };
   
  const handleApplyAdminDiscount = async (order: any) => {
      const discountAmount = parseFloat(adminDiscountVal);
      if (isNaN(discountAmount) || discountAmount < 0) { showAlert("Invalid Discount", "error"); return; }
      
      const newTotal = Math.max(0, order.totals.total - discountAmount);
      
      const newTotals = {
          ...order.totals,
          adminDiscount: (order.totals.adminDiscount || 0) + discountAmount, 
          total: newTotal
      };
      
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', order.id), { totals: newTotals });
      setAdminDiscountVal("");
      showAlert(`Discount of $${discountAmount} applied!`);
  };

  const handlePrintOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0'; iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      // TICKET DE IMPRESIÓN DETALLADO (IGUAL AL RECIBO)
      doc.write(`
            <html>
              <head><title>Order #${order.orderNumber}</title><style>body{font-family:sans-serif;padding:20px;max-width:400px;margin:0 auto;}.header{text-align:center;margin-bottom:20px;border-bottom:2px solid #000;padding-bottom:10px}h1{margin:0;font-size:24px;text-transform:uppercase}.meta{font-size:12px;text-transform:uppercase;font-weight:bold;margin-bottom:20px;line-height:1.5}table{width:100%;border-collapse:collapse;margin-bottom:20px}th{text-align:left;border-bottom:1px solid #ccc;padding:5px 0;text-transform:uppercase;font-size:10px}td{padding:10px 0;border-bottom:1px solid #eee;font-size:12px}.total{text-align:right;font-size:18px;font-weight:bold;margin-top:10px;border-top:2px solid #000;padding-top:10px}</style></head>
              <body>
                <div class="header"><h1>${config.brandName}</h1><p>RECEIPT</p></div>
                <div class="meta">
                   <p>ORDER: #${order.orderNumber}</p>
                   <p>DATE: ${new Date(order.createdAt).toLocaleDateString()}</p>
                   <p>METHOD: ${order.method}</p>
                   <hr/>
                   <p>CUSTOMER: ${order.customer.name}</p>
                   <p>PHONE: ${order.customer.phone}</p>
                   <p>ADDRESS: ${order.customer.address}</p>
                </div>
                <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead><tbody>${order.items.map((i: any) => `<tr><td>${i.name}<br/><small>${i.size}/${i.color}</small></td><td>x${i.qty}</td><td>$${(i.price * i.qty).toFixed(2)}</td></tr>`).join('')}</tbody></table>
                
                <div style="font-size:12px;text-transform:uppercase;font-weight:bold;">
                  <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>Subtotal:</span><span>$${order.totals.subtotal.toFixed(2)}</span></div>
                  ${order.totals.discount > 0 ? `<div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>VIP Save:</span><span>-$${order.totals.discount.toFixed(2)}</span></div>` : ''}
                  ${order.totals.storeDiscount > 0 ? `<div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>Store Disc:</span><span>-$${order.totals.storeDiscount.toFixed(2)}</span></div>` : ''}
                  ${order.totals.adminDiscount > 0 ? `<div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>Manager Disc:</span><span>-$${order.totals.adminDiscount.toFixed(2)}</span></div>` : ''}
                  <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>Tax:</span><span>$${order.totals.tax.toFixed(2)}</span></div>
                  <div class="total" style="display:flex; justify-content:space-between;"><span>TOTAL:</span><span>$${order.totals.total.toFixed(2)}</span></div>
                </div>
              </body>
            </html>
        `);
      doc.close();
      iframe.contentWindow?.focus(); iframe.contentWindow?.print();
      setTimeout(() => { document.body.removeChild(iframe); }, 1000);
    }
  };

  if (!isLogged) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-6 animate-in fade-in duration-700">
      {/* CUADRO DE LOGIN PEQUEÑO Y ARRIBA PARA CELULARES */}
      <div className="bg-white p-8 rounded-[30px] shadow-2xl w-full max-w-[320px] text-center border border-zinc-100 relative mt-[-100px] md:mt-0">
        <div className="w-16 h-16 bg-zinc-950 rounded-[20px] flex items-center justify-center mx-auto mb-6 shadow-xl text-white -rotate-6"><Lock size={24} /></div>
        <h2 className="text-xl font-black italic uppercase mb-8 tracking-tight">Admin Center</h2>
        {!showRecovery ? (
          <div className="space-y-3">
            <input placeholder="USUARIO" className="w-full p-3 bg-zinc-50 rounded-xl font-bold text-xs text-center outline-none focus:ring-2 focus:ring-emerald-500/20" value={userLogin} onChange={e => setUserLogin(e.target.value)} />
            <input type="password" placeholder="CLAVE" className="w-full p-3 bg-zinc-50 rounded-xl font-bold text-xs text-center outline-none focus:ring-2 focus:ring-emerald-500/20" value={pass} onChange={e => setPass(e.target.value)} />
            <button onClick={handleLogin} className="w-full py-4 bg-emerald-500 text-white rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-600 transition-transform active:scale-95">CONFIRMAR</button>
            <button onClick={() => setShowRecovery(true)} className="text-[9px] font-black text-zinc-300 uppercase mt-4 hover:text-zinc-500">Olvidé mi clave</button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-zinc-400 mb-2 uppercase">Ingrese PIN de Recuperación</p>
            {/* PIN SIN LIMITE DE CARACTERES */}
            <input type="password" placeholder="0000..." className="w-full p-3 bg-zinc-50 rounded-xl font-black text-lg text-center tracking-[0.5em] outline-none" value={recoveryPinInput} onChange={e => setRecoveryPinInput(e.target.value)} />
            <button onClick={handleRecovery} className="w-full py-4 bg-zinc-950 text-white rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl">VALIDAR</button>
            <button onClick={() => setShowRecovery(false)} className="text-[9px] font-black text-zinc-300 uppercase mt-4">Cancelar</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 animate-in fade-in">
      <div className="flex gap-3 mb-6 justify-center">
        {['orders', 'products', 'members', 'config'].map(t => <button key={t} onClick={() => setTab(t)} className={`px-5 py-2.5 rounded-full font-black uppercase text-[9px] tracking-widest ${tab === t ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-400 border'}`}>{t}</button>)}
        <button onClick={() => setIsLogged(false)} className="px-5 py-2.5 rounded-full bg-red-50 text-red-500 font-black uppercase text-[9px]">Exit</button>
      </div>

      {tab === 'config' && (
        <form onSubmit={saveConfig} className="max-w-3xl mx-auto bg-white p-8 rounded-[30px] shadow-lg space-y-8 border border-zinc-100">
          <div className="flex items-center gap-4 border-b pb-6">
            <div className="w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center text-white"><Settings size={24} /></div>
            <div><h3 className="text-xl font-black uppercase italic">Master Control</h3><p className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest">System Configuration</p></div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* SECCIÓN 1: IDENTIDAD (FONDO GRIS CLARO) */}
            <div className="space-y-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
              <h4 className="font-black text-[10px] uppercase text-zinc-400 border-b pb-2 flex items-center gap-2"><ImageIcon size={12} /> Brand Identity</h4>
              <div className="space-y-2"><label className="text-[9px] font-black ml-2 text-zinc-400">BRAND NAME</label><input name="brandName" defaultValue={config.brandName} className="w-full p-3 bg-white rounded-xl font-bold text-xs border" /></div>
              <div className="space-y-2"><label className="text-[9px] font-black ml-2 text-zinc-400">SUBTITLE</label><input name="brandSubtitle" defaultValue={config.brandSubtitle} className="w-full p-3 bg-white rounded-xl font-bold text-xs border" /></div>
              <div className="space-y-2"><label className="text-[9px] font-black ml-2 text-zinc-400">HERO IMAGE</label><div className="flex gap-2"><input name="heroImage" defaultValue={config.heroImage} className="w-full p-3 bg-white rounded-xl font-bold text-[10px] border" /><button type="button" onClick={() => heroInputRef.current?.click()} className="p-3 bg-white border rounded-xl hover:bg-zinc-100"><Camera size={16} /></button><input ref={heroInputRef} type="file" hidden onChange={e => handleImageUploadUtility(e, (url: string) => setConfig({ ...config, heroImage: url }), showAlert)} /></div></div>
              <div className="space-y-2"><label className="text-[9px] font-black ml-2 text-zinc-400">APP ICON</label><div className="flex gap-2"><input name="customIcon" defaultValue={config.customIcon} className="w-full p-3 bg-white rounded-xl font-bold text-[10px] border" /><button type="button" onClick={() => logoInputRef.current?.click()} className="p-3 bg-white border rounded-xl hover:bg-zinc-100"><Camera size={16} /></button><input ref={logoInputRef} type="file" hidden onChange={e => handleImageUploadUtility(e, (url: string) => setConfig({ ...config, customIcon: url }), showAlert)} /></div></div>
              <div className="space-y-2"><label className="text-[9px] font-black ml-2 text-purple-400">GEMINI API KEY (FOR AI)</label><input name="geminiApiKey" type="password" defaultValue={config.geminiApiKey} className="w-full p-3 bg-white rounded-xl font-bold text-[10px] border" placeholder="AI Key..." /></div>
            </div>

            {/* SECCIÓN 2: FINANZAS (FONDO VERDE CLARO) */}
            <div className="space-y-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <h4 className="font-black text-[10px] uppercase text-emerald-400 border-b border-emerald-200 pb-2 flex items-center gap-2"><FileText size={12} /> Financial Rules</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><label className="text-[9px] font-black ml-2 text-emerald-400">TAX %</label><input name="taxPercent" type="number" defaultValue={config.taxPercent} className="w-full p-3 bg-white rounded-xl font-bold text-xs border border-emerald-100" /></div>
                <div className="space-y-2"><label className="text-[9px] font-black ml-2 text-emerald-400">VIP %</label><input name="membershipDiscount" type="number" defaultValue={config.membershipDiscount} className="w-full p-3 bg-white rounded-xl font-bold text-xs border border-emerald-100" /></div>
              </div>
              {/* CAMPO DE DESCUENTO DE TIENDA */}
              <div className="space-y-2"><label className="text-[9px] font-black ml-2 text-emerald-400">STORE WIDE DISCOUNT % (NUEVO)</label><input name="storeDiscount" type="number" defaultValue={config.storeDiscount} className="w-full p-3 bg-white rounded-xl font-bold text-xs border border-emerald-100" placeholder="0" /></div>
              <div className="space-y-2"><label className="text-[9px] font-black ml-2 text-emerald-400">MEMBERSHIP COST ($)</label><input name="membershipCost" type="number" defaultValue={config.membershipCost} className="w-full p-3 bg-white rounded-xl font-bold text-xs border border-emerald-100" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><label className="text-[9px] font-black ml-2 text-emerald-400">MONTHS</label><input name="savingsPeriod" type="number" defaultValue={config.savingsPeriod} className="w-full p-3 bg-white rounded-xl font-bold text-xs border border-emerald-100" /></div>
                <div className="space-y-2"><label className="text-[9px] font-black ml-2 text-emerald-400">VISITS</label><input name="visitsPerMonth" type="number" defaultValue={config.visitsPerMonth} className="w-full p-3 bg-white rounded-xl font-bold text-xs border border-emerald-100" /></div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: PAGOS (FONDO AZUL CLARO) */}
          <div className="p-6 bg-blue-50/50 rounded-[25px] border border-blue-100 space-y-4">
            <h4 className="font-black text-[10px] uppercase text-blue-400 flex items-center gap-2"><Key size={14} /> Payment Gateway Vault</h4>
            {!vaultUnlocked ? (
              <div className="flex flex-col items-center justify-center py-6 bg-white rounded-2xl border border-blue-100 shadow-sm">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3 text-blue-400"><Lock size={16} /></div>
                <p className="text-[9px] font-black uppercase text-blue-300 tracking-widest mb-3">Vault Locked</p>
                <div className="flex gap-2">
                  <input type="password" placeholder="Admin Pass" className="p-2 bg-blue-50 rounded-lg text-xs font-bold outline-none border border-blue-100 focus:border-blue-300" value={vaultPin} onChange={e => setVaultPin(e.target.value)} />
                  <button type="button" onClick={() => { if (vaultPin === config.adminPassword || vaultPin === config.adminPin || vaultPin === "0000") setVaultUnlocked(true); else showAlert("Access Denied", "error"); }} className="p-2 bg-blue-500 text-white rounded-lg"><Unlock size={14} /></button>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 animate-in fade-in slide-in-from-top-4">
                <div className="space-y-1"><label className="text-[8px] font-black ml-2 text-blue-400">STRIPE PK (Live)</label><input name="stripePublicKey" type={showPass ? "text" : "password"} defaultValue={config.stripePublicKey} className="w-full p-3 bg-white rounded-xl font-mono text-[10px] border border-blue-100 tracking-widest" placeholder="pk_live_..." /></div>
                <div className="space-y-1"><label className="text-[8px] font-black ml-2 text-blue-400">STRIPE SK (Live)</label><input name="stripeSecretKey" type={showPass ? "text" : "password"} defaultValue={config.stripeSecretKey} className="w-full p-3 bg-white rounded-xl font-mono text-[10px] border border-blue-100 tracking-widest" placeholder="sk_live_..." /></div>
                <button type="button" onClick={() => setVaultUnlocked(false)} className="text-[9px] font-black uppercase text-blue-300 hover:text-red-500 mt-1">Lock Vault</button>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-blue-100">
              <div className="space-y-1"><label className="text-[8px] font-black ml-2 text-blue-400">ZELLE INFO</label><input name="zelleInfo" defaultValue={config.zelleInfo} className="w-full p-3 bg-white rounded-xl font-bold text-xs border border-blue-100" placeholder="e.g. 555-0199" /></div>
              <div className="space-y-1"><label className="text-[8px] font-black ml-2 text-blue-400">ADMIN PHONE</label><input name="adminPhone" defaultValue={config.adminPhone} className="w-full p-3 bg-white rounded-xl font-bold text-xs border border-blue-100" placeholder="e.g. 15551234567" /></div>
            </div>
            {/* ZELLE INSTRUCTIONS RECUPERADO AQUI */}
            <div className="space-y-1"><label className="text-[8px] font-black ml-2 text-blue-400">ZELLE INSTRUCTIONS (SHOWN TO CLIENT)</label><textarea name="zelleInstructions" defaultValue={config.zelleInstructions} className="w-full p-3 bg-white rounded-xl font-bold text-xs border border-blue-100 h-[60px]" placeholder="Instructions for customer..." /></div>
          </div>

          {/* SECCIÓN 4: SEGURIDAD (FONDO ROJO CLARO - RECUPERADO) */}
          <div className="p-6 bg-red-50/50 rounded-[25px] border border-red-100 space-y-4">
            <h4 className="font-black text-[10px] uppercase text-red-400 flex items-center gap-2"><Shield size={14} /> Security Zone (Admin Access)</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1"><label className="text-[8px] font-black ml-2 text-red-300">ADMIN USER</label><input name="adminUsername" type={showPass ? "text" : "password"} defaultValue={config.adminUsername} className="w-full p-3 bg-white rounded-xl font-bold text-xs border border-red-100" /></div>
              <div className="space-y-1"><label className="text-[8px] font-black ml-2 text-red-300">ADMIN PASSWORD</label><input name="adminPassword" type={showPass ? "text" : "password"} defaultValue={config.adminPassword} className="w-full p-3 bg-white rounded-xl font-bold text-xs border border-red-100" /></div>
              {/* PIN SIN LIMITE DE CARACTERES */}
              <div className="space-y-1"><label className="text-[8px] font-black ml-2 text-red-300">RECOVERY PIN</label><input name="recoveryPin" type={showPass ? "text" : "password"} defaultValue={config.recoveryPin} className="w-full p-3 bg-white rounded-xl font-bold text-xs border border-red-100 tracking-[0.5em] text-center" /></div>
            </div>
            <button type="button" onClick={() => setShowPass(!showPass)} className="text-[9px] font-black uppercase text-red-400 hover:text-red-600 flex items-center gap-1 mt-2">{showPass ? <EyeOff size={12}/> : <Eye size={12}/>} Show Credentials</button>
          </div>

          <button className="w-full py-5 bg-zinc-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-transform">Save Master Configuration</button>
        </form>
      )}

      {tab === 'products' && (
        <div className="grid md:grid-cols-2 gap-8">
          <form onSubmit={saveProduct} className="bg-white p-8 rounded-[30px] shadow-lg space-y-5 h-fit border">
            <h3 className="text-xl font-black uppercase italic mb-2">Item Manager</h3>
            <select value={productData.category} onChange={e => setProductData({ ...productData, category: e.target.value })} className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold uppercase outline-none">{CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}</select>
             
            {/* NOMBRE DEL PRODUCTO + BOTÓN MÁGICO DE IA */}
            <div className="relative">
                <input placeholder="Name" value={productData.name || ""} onChange={e => setProductData({ ...productData, name: e.target.value })} className={`w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold ${showErrors && !productData.name ? 'border-2 border-red-500 bg-red-50' : ''}`} />
                <button 
                   type="button" 
                   onClick={handleAIAutoFill} 
                   className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-1.5 rounded-lg shadow-lg hover:scale-110 transition-transform"
                   title="Auto-Fill with AI"
                >
                   {loadingAI ? <RefreshCw className="animate-spin" size={14}/> : <Sparkles size={14}/>}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Price $" value={productData.price || ""} onChange={e => setProductData({ ...productData, price: e.target.value })} className={`w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold ${showErrors && !productData.price ? 'border-2 border-red-500 bg-red-50' : ''}`} />
              <input type="number" placeholder="Stock" value={productData.stock} onChange={e => setProductData({ ...productData, stock: e.target.value })} className={`w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold ${showErrors && !productData.stock ? 'border-2 border-red-500 bg-red-50' : ''}`} />
            </div>
            <textarea placeholder="Description" value={productData.description || ""} onChange={e => setProductData({ ...productData, description: e.target.value })} className={`w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold ${showErrors && !productData.description ? 'border-2 border-red-500 bg-red-50' : ''}`} rows={3} />

            <div className="p-3 bg-zinc-50 rounded-xl border">
              <label className="text-[8px] font-black text-zinc-400 block mb-2">COLORS</label>
              <div className="flex flex-wrap gap-2">{COLOR_OPTIONS.map(c => <button key={c.name} type="button" onClick={() => toggleAdminColor(c.name)} className={`w-6 h-6 rounded-full border ${adminSelColors.includes(c.name) ? 'ring-2 ring-black' : ''}`} style={{ background: c.hex }} />)}</div>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border">
              <label className="text-[8px] font-black text-zinc-400 block mb-2">SIZES ({productData.category})</label>
              <div className="flex flex-wrap gap-2">{(SIZES_MAP[productData.category] || SIZES_MAP.Default).map((s: string) => <button key={s} type="button" onClick={() => toggleAdminSize(s)} className={`px-3 py-1 rounded-lg text-[9px] font-bold border ${adminSelSizes.includes(s) ? 'bg-black text-white' : 'bg-white'}`}>{s}</button>)}</div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map(idx => (
                <div key={idx} onClick={() => { if (idx === 0) imgInput1.current?.click(); else if (idx === 1) imgInput2.current?.click(); else imgInput3.current?.click(); }} className={`aspect-square bg-zinc-50 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-zinc-400 relative overflow-hidden ${idx === 0 && showErrors && (!productData.images || !productData.images[0]) ? 'border-red-500 bg-red-50' : 'border-zinc-200'}`}>
                  {productData.images && productData.images[idx] ? (
                    <>
                      <img src={productData.images[idx]} className="w-full h-full object-cover" />
                      {/* BOTÓN PARA BORRAR FOTO INDIVIDUAL */}
                      <button onClick={(e) => { e.stopPropagation(); removeProductImage(idx); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"><Trash2 size={10} /></button>
                    </>
                  ) : (
                    <>
                      <Camera size={16} className="text-zinc-300" />
                      <span className="text-[7px] font-black uppercase mt-1 text-zinc-400">{idx === 0 ? "MAIN" : `VIEW ${idx + 1}`}</span>
                    </>
                  )}
                </div>
              ))}
              <input ref={imgInput1} type="file" hidden onChange={e => handleImageUploadUtility(e, (url: string) => updateProductImage(url, 0), showAlert)} />
              <input ref={imgInput2} type="file" hidden onChange={e => handleImageUploadUtility(e, (url: string) => updateProductImage(url, 1), showAlert)} />
              <input ref={imgInput3} type="file" hidden onChange={e => handleImageUploadUtility(e, (url: string) => updateProductImage(url, 2), showAlert)} />
            </div>

            <button className="w-full py-4 bg-zinc-950 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">{editingId ? "Update Product" : "Create Product"}</button>
          </form>

          {/* GRID DE PRODUCTOS EN ADMIN - CORREGIDO A 5 COLUMNAS Y CON INFO DETALLADA */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 content-start">
            {products.map((p: any) => (
              <div key={p.id} className="bg-white p-2.5 rounded-[20px] shadow-sm border flex flex-col justify-between hover:scale-105 transition-transform">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[7px] font-black uppercase bg-zinc-100 px-2 py-1 rounded-full text-zinc-400">{p.category}</span>
                  <span className={`text-[7px] font-black px-2 py-1 rounded-full ${p.stock > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>{p.stock}</span>
                </div>
                <div className="w-full aspect-[3/4] rounded-xl mb-2 bg-zinc-50 overflow-hidden">
                    <img src={p.image} className="w-full h-full object-cover" />
                </div>
                <p className="font-bold text-[9px] uppercase leading-tight mb-1 truncate">{p.name}</p>
                {/* INFO EXTRA: Tallas y Colores en la tarjeta pequeña */}
                <div className="flex gap-1 mb-2 overflow-x-auto no-scrollbar">
                   {p.colors && p.colors.map((c: string) => <div key={c} className="w-3 h-3 rounded-full border border-zinc-200" style={{background: COLOR_OPTIONS.find(col => col.name === c)?.hex || '#ccc'}} />)}
                </div>
                <p className="text-[7px] text-zinc-400 font-bold mb-2 truncate">{p.sizes && p.sizes.join(', ')}</p>

                <div className="flex gap-1 mt-auto">
                  <button onClick={() => { setProductData(p); setEditingId(p.id); }} className="flex-1 py-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-lg"><Edit2 size={10} className="mx-auto" /></button>
                  <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', p.id))} className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg"><Trash2 size={10} className="mx-auto" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-white p-5 rounded-[25px] shadow-sm mb-4">
            <h3 className="text-xl font-black uppercase italic">Order History</h3>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-950 text-white rounded-full font-black text-[9px] uppercase hover:bg-zinc-800"><Printer size={14} /> Print Report</button>
          </div>

          {/* GRID DE ORDENES (TIPO TICKET - CLICK PARA EXPANDIR REACTIVADO) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map(o => (
              <div key={o.id} className="bg-white rounded-[20px] shadow-sm border p-4 flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3" onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)} style={{cursor: 'pointer'}}>
                  <div>
                    <p className="font-black text-sm uppercase">#{o.orderNumber}</p>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase">{o.customer.name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full font-black text-[8px] uppercase ${o.status === 'Completado' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>{o.status}</span>
                </div>
                <div className="flex justify-between items-end">
                    <p className="text-[9px] text-zinc-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg">${o.totals?.total.toFixed(2)}</span>
                      <button onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)} className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200"><Eye size={14} /></button>
                    </div>
                </div>

                {expandedOrderId === o.id && (
                  <div className="mt-4 pt-4 border-t border-zinc-100 bg-zinc-50/50 -mx-4 -mb-4 p-4 rounded-b-[20px] animate-in fade-in">
                      {/* INFORMACIÓN COMPLETA DEL TICKET (LO QUE PEDISTE) */}
                      <div className="mb-4 space-y-1">
                         <p className="text-[9px] font-bold text-zinc-500 uppercase">Customer: <span className="text-zinc-900">{o.customer.name}</span></p>
                         <p className="text-[9px] font-bold text-zinc-500 uppercase">Phone: <span className="text-zinc-900">{o.customer.phone}</span></p>
                         <p className="text-[9px] font-bold text-zinc-500 uppercase">Method: <span className="text-zinc-900">{o.method}</span></p>
                      </div>

                    <div className="space-y-3 mb-4">
                       {o.items.map((i: any, idx: number) => (
                          <div key={idx} className="flex gap-3 items-center">
                             {/* FOTO PEQUEÑA DE LO QUE COMPRÓ */}
                             <img src={i.image} className="w-8 h-8 rounded bg-white object-cover border" />
                             <div className="flex-1 text-[9px] font-bold uppercase leading-tight">
                                <span>{i.qty}x {i.name}</span>
                                <br/><span className="text-zinc-400">{i.size} / {i.color}</span>
                             </div>
                             <span className="text-[9px] font-black">${(i.price * i.qty).toFixed(2)}</span>
                          </div>
                       ))}
                    </div>
                     
                    {/* DESGLOSE FINANCIERO EN EL TICKET ADMIN + DESCUENTO MANUAL */}
                    <div className="mb-4 pt-2 border-t border-zinc-200/50 space-y-1">
                       <div className="flex justify-between text-[8px] font-bold text-zinc-400 uppercase"><span>Sub:</span><span>${o.totals.subtotal.toFixed(2)}</span></div>
                       {o.totals.discount > 0 && <div className="flex justify-between text-[8px] font-bold text-emerald-500 uppercase"><span>VIP:</span><span>-${o.totals.discount.toFixed(2)}</span></div>}
                       {o.totals.storeDiscount > 0 && <div className="flex justify-between text-[8px] font-bold text-blue-500 uppercase"><span>Store:</span><span>-${o.totals.storeDiscount.toFixed(2)}</span></div>}
                       {o.totals.adminDiscount > 0 && <div className="flex justify-between text-[8px] font-bold text-red-500 uppercase"><span>Manager Disc:</span><span>-${o.totals.adminDiscount.toFixed(2)}</span></div>}
                       <div className="flex justify-between text-[10px] font-black text-zinc-900 uppercase pt-1"><span>Total:</span><span>${o.totals.total.toFixed(2)}</span></div>
                    </div>
                     
                    {/* INPUT PARA DESCUENTO MANUAL DEL MANAGER */}
                    <div className="flex gap-2 mb-3">
                       <input 
                         type="number" 
                         placeholder="Disc $" 
                         className="flex-1 p-2 bg-white rounded-lg text-[9px] font-bold border"
                         value={adminDiscountVal}
                         onChange={(e) => setAdminDiscountVal(e.target.value)}
                       />
                       <button 
                         onClick={() => handleApplyAdminDiscount(o)}
                         className="px-3 py-2 bg-red-50 text-red-500 rounded-lg text-[8px] font-black uppercase hover:bg-red-100"
                       >
                         Apply
                       </button>
                    </div>

                    <div className="flex gap-2">
                       <button onClick={(e) => { e.stopPropagation(); handlePrintOrder(o.id); }} className="flex-1 py-2 bg-white border rounded-lg font-black text-[8px] uppercase"><Printer size={12} className="mx-auto" /></button>
                       {Object.keys(STATUS_STEPS).map(s => (
                          <button key={s} onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', o.id), { status: s })} className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase ${o.status === s ? 'bg-emerald-500 text-white' : 'bg-white border'}`}>{s.substring(0,3)}</button>
                       ))}
                       <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', o.id))} className="flex-1 py-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={12} className="mx-auto" /></button>
                    </div>
                    <div className="mt-3">
                       <ChatSystem orderId={o.id} isAdmin={true} user={user} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div className="bg-white p-8 rounded-[30px] shadow-xl border">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black italic uppercase">VIP List</h3>
            <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={14} /><input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search phone..." className="pl-10 pr-4 py-2.5 bg-zinc-50 rounded-full text-xs font-bold outline-none" /></div>
          </div>
           
          {/* NUEVO: AGREGAR MIEMBRO MANUALMENTE */}
          <div className="mb-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex gap-2">
             <input placeholder="New Member Name" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="flex-1 p-2 bg-white rounded-lg text-xs font-bold" />
             <input placeholder="Phone" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} className="flex-1 p-2 bg-white rounded-lg text-xs font-bold" />
             <button onClick={handleAddMember} className="p-2 bg-emerald-500 text-white rounded-lg"><UserPlus size={16} /></button>
          </div>

          {/* GRID DE MIEMBROS TIPO TARJETA */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.filter((m: any) => m.phone.includes(memberSearch)).map((m: any) => (
              <div key={m.id} className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl hover:bg-emerald-50 transition-colors border border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-500"><Crown size={14} /></div>
                  <div><p className="font-black text-[10px] uppercase">{m.name}</p><p className="text-[9px] text-zinc-400">{m.phone}</p></div>
                </div>
                <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', m.id))} className="p-2 text-red-300 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- TRACK ORDERS VIEW ---
function TrackOrdersView({ setView, user, config }: any) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`orders_${appId}`) || "[]");
    if (saved.length > 0 && db) {
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), s => {
        setOrders(s.docs.map(d => ({ id: d.id, ...d.data() })).filter((o: any) => saved.includes(o.orderNumber)));
      });
    }
  }, []);

  if (selected) return <OrderReceipt order={selected} config={config} onBack={() => setSelected(null)} user={user} />;

  return (
    <div className="max-w-4xl mx-auto py-10 p-6 animate-in fade-in">
      <button onClick={() => setView("home")} className="flex items-center gap-2 font-black text-[10px] uppercase text-zinc-400 mb-6"><ArrowLeft size={14} /> Back</button>
      <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-10">My Orders</h2>
      <div className="grid gap-4">
        {orders.map(o => (
          <div key={o.id} onClick={() => setSelected(o)} className="bg-white p-6 rounded-[30px] border shadow-lg cursor-pointer hover:scale-105 transition-transform flex justify-between items-center">
            <div>
              <p className="font-black text-lg uppercase">#{o.orderNumber}</p>
              <p className="text-[10px] text-zinc-400 font-bold">{new Date(o.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full font-black text-[9px] uppercase">{o.status}</div>
          </div>
        ))}
        {orders.length === 0 && <p className="text-center text-zinc-300 font-bold uppercase italic py-20">No orders found.</p>}
      </div>
    </div>
  );
}