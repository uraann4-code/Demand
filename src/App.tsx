import React, { useState } from 'react';
import { Plus, Trash2, FileDown, School, User, Calendar, DollarSign, Briefcase, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PurchaseItem, FormData } from './types';
import { generatePurchaseFormPDF } from './services/pdfService';
import { cn } from './lib/utils';

export default function App() {
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

  const handleDownloadPDF = () => {
    generatePurchaseFormPDF(formData, items);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 space-y-4"
        >
          <div className="inline-flex items-center justify-center p-5 bg-blue-950 rounded-2xl shadow-xl mb-2">
            <School className="w-12 h-10 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bahria University Islamabad Campus</h1>
            <p className="text-xl font-semibold text-blue-900 uppercase tracking-[0.2em] border-b-2 border-blue-900 inline-block pb-1">
              Purchase Approval Form
            </p>
          </div>
        </motion.div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4"
          >
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Demand Raised By</p>
              <p className="text-lg font-bold text-slate-900 font-serif italic text-blue-900">Samina khan</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Form Date</p>
                <input
                  type="date"
                  name="dated"
                  value={formData.dated}
                  onChange={handleFormDataChange}
                  className="w-full bg-transparent font-bold text-slate-900 outline-none"
                />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Final Approver</p>
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
          className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden"
        >
          <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-900 rounded-2xl shadow-lg">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Product Details</h2>
            </div>
            <button
              onClick={addItem}
              className="flex items-center gap-2 px-6 py-3 bg-blue-950 text-white rounded-xl hover:bg-blue-900 transition-all shadow-lg active:scale-95 font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span>Add Another Item</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-slate-100 text-slate-600 text-xs uppercase tracking-[0.1em]">
                <tr>
                  <th className="px-8 py-5 font-bold border-b border-slate-200 w-20">#</th>
                  <th className="px-8 py-5 font-bold border-b border-slate-200">Description / Product Name</th>
                  <th className="px-8 py-5 font-bold border-b border-slate-200 w-32">Qty</th>
                  <th className="px-8 py-5 font-bold border-b border-slate-200">Justification</th>
                  <th className="px-8 py-5 font-bold border-b border-slate-200 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence mode='popLayout'>
                  {items.map((item) => (
                    <motion.tr 
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      layout
                      className="group transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-8 py-6 text-slate-400 font-bold">{item.srNo}</td>
                      <td className="px-8 py-6">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          placeholder="e.g. Paper (A4 Size) Double 'A' (80 Grams)"
                          className="w-full bg-transparent border-b-2 border-slate-100 group-hover:border-blue-200 focus:border-blue-600 outline-none transition-all py-2 text-base font-medium placeholder:text-slate-300"
                        />
                      </td>
                      <td className="px-8 py-6">
                        <input
                          type="text"
                          value={item.qty}
                          onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                          placeholder="e.g. 50"
                          className="w-full bg-transparent border-b-2 border-slate-100 group-hover:border-blue-200 focus:border-blue-600 outline-none transition-all py-2 text-base font-medium placeholder:text-slate-300"
                        />
                      </td>
                      <td className="px-8 py-6">
                        <input
                          type="text"
                          value={item.justification}
                          onChange={(e) => handleItemChange(item.id, 'justification', e.target.value)}
                          placeholder="e.g. For Spring-2026 Final Exams"
                          className="w-full bg-transparent border-b-2 border-slate-100 group-hover:border-blue-200 focus:border-blue-600 outline-none transition-all py-2 text-base font-medium placeholder:text-slate-300"
                        />
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="text-slate-300 hover:text-red-500 disabled:opacity-0 disabled:pointer-events-none transition-all p-2 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          <div className="p-8 border-t border-slate-100 flex justify-center">
             <button
              onClick={handleDownloadPDF}
              className="group relative flex items-center gap-4 px-12 py-5 bg-blue-600 text-white font-extrabold text-lg rounded-2xl hover:bg-blue-700 transition-all shadow-2xl hover:shadow-blue-600/30 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <FileDown className="w-7 h-7" />
              <span>Download & Print PDF</span>
            </button>
          </div>
        </motion.div>
      </div>

      <footer className="mt-16 text-center text-slate-400 text-sm font-medium pb-8 border-t border-slate-200 max-w-xl mx-auto pt-8">
        Bahria University Islamabad Campus • Standard Purchase approval form
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}

