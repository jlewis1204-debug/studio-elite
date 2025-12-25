import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ShoppingBag, Lock, Phone, Star, Truck, Settings, Edit2, ArrowLeft,
  Trash2, Plus, User, CheckCircle, CreditCard, AlertCircle, ShieldCheck,
  Send, MapPin, Clock, Menu, X, Smartphone, Printer, Save, XCircle,
  ExternalLink, ChevronDown, ChevronUp, Share2, Camera, Search, QrCode,
  Check, Tag, Filter, Palette, Image as ImageIcon, AlertTriangle, Wallet, 
  DollarSign, Layers, Eye, EyeOff, Unlock, Upload, Loader2, Sparkles, Wand2, Users,
  Minus, MessageCircle, Ruler, Receipt, Mail, Share, Heart, Bot, Zap, Eye as EyeIcon,
  SearchCheck, UserPlus, History, ShieldAlert, KeyRound, Fingerprint, RefreshCcw, PartyPopper
} from "lucide-react";

import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, User as FirebaseUser } from "firebase/auth";
import { 
  getFirestore, collection, doc, onSnapshot, updateDoc, setDoc, 
  deleteDoc, addDoc, query, orderBy, getDoc 
} from "firebase/firestore";

// --- DEFINICIÓN DE TIPOS (Arregla errores de "Property does not exist") ---
interface Message {
  id: string;
  orderId: string;
  text: string;
  sender: 'admin' | 'client';
  time: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: keyof typeof STATUS_STEPS;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  items: any[];
  totals: {
    total: number;
    subtotal: number;
    discount: number;
    tax: number;
  };
}

interface Config {
  brandName: string;
  brandSubtitle: string;
  logoUrl: string;
  customIcon: string;
  heroImage: string;
  taxPercent: number;
  membershipCost: number;
  membershipDiscount: number;
  adminUsername: string;
  adminPassword: string;
  adminPin: string;
  recoveryPin: string;
  storePhone: string;
  zelleInfo: string;
}

// Declaración para evitar error de variable global
declare global {
  interface Window {
    __initial_auth_token?: string;
  }
}

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

// @ts-ignore
const appId = process.env.REACT_APP_APP_ID || "studio-elite-production-final";

const CATEGORY_OPTIONS = ["Caballeros", "Damas", "Niños", "Accesorios", "Ofertas"];
const STATUS_STEPS = { "Pagado": 25, "Preparando": 50, "Enviado": 75, "Completado": 100 };
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "7", "8", "9", "10", "11", "12"];

