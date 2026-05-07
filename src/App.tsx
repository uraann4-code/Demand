import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, FileDown, School, User, Calendar, Briefcase, Loader2, LogIn, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PurchaseItem, FormData } from './types';
import { generatePurchaseFormPDF } from './services/pdfService';
import { getSuggestions, saveFormAndIndexItems } from './services/dbService';
import { auth } from './firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { debounce } from 'lodash';

// Simple Autocomplete Component
interface SuggestionInputProps {
  value: string;
  onChange: (val: string) => void;
  type: 'product' | 'justification';
  placeholder: string;
  className?: string;
}

const SuggestionInput = ({ value, onChange, type, placeholder, className }: SuggestionInputProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useRef(
    debounce(async (term: string) => {
      setLoading(true);
      try {
        const res = await getSuggestions(type, term);
        setSuggestions(res);
      } catch (err) {
        console.error("Suggestion fetch error:", err);
      } finally {
        setLoading(false);
      }
    }, 300)
  ).current;

  useEffect(() => {
    if (value.length >= 2 && show) {
      fetchSuggestions(value);
    } else {
      setSuggestions([]);
    }
  }, [value, show]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        type="text"
        value={value}
        onFocus={() => setShow(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setShow(true);
        }}
        placeholder={placeholder}
        className={className}
      />
      <AnimatePresence>
        {show && (suggestions.length > 0 || loading) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto"
          >
            {loading && (
              <div className="p-3 flex items-center justify-center text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-xs font-semibold uppercase tracking-widest">Searching records...</span>
              </div>
            )}
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onChange(s);
                  setShow(false);
                }}
                className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0"
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    dated: new Date().toISOString().split('T')[0],
    approverTitle: 'DIRECTOR CAMPUS'
  });

  const [items, setItems] = useState<PurchaseItem[]>([
    {
      id: crypto.randomUUID(),
      srNo: '1',
      description: '',
      qty: '',
      justification: ''
    }
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleFormDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (id: string, field: keyof PurchaseItem, value: string) => {
    setItems(prevItems =>
      prevItems.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => {
    setItems(prevItems => [
      ...prevItems,
      {
        id: crypto.randomUUID(),
        srNo: (prevItems.length + 1).toString(),
        description: '',
        qty: '',
        justification: ''
      }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(prevItems => {
      const filtered = prevItems.filter(item => item.id !== id);
      return filtered.map((item, index) => ({ ...item, srNo: (index + 1).toString() }));
    });
  };

  const handleDownloadPDF = async () => {
    if (!currentUser) {
      // If not logged in, we can't save suggestions, but let's allow PDF generation
      generatePurchaseFormPDF(formData, items);
      return;
    }

    setIsSaving(true);
    try {
      await saveFormAndIndexItems(formData, items);
      generatePurchaseFormPDF(formData, items);
    } catch (err) {
      console.error("Failed to save and generate:", err);
      generatePurchaseFormPDF(formData, items);
    } finally {
      setIsSaving(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-blue-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-900 border-t-8 border-blue-950">
      <div className="max-w-5xl mx-auto">
        {/* Auth Bar */}
        <div className="flex justify-end mb-6">
          {currentUser ? (
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Logged in as {currentUser.displayName?.split(' ')[0]}</span>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Login for Suggestions</span>
            </button>
          )}
        </div>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 space-y-4"
        >
          <div className="inline-flex items-center justify-center p-5 bg-blue-950 rounded-2xl shadow-xl mb-2 text-white">
            <School className="w-12 h-10" />
          </div>
          <div className="space-y-1 text-center">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bahria University Islamabad Campus</h1>
            <p className="text-xl font-semibold text-blue-900 uppercase tracking-[0.2em] border-b-2 border-blue-900 inline-block pb-1">
              Purchase Approval Form
            </p>
          </div>
        </motion.div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center sm:text-left text-left">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 group hover:ring-2 hover:ring-blue-500/10 transition-all text-left"
          >
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest text-left">Demand Raised By</p>
              <p className="text-lg font-black text-blue-950 font-serif italic tracking-wide text-left">Samina khan</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group hover:ring-2 hover:ring-blue-500/10 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Form Date</p>
                <input
                  type="date"
                  name="dated"
                  value={formData.dated}
                  onChange={handleFormDataChange}
                  className="w-full bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
                />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group hover:ring-2 hover:ring-blue-500/10 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Final Approver</p>
                <select
                  name="approverTitle"
                  value={formData.approverTitle}
                  onChange={handleFormDataChange}
                  className="w-full bg-transparent font-bold text-slate-900 outline-none appearance-none cursor-pointer"
                >
                  <option value="DIRECTOR CAMPUS">DIRECTOR CAMPUS</option>
                  <option value="DIRECTOR ADMIN">DIRECTOR ADMIN</option>
                  <option value="REGISTRAR">REGISTRAR</option>
                </select>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Items Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
        >
          <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white">
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg border border-blue-400/30 text-white">
                <Plus className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-bold tracking-tight text-white">Product Entry</h2>
                <p className="text-xs text-blue-200/60 font-semibold uppercase tracking-widest">
                  {currentUser ? "Database suggestions enabled" : "Login to enable suggestions"}
                </p>
              </div>
            </div>
            <button
              onClick={addItem}
              className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg active:scale-95 font-bold border-b-4 border-blue-800"
            >
              <Plus className="w-5 h-5" />
              <span>Add Another Item</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-6 font-black border-b border-slate-100 w-20 text-center">#</th>
                  <th className="px-8 py-6 font-black border-b border-slate-100 text-left">Item Description</th>
                  <th className="px-8 py-6 font-black border-b border-slate-100 w-32 text-center">Quantity</th>
                  <th className="px-8 py-6 font-black border-b border-slate-100 text-left">Justification</th>
                  <th className="px-8 py-6 font-black border-b border-slate-100 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                <AnimatePresence mode='popLayout'>
                  {items.map((item) => (
                    <motion.tr 
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      layout
                      className="group transition-colors hover:bg-blue-50/20"
                    >
                      <td className="px-8 py-10 text-slate-300 font-black text-center text-xl">{item.srNo}</td>
                      <td className="px-8 py-10">
                        <SuggestionInput
                          type="product"
                          value={item.description}
                          onChange={(val) => handleItemChange(item.id, 'description', val)}
                          placeholder="Search or enter product name..."
                          className="w-full bg-slate-50/50 border-2 border-slate-100 px-4 py-3 rounded-xl focus:border-blue-600 focus:bg-white outline-none transition-all text-base font-semibold placeholder:text-slate-300 shadow-sm"
                        />
                      </td>
                      <td className="px-8 py-10">
                        <input
                          type="text"
                          value={item.qty}
                          onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                          placeholder="01"
                          className="w-full bg-slate-50/50 border-2 border-slate-100 px-4 py-3 rounded-xl focus:border-blue-600 focus:bg-white outline-none transition-all text-base font-bold placeholder:text-slate-300 text-center shadow-sm"
                        />
                      </td>
                      <td className="px-8 py-10">
                        <SuggestionInput
                          type="justification"
                          value={item.justification}
                          onChange={(val) => handleItemChange(item.id, 'justification', val)}
                          placeholder="Reason for purchase..."
                          className="w-full bg-slate-50/50 border-2 border-slate-100 px-4 py-3 rounded-xl focus:border-blue-600 focus:bg-white outline-none transition-all text-base font-semibold placeholder:text-slate-300 shadow-sm"
                        />
                      </td>
                      <td className="px-8 py-10 text-right">
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="text-slate-200 hover:text-red-500 disabled:opacity-0 disabled:pointer-events-none transition-all p-3 rounded-xl hover:bg-red-50"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          <div className="p-12 border-t-2 border-slate-100 flex flex-col items-center gap-6 bg-slate-50/50">
             <button
              onClick={handleDownloadPDF}
              disabled={isSaving}
              className="group relative flex items-center gap-5 px-20 py-7 bg-blue-700 text-white font-black text-2xl rounded-[2rem] hover:bg-blue-800 transition-all shadow-2xl hover:shadow-blue-600/40 active:scale-95 overflow-hidden disabled:bg-slate-400 disabled:shadow-none border-b-8 border-blue-900"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span>PREPARING...</span>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  <FileDown className="w-8 h-8" />
                  <span>GENERATE & PRINT</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">
              Authorized Standard Layout 2026
            </p>
          </div>
        </motion.div>
      </div>

      <footer className="mt-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] space-y-2 pb-16 opacity-60">
        <p>Bahria University Islamabad Campus</p>
        <p>Purchase approval system</p>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
