import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

const BudgetModal = ({ isOpen, onClose, currentBudget, onBudgetUpdate }) => {
  const [budget, setBudget] = useState(currentBudget || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      const { data } = await axios.put('http://localhost:5000/api/users/budget', { monthlyBudget: Number(budget) }, config);
      
      // Update local storage so the rest of the app knows the new budget
      localStorage.setItem('userInfo', JSON.stringify({ ...userInfo, monthlyBudget: data.monthlyBudget }));
      onBudgetUpdate(data.monthlyBudget);
      onClose();
    } catch (error) {
      alert("Error updating budget");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-ui-bg/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-ui-card border border-ui-border rounded-2xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-text-primary">Set Monthly Budget</h2>
          <button onClick={onClose} className="text-text-muted hover:text-rose-500"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="block text-xs font-bold text-text-muted uppercase mb-2">Budget Limit (INR)</label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full bg-ui-input border border-ui-border rounded-xl px-4 py-3 text-text-primary mb-6"
            required
          />
          <button type="submit" className="w-full bg-brand-accent hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-all">
            Save Budget
          </button>
        </form>
      </div>
    </div>
  );
};

export default BudgetModal;