// --- 3. UTILIDADES ---
const handleImageUploadUtility = (e: React.ChangeEvent<HTMLInputElement>, callback: (res: any) => void, showAlert: any) => {
  const file = e.target.files?.[0];
  if (file) {
    if (file.size > 1500000) {
      if (showAlert) showAlert("Imagen muy pesada (>1.5MB)", "error");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => callback(reader.result);
    reader.readAsDataURL(file);
  }
};

// --- 4. SUB-COMPONENTES ---

function CustomToast({ message, type, onClose }: { message: string | null, type: string, onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  if (!message) return null;
  return (
    <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-3 px-10 py-5 rounded-full shadow-2xl animate-in slide-in-from-top-6 text-white font-black text-[10px] uppercase tracking-[0.2em] border border-white/20 ${type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
      {type === "error" ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
      {String(message)}
    </div>
  );
}

function ChatSystem({ orderId, isAdmin = false, user }: { orderId: string, isAdmin?: boolean, user: FirebaseUser | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !db) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
    return onSnapshot(q, (snap) => {
      const filtered = snap.docs.map(d => ({id: d.id, ...d.data()} as Message))
        .filter(m => m.orderId === orderId)
        .sort((a,b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      setMessages(filtered);
    });
  }, [orderId, user]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), {
      orderId, text, sender: isAdmin ? 'admin' : 'client', time: new Date().toISOString()
    });
    setText("");
  };

  return (
    <div className="bg-zinc-50 rounded-[45px] border border-zinc-100 overflow-hidden flex flex-col h-[350px]">
      <div className="p-5 bg-white border-b flex items-center gap-2 font-black text-[9px] uppercase tracking-widest text-zinc-400">Canal de Soporte</div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar text-zinc-950">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender === (isAdmin ? 'admin' : 'client') ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-[25px] text-xs font-bold leading-relaxed shadow-sm ${m.sender === (isAdmin ? 'admin' : 'client') ? 'bg-zinc-950 text-white shadow-xl' : 'bg-white border text-zinc-600 shadow-sm'}`}>{m.text}</div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
      <form onSubmit={send} className="p-4 bg-white border-t flex gap-3">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Mensaje..." className="flex-1 px-6 py-3 bg-zinc-50 rounded-2xl text-xs outline-none font-bold text-zinc-950" />
        <button type="submit" className="p-3 bg-zinc-950 text-white rounded-2xl active:scale-90 transition-transform"><Send size={18}/></button>
      </form>
    </div>
  );
}

function ProductCard({ product, onAdd }: { product: Product, onAdd: any }) {
  const [showOptions, setShowOptions] = useState(false);
  const [selSize, setSelSize] = useState("M");
  const [qty, setQty] = useState(1);

  return (
    <div className="group flex flex-col h-full text-zinc-950 animate-in fade-in zoom-in duration-700">
      <div onClick={() => setShowOptions(true)} className="relative aspect-[3/4.4] overflow-hidden rounded-[60px] bg-white shadow-xl border border-zinc-100 cursor-pointer group-hover:shadow-2xl transition-all border-[6px] border-transparent group-hover:border-white">
        <img src={product.image} className="w-full h-full object-cover transition duration-1000 group-hover:scale-110" alt={product.name} />
      </div>
      <div className="mt-6 px-4" onClick={() => setShowOptions(true)}>
        <p className="text-[10px] font-black uppercase text-zinc-300 tracking-[0.3em] mb-2">{product.category}</p>
        <h3 className="font-bold text-zinc-950 leading-tight truncate text-lg uppercase tracking-tight mb-2">{product.name}</h3>
        <p className="font-black text-emerald-600 text-2xl italic tracking-tighter">${Number(product.price).toFixed(2)}</p>
      </div>

      {showOptions && (
        <div className="fixed inset-0 z-[1000] bg-zinc-950/95 backdrop-blur-3xl flex items-center justify-center p-0 md:p-8 animate-in fade-in zoom-in-95 duration-300 overflow-y-auto">
          <div className="bg-white rounded-none md:rounded-[80px] max-w-5xl w-full min-h-screen md:min-h-[700px] shadow-2xl relative overflow-hidden flex flex-col md:flex-row border-0 md:border-[15px] border-white text-zinc-950">
            <button onClick={() => { setShowOptions(false); setQty(1); }} className="absolute top-8 right-10 text-zinc-300 hover:text-zinc-950 z-[1100] transition-transform hover:rotate-90"><X size={45} /></button>
            <div className="md:w-1/2 bg-zinc-50 flex items-center justify-center overflow-hidden h-[45vh] md:h-auto border-r border-zinc-100">
              <img src={product.image} className="w-full h-full object-cover animate-in zoom-in duration-1000" alt={product.name} />
            </div>
            <div className="md:w-1/2 p-12 flex flex-col justify-between bg-white text-zinc-950">
              <div>
                <h3 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter mb-6 leading-[0.9] text-zinc-950">{product.name}</h3>
                <p className="text-zinc-400 text-[11px] uppercase font-bold mb-14 leading-relaxed tracking-widest">{product.description || "Pieza exclusiva de la colección contemporánea STUDIO ELITE."}</p>
                <div className="space-y-12">
                  <div>
                    <label className="text-[11px] font-black uppercase text-zinc-300 tracking-[0.4em] mb-5 block italic">Seleccionar Talla</label>
                    <div className="flex flex-wrap gap-4 text-zinc-950">
                      {SIZE_OPTIONS.map(s => (
                        <button key={s} onClick={() => setSelSize(s)} className={`min-w-[75px] h-16 rounded-[22px] border-2 font-black text-sm transition-all ${selSize === s ? "bg-zinc-950 text-white border-zinc-950 shadow-2xl scale-110" : "bg-white text-zinc-300 border-zinc-100 hover:border-zinc-300"}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-16">
                <div className="bg-zinc-950 text-white p-7 rounded-[40px] flex items-center justify-between mb-6 shadow-2xl border border-white/10">
                  <div className="flex items-center gap-8 text-white">
                    <button onClick={() => setQty(Math.max(1, qty-1))} className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-white"><Minus size={20}/></button>
                    <span className="font-black text-3xl tabular-nums">{qty}</span>
                    <button onClick={() => setQty(qty+1)} className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-white"><Plus size={20}/></button>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-emerald-400 mb-1 tracking-widest">Total Pieza</p>
                    <p className="text-4xl font-black italic tracking-tighter text-white">${(Number(product.price) * qty).toFixed(2)}</p>
                  </div>
                </div>
                <button onClick={() => { onAdd(product, selSize, "Multicolor", qty); setShowOptions(false); }} className="w-full py-8 btn-emerald-premium rounded-full font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl hover:bg-emerald-600 active:scale-95 transition-all text-white text-white">Add To Bag</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderReceipt({ order, config, onBack, user }: { order: Order, config: Config, onBack: () => void, user: FirebaseUser | null }) {
  const progress = STATUS_STEPS[order.status] || 0;
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 print:p-0 text-zinc-950">
      <div className="bg-white rounded-[80px] shadow-2xl border border-zinc-100 overflow-hidden">
        <div className="p-16 bg-zinc-950 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-16 opacity-5"><Receipt size={300} /></div>
          <div className="relative z-10">
              <div className="flex items-center gap-6 mb-12">
                 <div className="w-24 h-24 rounded-[35px] overflow-hidden border-4 border-white/20 shadow-2xl bg-white flex items-center justify-center text-zinc-950">
                    <ShoppingBag size={45} />
                 </div>
                 <h2 className="text-6xl font-black italic uppercase tracking-tighter leading-none">{config.brandName}</h2>
              </div>
              <p className="text-emerald-400 font-black text-sm uppercase tracking-[0.6em] mb-4">Recibo Boutique Oficial</p>
              <p className="text-zinc-500 text-xl font-bold tracking-widest uppercase">ORDEN: <span className="text-white">#{order.orderNumber}</span></p>
          </div>
        </div>
        <div className="p-16 bg-white">
            <div className="flex justify-between items-center mb-8 font-black uppercase text-xs text-zinc-300 tracking-widest"><span>Estado del Pedido</span><span className="text-emerald-600 bg-emerald-50 px-8 py-3 rounded-full border border-emerald-100">{order.status}</span></div>
            <div className="h-6 bg-zinc-50 rounded-full mb-16 overflow-hidden border shadow-inner"><div className="h-full bg-emerald-500 transition-all duration-[2000ms] ease-out" style={{width:`${progress}%`}} /></div>
            
            <div className="grid md:grid-cols-2 gap-24">
              <div>
                 <h4 className="text-[11px] font-black uppercase text-zinc-400 mb-10 tracking-[0.5em] italic border-b pb-4">Detalle de Compra</h4>
                 <div className="space-y-8">
                   {order.items?.map((it, idx) => (
                     <div key={idx} className="flex justify-between text-xl font-black uppercase tracking-tighter text-zinc-950">
                        <span className="text-zinc-400 font-bold">{it.qty}x <span className="text-zinc-950">{it.name}</span></span>
                        <span className="text-zinc-950">${(it.qty * it.price).toFixed(2)}</span>
                     </div>
                   ))}
                   <div className="mt-16 pt-12 border-t-4 border-dashed border-zinc-100 flex justify-between text-6xl font-black italic text-emerald-600 tracking-tighter"><span>TOTAL</span><span>${order.totals?.total?.toFixed(2)}</span></div>
                 </div>
              </div>
              <div>
                 <h4 className="text-[11px] font-black uppercase text-zinc-400 mb-10 tracking-[0.5em] italic border-b pb-4">Datos de Entrega</h4>
                 <div className="bg-zinc-50 p-12 rounded-[55px] space-y-6 border border-zinc-100 shadow-inner">
                    <p className="font-black text-3xl uppercase tracking-tighter text-zinc-950">{order.customer?.name}</p>
                    <p className="text-zinc-500 font-black text-lg tracking-widest">{order.customer?.phone}</p>
                    <p className="text-zinc-400 text-sm font-bold italic uppercase leading-relaxed">{order.customer?.address}</p>
                 </div>
                 <div className="mt-12"><ChatSystem orderId={order.id} user={user} /></div>
              </div>
            </div>
        </div>
      </div>
      <button onClick={onBack} className="mt-20 w-full py-9 bg-zinc-950 text-white rounded-[40px] font-black uppercase text-xs tracking-[0.5em] shadow-2xl hover:bg-emerald-600 active:scale-95 transition-all text-white">Cerrar Recibo Oficial</button>
    </div>
  );
}

function AdminPanel({ config, setConfig, products, members, showAlert, setView, user }: { config: Config, setConfig: any, products: Product[], members: any[], showAlert: any, setView: any, user: FirebaseUser | null }) {
  const [tab, setTab] = useState("orders");
  const [isLogged, setIsLogged] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryPinInput, setRecoveryPinInput] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [userLogin, setUserLogin] = useState("");
  const [pass, setPass] = useState("");
  const [tempImage, setTempImage] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !isLogged || !db) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
    return onSnapshot(q, s => setOrders(s.docs.map(d => ({id: d.id, ...d.data()} as Order)).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())));
  }, [user, isLogged]);

  const handleLogin = () => {
    if (userLogin === config.adminUsername && pass === config.adminPassword) {
      setIsLogged(true); showAlert("Identidad Maestra Confirmada");
    } else showAlert("Credenciales Inválidas", "error");
  };

  const handleRecovery = () => {
    if (recoveryPinInput === config.recoveryPin) {
      setIsLogged(true); setShowRecovery(false); showAlert("Acceso por PIN Concedido");
    } else showAlert("PIN Incorrecto", "error");
  };

  const saveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.currentTarget;
    const data = {
      name: (target.elements.namedItem('p_name') as HTMLInputElement).value, 
      price: parseFloat((target.elements.namedItem('p_price') as HTMLInputElement).value),
      category: (target.elements.namedItem('p_category') as HTMLSelectElement).value,
      image: tempImage || (target.elements.namedItem('p_url') as HTMLInputElement).value,
      description: (target.elements.namedItem('p_desc') as HTMLTextAreaElement).value,
      createdAt: new Date().toISOString()
    };
    if (editingProduct) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', editingProduct.id), data);
      setEditingProduct(null);
    } else {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), data);
    }
    setTempImage(""); target.reset(); showAlert("Inventario Actualizado");
  };

  const saveConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nc: any = {...config};
    fd.forEach((v, k) => {
      const val = v.toString();
      if(['taxPercent', 'membershipCost', 'membershipDiscount'].includes(k)) nc[k] = parseFloat(val);
      else nc[k] = val;
    });
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'general'), nc);
    setConfig(nc);
    showAlert("Boutique Actualizada");
  };

  if (!isLogged) return (
    <div className="max-w-md mx-auto py-32 px-6 text-zinc-950 animate-in slide-in-from-bottom-12 duration-1000">
      <div className="bg-white p-14 rounded-[75px] shadow-2xl text-center border relative">
        <div className="w-20 h-20 bg-zinc-950 rounded-[30px] flex items-center justify-center mx-auto mb-10 shadow-2xl text-white rotate-3"><Lock size={36} /></div>
        <h2 className="text-3xl font-black italic uppercase mb-10">Admin Center</h2>
        {showRecovery ? (
          <div className="space-y-6">
             <input type="password" placeholder="PIN" className="w-full p-6 bg-zinc-50 border-none rounded-[30px] text-center text-xl font-bold tracking-[0.8em] outline-none shadow-inner" value={recoveryPinInput} onChange={e => setRecoveryPinInput(e.target.value)} maxLength={4}/>
             <button onClick={handleRecovery} className="w-full py-7 btn-emerald-premium rounded-[30px] font-black uppercase text-xs text-white">Validar PIN</button>
             <button onClick={() => setShowRecovery(false)} className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-4">Login Normal</button>
          </div>
        ) : (
          <div className="space-y-6">
            <input placeholder="USUARIO" className="w-full p-6 bg-zinc-50 rounded-[30px] font-black text-xs outline-none shadow-inner border-none" value={userLogin} onChange={e => setUserLogin(e.target.value)} />
            <input type="password" placeholder="CLAVE" className="w-full p-6 bg-zinc-50 rounded-[30px] font-black text-xs outline-none shadow-inner border-none" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <button onClick={handleLogin} className="w-full py-7 btn-emerald-premium rounded-[30px] font-black uppercase text-xs tracking-widest shadow-2xl text-white">Confirmar</button>
            <button onClick={() => setShowRecovery(true)} className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mt-4 italic">Olvidé mi Clave</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700 text-zinc-950">
      <div className="flex flex-col lg:flex-row justify-between items-center mb-16 gap-8">
        <h2 className="text-7xl font-black italic uppercase tracking-tighter">Control Center</h2>
        <div className="flex flex-wrap gap-3 bg-white p-3 rounded-[40px] shadow-2xl border border-zinc-100">
          {["orders", "products", "members", "config"].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-10 py-4 rounded-[30px] font-black text-[10px] uppercase tracking-widest transition-all ${tab === t ? 'bg-zinc-950 text-white shadow-xl' : 'text-zinc-400 hover:text-zinc-950'}`}>{t}</button>
          ))}
          <button onClick={() => setIsLogged(false)} className="px-10 py-4 text-[9px] font-black text-red-500 uppercase rounded-[30px] border border-red-50 hover:bg-red-50">Salir</button>
        </div>
      </div>

      {tab === "config" && (
        <div className="max-w-4xl mx-auto bg-white p-12 rounded-[70px] shadow-2xl border">
          <h3 className="text-3xl font-black italic uppercase mb-10">Boutique Configuration</h3>
          <form onSubmit={saveConfig} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2"><label className="text-[9px] font-black ml-4 text-zinc-400">NOMBRE BOUTIQUE</label><input name="brandName" defaultValue={config.brandName} className="w-full p-4 bg-zinc-50 rounded-2xl font-black text-xs outline-none border-none shadow-inner" /></div>
                 <div className="space-y-2"><label className="text-[9px] font-black ml-4 text-zinc-400">SUBTÍTULO</label><input name="brandSubtitle" defaultValue={config.brandSubtitle} className="w-full p-4 bg-zinc-50 rounded-2xl font-black text-xs outline-none border-none shadow-inner" /></div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                 <div className="space-y-2"><label className="text-[9px] font-black ml-4 text-zinc-400">LOGO URL</label><input name="logoUrl" defaultValue={config.logoUrl} className="w-full p-4 bg-zinc-50 rounded-2xl font-black text-xs outline-none border-none shadow-inner" /></div>
                 <div className="space-y-2"><label className="text-[9px] font-black ml-4 text-zinc-400">ICONO URL</label><input name="customIcon" defaultValue={config.customIcon} className="w-full p-4 bg-zinc-50 rounded-2xl font-black text-xs outline-none border-none shadow-inner" /></div>
                 <div className="space-y-2"><label className="text-[9px] font-black ml-4 text-zinc-400">IMAGEN HERO</label><input name="heroImage" defaultValue={config.heroImage} className="w-full p-4 bg-zinc-50 rounded-2xl font-black text-xs outline-none border-none shadow-inner" /></div>
              </div>
              <button type="submit" className="w-full py-6 btn-emerald-premium rounded-full font-black uppercase text-xs tracking-widest shadow-xl text-white text-white">Guardar Cambios Maestros</button>
          </form>
        </div>
      )}

      {tab === "products" && (
        <div className="space-y-16">
          <div className="bg-white p-16 rounded-[80px] shadow-2xl border-4 border-white">
            <h3 className="text-4xl font-black italic uppercase mb-10">Inventario Elite</h3>
            <form onSubmit={saveProduct} className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <input name="p_name" defaultValue={editingProduct?.name} placeholder="Nombre Comercial" className="w-full p-5 bg-zinc-50 rounded-2xl font-black text-xs uppercase shadow-inner border-none" required />
                <div className="grid grid-cols-2 gap-4">
                  <input name="p_price" type="number" step="0.01" defaultValue={editingProduct?.price} placeholder="Precio $" className="p-5 bg-zinc-50 rounded-2xl font-black text-xs shadow-inner border-none" required />
                  <select name="p_category" defaultValue={editingProduct?.category} className="p-5 bg-zinc-50 rounded-2xl font-black text-[10px] uppercase shadow-inner border-none">
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <textarea name="p_desc" defaultValue={editingProduct?.description} placeholder="Descripción..." className="w-full p-5 bg-zinc-50 rounded-2xl font-black text-xs outline-none shadow-inner border-none" rows={4} />
                <input name="p_url" defaultValue={editingProduct?.image} placeholder="URL de Imagen" className="w-full p-5 bg-zinc-50 rounded-2xl font-black text-xs outline-none shadow-inner border-none" />
              </div>
              <div className="flex flex-col items-center justify-center p-10 bg-zinc-50 rounded-[50px] border shadow-inner">
                 <div onClick={() => fileRef.current?.click()} className="w-full py-12 bg-zinc-950 text-white rounded-3xl flex flex-col items-center gap-3 cursor-pointer hover:bg-emerald-50 transition-all text-white text-white">
                    <Camera size={24}/><span className="text-[9px] font-black uppercase tracking-widest">Cargar Imagen</span>
                    <input ref={fileRef} type="file" className="hidden" onChange={e => handleImageUploadUtility(e, setTempImage, showAlert)} />
                 </div>
                 {(tempImage || editingProduct?.image) && <img src={tempImage || editingProduct?.image} className="mt-8 w-40 h-52 object-cover rounded-3xl border-8 border-white shadow-2xl" />}
                 <button type="submit" className="w-full py-6 btn-emerald-premium rounded-full font-black uppercase text-xs mt-10 shadow-xl text-white">Publicar</button>
              </div>
            </form>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
             {products.map(p => (
               <div key={p.id} className="p-4 bg-white rounded-[35px] border shadow-xl transition-all">
                  <img src={p.image} className="w-full aspect-square object-cover rounded-[25px] mb-4 shadow-sm" />
                  <p className="text-[9px] font-black uppercase truncate mb-4">{p.name}</p>
                  <div className="flex gap-2">
                     <button onClick={() => {setEditingProduct(p); setTempImage("");}} className="flex-1 p-2 bg-zinc-950 text-white rounded-xl"><Edit2 size={12} className="mx-auto"/></button>
                     <button onClick={async () => { if(window.confirm("¿Eliminar?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', p.id)); }} className="flex-1 p-2 bg-red-500 text-white rounded-xl"><Trash2 size={12} className="mx-auto"/></button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="grid gap-12">
          {orders.map(order => (
            <div key={order.id} className="bg-white p-10 rounded-[60px] border shadow-xl flex flex-col xl:flex-row gap-12">
              <div className="flex-1">
                <span className="bg-zinc-950 text-white px-8 py-3 rounded-full font-black text-xs shadow-lg">#{order.orderNumber}</span>
                <div className="grid md:grid-cols-2 gap-12 mt-12">
                   <div>
                      <h4 className="text-[10px] font-black uppercase text-zinc-300 mb-6 italic">Cliente</h4>
                      <p className="font-black text-xl mb-1 uppercase">{order.customer?.name}</p>
                   </div>
                   <div className="bg-zinc-50 p-8 rounded-[40px]">
                      <h4 className="text-[10px] font-black uppercase text-zinc-300 mb-4 italic">Venta</h4>
                      <div className="mt-6 pt-6 border-t border-dashed flex justify-between font-black text-2xl text-emerald-600 italic"><span>TOTAL</span><span>${order.totals?.total?.toFixed(2)}</span></div>
                   </div>
                </div>
                <div className="mt-12"><ChatSystem orderId={order.id} isAdmin={true} user={user} /></div>
              </div>
              <div className="md:w-56 flex flex-col gap-3">
                 {Object.keys(STATUS_STEPS).map(s => (
                   <button key={s} onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', order.id), {status: s})} className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${order.status === s ? 'bg-emerald-500 text-white shadow-lg' : 'bg-zinc-50 text-zinc-400'}`}>{s}</button>
                 ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrackOrdersView({ setView, user, config }: { setView: any, user: FirebaseUser | null, config: Config }) {
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`orders_${appId}`) || "[]");
    setOrderIds(saved);
    if (!user) setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user || orderIds.length === 0 || !db) {
      setLoading(false);
      return;
    }
    return onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), (snap) => {
        setOrders(snap.docs.map(d => ({id: d.id, ...d.data()} as Order)).filter(o => orderIds.includes(o.orderNumber)));
        setLoading(false);
    }, (err) => console.error("Error track orders snapshot:", err));
  }, [user, orderIds]);

  if (selectedOrder) return <OrderReceipt order={selectedOrder} config={config} onBack={() => setSelectedOrder(null)} user={user} />;

  return (
    <div className="max-w-4xl mx-auto py-12 animate-in fade-in">
      <button onClick={() => setView("home")} className="flex items-center gap-3 mb-10 text-zinc-400 hover:text-black font-black text-xs uppercase tracking-widest transition-colors"><ArrowLeft size={18}/> Boutique</button>
      <h2 className="text-6xl font-black italic uppercase tracking-tighter mb-16 border-l-8 border-emerald-50 pl-8">Mis Pedidos</h2>
      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-200" size={64}/></div> : 
        orders.length > 0 ? (
          <div className="grid gap-8">
            {orders.map(o => (
              <div key={o.id} onClick={() => setSelectedOrder(o)} className="bg-white p-10 rounded-[50px] border shadow-xl flex justify-between items-center cursor-pointer hover:scale-105 transition-all">
                <div><p className="font-black text-2xl tracking-tighter italic uppercase">ORDEN #{o.orderNumber}</p></div>
                <div className="bg-emerald-50 text-emerald-600 px-6 py-2 rounded-full font-black text-[10px] uppercase">{o.status}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[60px] border-4 border-dashed border-zinc-100 text-zinc-100 uppercase font-black text-2xl italic tracking-widest">Sin historial</div>
        )
      }
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [view, setView] = useState("home");
  const [products, setProducts] = useState<Product[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [isMember, setIsMember] = useState(false);
  const [toast, setToast] = useState<{ message: string | null, type: string }>({ message: null, type: "success" });
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationTarget, setCelebrationTarget] = useState("home");

  const [config, setConfig] = useState<Config>({
    brandName: "STUDIO ELITE",
    brandSubtitle: "Contemporary Curation",
    logoUrl: "",
    customIcon: "",
    heroImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80",
    taxPercent: 7,
    membershipCost: 15,
    membershipDiscount: 20,
    adminUsername: "admin",
    adminPassword: "123",
    adminPin: "0000",
    recoveryPin: "0000",
    storePhone: "",
    zelleInfo: ""
  });

  const [form, setForm] = useState({ name: "", phone: "", address: "", paymentMethod: "stripe" });

  const showAlert = (msg: string, type = "success") => setToast({ message: String(msg), type });

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = window.__initial_auth_token;
        if (token) {
          try {
            await signInWithCustomToken(auth, token);
          } catch (tokenErr) {
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Auth global error:", e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const unsubP = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'products'), s => setProducts(s.docs.map(d => ({id: d.id, ...d.data()} as Product))), (e) => console.error(e));
    const unsubC = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'general'), s => s.exists() && setConfig(prev => ({...prev, ...s.data()} as Config)), (e) => console.error(e));
    const unsubM = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'members'), s => setMembers(s.docs.map(d => ({id: d.id, ...d.data()}))), (e) => console.error(e));
    return () => { unsubP(); unsubC(); unsubM(); };
  }, [user]);

  useEffect(() => { document.title = config.brandName; }, [config.brandName]);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + (Number(item.price) * item.qty), 0);
    const discount = isMember ? subtotal * (config.membershipDiscount / 100) : 0;
    const tax = (subtotal - discount) * (config.taxPercent / 100);
    return { subtotal, discount, tax, total: subtotal - discount + tax };
  }, [cart, isMember, config]);

  const addToCart = (product: Product, size: string, color: string, qty: number) => {
    const key = `${product.id}-${size}-${color}`;
    setCart(prev => {
      const exists = prev.find(i => i.key === key);
      if (exists) return prev.map(i => i.key === key ? {...i, qty: i.qty + qty} : i);
      return [...prev, { key, id: product.id, name: product.name, price: product.price, size, color, qty, image: product.image }];
    });
    showAlert(`¡${product.name} en la bolsa!`);
  };

  const removeFromCart = (key: string) => setCart(prev => prev.filter(item => item.key !== key));

  const handleRegisterMember = async (e: any) => {
    e.preventDefault();
    if (!user) return;
    const phone = e.target.m_phone.value;
    if (members.find(m => m.phone === phone)) return showAlert("Ya eres Miembro Elite", "error");
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'members'), { name: e.target.m_name.value, phone, joinDate: Date.now(), lastPurchaseDate: Date.now() });
    setCelebrationTarget("home"); setShowJoinModal(false); setShowCelebration(true);
  };

  const handlePaymentSelect = (method: string) => {
    if (!form.name || !form.phone) return showAlert("Por favor escribe tu nombre y teléfono", "error");
    setForm({...form, paymentMethod: method});
    const existing = members.find(m => m.phone === form.phone);
    if (existing) {
      setIsMember(true);
      showAlert("¡Confirmado como Miembro VIP!");
    } else if (!isMember) {
      setShowOfferModal(true);
    }
  };

  const handleJoinFromCheckout = async () => {
    if (!user) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'members'), { name: form.name, phone: form.phone, joinDate: Date.now(), lastPurchaseDate: Date.now() });
    setIsMember(true); setCelebrationTarget("checkout"); setShowOfferModal(false); setShowDeclineConfirm(false); setShowCelebration(true);
  };

  const submitOrder = async () => {
    if (!form.name || !form.phone || !form.address || !user) return showAlert("Completa los datos", "error");
    setIsProcessing(true);
    setShowCelebration(false);
    setShowDeclineConfirm(false);
    await new Promise(r => setTimeout(r, 1500));
    const orderNum = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderData = { 
        id: "", 
        orderNumber: orderNum, 
        customer: {...form}, 
        items: cart, 
        totals, 
        status: "Pagado" as keyof typeof STATUS_STEPS, 
        createdAt: new Date().toISOString() 
    };
    const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderData);
    const finalOrder = { ...orderData, id: docRef.id };
    setCart([]); setView("success"); setIsProcessing(false); setCurrentOrder(finalOrder);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 font-sans selection:bg-emerald-100">
      <CustomToast message={toast.message} type={toast.type} onClose={() => setToast({...toast, message: null})} />

      {/* ESTILOS GLOBALES */}
      <style>{`
        .btn-emerald-premium { 
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          box-shadow: 0 15px 35px -10px rgba(16, 185, 129, 0.4);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .btn-emerald-premium:hover { transform: scale(1.05) translateY(-3px); filter: brightness(1.1); }
        .celebration-anim { animation: scaleIn 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes scaleIn { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* CELEBRACIÓN MAESTRA */}
      {showCelebration && (
        <div className="fixed inset-0 z-[2000] bg-zinc-950/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-1000">
           <div className="bg-white rounded-[90px] max-w-2xl w-full p-20 text-center shadow-[0_0_150px_rgba(16,185,129,0.3)] border-8 border-emerald-50 celebration-anim relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#10b98115_0%,transparent_70%)] animate-pulse" />
              <div className="w-40 h-40 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-12 text-white shadow-2xl animate-bounce">
                <Star size={85} className="fill-white" />
              </div>
              <h2 className="text-7xl font-black italic uppercase tracking-tighter mb-8 leading-none">¡BIENVENIDO!</h2>
              <p className="text-zinc-400 text-lg font-black uppercase tracking-widest mb-16 italic leading-relaxed">Tu membresía Elite ha sido activada con éxito. El privilegio STUDIO ELITE es ahora tuyo.</p>
              <button onClick={() => celebrationTarget === "home" ? setShowCelebration(false) : submitOrder()} className="w-full py-9 btn-emerald-premium rounded-full font-black uppercase text-[11px] tracking-[0.5em] shadow-2xl">
                {celebrationTarget === "home" ? "Volver a la Boutique" : "Pagar con Descuento VIP"}
              </button>
           </div>
        </div>
      )}

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-3xl border-b h-24 flex items-center justify-between px-6 md:px-16">
        <div className="flex items-center gap-6 cursor-pointer group" onClick={() => setView("home")}>
          <div className="w-14 h-14 rounded-[22px] bg-zinc-950 flex items-center justify-center shadow-2xl overflow-hidden group-hover:rotate-6 transition-transform">
            {config.logoUrl ? <img src={config.logoUrl} className="w-full h-full object-cover" /> : config.customIcon ? <img src={config.customIcon} className="w-full h-full object-cover" /> : <ShoppingBag size={28} className="text-white" />}
          </div>
          <div>
            <h1 className="font-black text-3xl tracking-tighter uppercase italic leading-none">{config.brandName}</h1>
            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em]">{config.brandSubtitle}</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <button onClick={() => setView("track")} className="text-zinc-400 hover:text-black transition flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"><Clock size={18}/> Pedidos</button>
          <button onClick={() => setView("cart")} className="relative p-5 bg-white rounded-[30px] border shadow-sm hover:shadow-2xl transition-all">
            <ShoppingBag size={24} />
            {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-white">{cart.reduce((a,b)=>a+b.qty,0)}</span>}
          </button>
          <button onClick={() => setView("admin")} className="p-3 text-zinc-300 hover:text-zinc-950"><Lock size={20} /></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {view === "home" && (
          <div className="animate-in fade-in duration-1000">
            <header className="relative h-[75vh] rounded-[80px] overflow-hidden mb-24 border-[15px] border-white shadow-2xl group">
              <img src={config.heroImage} className="absolute inset-0 w-full h-full object-cover brightness-75 transition duration-[15s] group-hover:scale-110" />
              <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-12 bg-black/10">
                <h2 className="text-8xl md:text-[12rem] font-black italic uppercase tracking-tighter drop-shadow-2xl leading-none text-white">{config.brandName}</h2>
                <div className="bg-white/10 backdrop-blur-xl px-12 py-5 rounded-full border border-white/20 mt-10">
                  <p className="text-[10px] md:text-base font-black tracking-[0.5em] uppercase text-white">{config.brandSubtitle}</p>
                </div>
                {!isMember && (
                  <button onClick={() => setShowJoinModal(true)} className="bg-white text-zinc-950 px-16 py-6 rounded-full font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl hover:scale-110 active:scale-95 transition-all mt-12">Activar Club Elite</button>
                )}
              </div>
            </header>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-12 justify-center">
              {["Todos", ...CATEGORY_OPTIONS].map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-12 py-5 rounded-full font-black text-[10px] uppercase tracking-[0.3em] transition-all border-2 ${activeCategory === cat ? 'bg-zinc-950 text-white border-zinc-950 shadow-2xl scale-110' : 'bg-white text-zinc-400 border-zinc-50 hover:border-zinc-200'}`}>{cat}</button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 pb-48">
              {products.filter(p => activeCategory === "Todos" || p.category === activeCategory).map(p => (
                <ProductCard key={p.id} product={p} onAdd={addToCart} />
              ))}
            </div>
          </div>
        )}

        {view === "cart" && (
          <div className="grid lg:grid-cols-12 gap-20 animate-in slide-in-from-bottom-12 duration-1000">
            <div className="lg:col-span-8">
              <button onClick={() => setView("home")} className="flex items-center gap-3 mb-12 text-zinc-400 hover:text-black font-black text-xs uppercase tracking-widest transition-colors"><ArrowLeft size={20}/> Volver</button>
              <h2 className="text-7xl font-black italic uppercase tracking-tighter mb-16 border-l-[12px] border-emerald-50 pl-10">Tu Bolsa</h2>
              <div className="space-y-10">
                {cart.map(item => (
                  <div key={item.key} className="bg-white p-10 rounded-[65px] border border-zinc-50 shadow-xl flex gap-12 relative hover:shadow-2xl transition-all">
                    <img src={item.image} className="w-36 h-48 object-cover rounded-[35px] bg-zinc-50 shadow-md border-4 border-white" />
                    <div className="flex-1 py-3 flex flex-col justify-between">
                      <h3 className="font-black text-3xl uppercase leading-none tracking-tighter">{item.name}</h3>
                      <div className="flex gap-3">
                         <span className="bg-zinc-50 px-4 py-2 rounded-2xl text-[10px] font-black text-zinc-400 border uppercase">Talla: {item.size}</span>
                      </div>
                      <div className="flex justify-between items-end mt-4">
                        <p className="text-4xl font-black italic text-emerald-600 tracking-tighter">${(item.price * item.qty).toFixed(2)}</p>
                        <span className="text-xs font-black text-zinc-300">CANT: {item.qty}</span>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(item.key)} className="absolute top-10 right-12 text-zinc-200 hover:text-red-500 transition-all"><X size={35} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 h-fit sticky top-32">
              <div className="bg-zinc-950 text-white p-12 rounded-[75px] shadow-2xl border border-white/5">
                <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-8">
                   <h3 className="text-2xl font-black uppercase italic tracking-widest">Checkout</h3>
                   {isMember && <div className="bg-emerald-500 text-white px-5 py-2 rounded-full text-[9px] font-black uppercase shadow-lg">Miembro VIP</div>}
                </div>
                
                <div className="space-y-5 text-xs font-black uppercase tracking-widest text-zinc-400 mb-12">
                   <div className="flex justify-between text-white"><span>Subtotal</span><span>${totals.subtotal.toFixed(2)}</span></div>
                   {isMember && <div className="flex justify-between text-emerald-400"><span>VIP CLUB ({config.membershipDiscount}%)</span><span className="font-black text-emerald-400">-${totals.discount.toFixed(2)}</span></div>}
                   <div className="flex justify-between"><span>Impuestos ({config.taxPercent}%)</span><span>${totals.tax.toFixed(2)}</span></div>
                   <div className="flex justify-between text-5xl pt-10 border-t border-white/10 mt-8 font-black italic tracking-tighter text-white">
                      <span>Total</span><span className="text-emerald-500">${totals.total.toFixed(2)}</span>
                   </div>
                </div>

                <div className="space-y-5 mb-12">
                   <input className="w-full p-6 bg-white/5 border border-white/10 rounded-[30px] text-xs font-black outline-none focus:ring-4 focus:ring-emerald-500/20 uppercase text-white placeholder:text-zinc-600" placeholder="NOMBRE COMPLETO" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                   <input className="w-full p-6 bg-white/5 border border-white/10 rounded-[30px] text-xs font-black outline-none focus:ring-4 focus:ring-emerald-500/20 uppercase text-white placeholder:text-zinc-600" placeholder="WHATSAPP" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                   <textarea className="w-full p-6 bg-white/5 border border-white/10 rounded-[30px] text-xs font-black outline-none focus:ring-4 focus:ring-emerald-500/20 uppercase text-white placeholder:text-zinc-600" placeholder="DIRECCIÓN" rows={2} value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                </div>

                <button onClick={submitOrder} disabled={cart.length === 0 || isProcessing} className="w-full py-9 btn-emerald-premium rounded-full font-black uppercase text-xs tracking-[0.5em] shadow-2xl">¡Pagar y Finalizar!</button>
              </div>
            </div>
          </div>
        )}

        {view === "success" && currentOrder && <OrderReceipt order={currentOrder} config={config} onBack={() => { setView("home"); setCurrentOrder(null); setIsMember(false); }} user={user} />}
        {view === "track" && <TrackOrdersView setView={setView} user={user} config={config} />}
        {view === "admin" && <AdminPanel config={config} setConfig={setConfig} products={products} members={members} showAlert={showAlert} setView={setView} user={user} />}
      </main>

      {/* MODALES DE MEMBRESÍA PERSUASIVA */}
      {showJoinModal && (
        <div className="fixed inset-0 z-[2500] bg-zinc-950/90 backdrop-blur-3xl flex items-center justify-center p-6">
          <div className="bg-white p-16 rounded-[85px] max-w-lg w-full shadow-2xl relative border-8 border-zinc-50 animate-in zoom-in-95 duration-500">
            <button onClick={() => setShowJoinModal(false)} className="absolute top-10 right-12 text-zinc-300 hover:text-zinc-950 transition-colors"><X size={35}/></button>
            <div className="w-24 h-24 bg-emerald-500 rounded-[35px] flex items-center justify-center mx-auto mb-10 text-white rotate-6 shadow-2xl"><Zap size={45} className="fill-white"/></div>
            <h3 className="text-5xl font-black italic uppercase text-center mb-6 tracking-tighter">Activar VIP</h3>
            <form onSubmit={handleRegisterMember} className="space-y-6">
              <input name="m_name" placeholder="NOMBRE" className="w-full p-6 bg-zinc-50 rounded-[30px] font-black text-xs uppercase outline-none shadow-inner border-none" required />
              <input name="m_phone" placeholder="WHATSAPP" className="w-full p-6 bg-zinc-50 rounded-[30px] font-black text-xs outline-none shadow-inner border-none" required />
              <button type="submit" className="w-full py-8 btn-emerald-premium rounded-full font-black uppercase text-xs tracking-widest shadow-2xl">Unirme y Celebrar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}