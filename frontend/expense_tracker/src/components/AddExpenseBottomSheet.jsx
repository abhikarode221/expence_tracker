import React, { useState } from 'react';
import { X, Calendar, Tag, FileText } from 'lucide-react';

const AddExpenseBottomSheet = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center p-0 sm:p-4">
      {/* Container - Slides up from bottom on mobile */}
      <div className="w-full max-w-lg bg-ui-card rounded-t-[32px] sm:rounded-3xl p-8 animate-in slide-in-from-bottom duration-300">
        
        {/* Mobile Drag Handle */}
        <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-ui-border sm:hidden"></div>

        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight">Add Entry</h2>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-rose-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form className="space-y-6">
          {/* Amount field - Large for easy thumb typing */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Amount</span>
            <input 
              type="number" 
              placeholder="0.00" 
              className="w-full bg-transparent text-center text-5xl font-black text-brand-accent focus:outline-none"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input type="date" className="w-full bg-ui-input border border-ui-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold" />
            </div>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <select className="w-full bg-ui-input border border-ui-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold appearance-none">
                <option>Food</option>
                <option>Rent</option>
                <option>Netflix</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <FileText className="absolute left-4 top-4 text-text-muted" size={18} />
            <textarea 
              placeholder="Add a note..." 
              className="w-full bg-ui-input border border-ui-border rounded-2xl pl-12 pr-4 py-4 text-sm font-medium h-24 focus:border-brand-accent transition-all outline-none"
            />
          </div>

          <button className="w-full bg-brand-accent hover:bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-95">
            Save Expense
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseBottomSheet;