import React, { useState, useContext } from 'react';
import axios from 'axios';
import { ExpenseContext } from '../context/ExpenseContext';
import { X, UserPlus, Zap } from 'lucide-react';

const AddExpenseModal = ({ isOpen, onClose, onSuccess }) => {
  const { addExpense } = useContext(ExpenseContext);

  const [isSplit, setIsSplit] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Enhanced Form Data
  const [formData, setFormData] = useState({
    description: '',
    totalAmount: '',
    friendEmail: '',
    category: 'Food',

    // 🟢 New fields
    date: new Date().toISOString().split('T')[0],
    note: '',
    isRecurring: false
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const totalAmount = Number(formData.totalAmount);

      // ✅ Expense Payload
      const expenseData = {
        description: formData.description,
        totalAmount,
        category: formData.category,

        // 🟢 New fields
        date: formData.date,
        note: formData.note,
        isRecurring: formData.isRecurring,

        splits:
          isSplit && formData.friendEmail
            ? [
                {
                  email: formData.friendEmail,
                  amount: totalAmount / 2
                }
              ]
            : []
      };

      if (addExpense) {
        await addExpense(expenseData);
      }

      // ✅ Reset form
      setFormData({
        description: '',
        totalAmount: '',
        friendEmail: '',
        category: 'Food',
        date: new Date().toISOString().split('T')[0],
        note: '',
        isRecurring: false
      });

      setIsSplit(false);

      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }

    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">

      {/* MOBILE BOTTOM SHEET */}
      <div className="bg-ui-card w-full max-w-lg rounded-t-[32px] sm:rounded-2xl p-8 animate-slide-up relative">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-text-muted hover:text-white transition-all"
        >
          <X size={20} />
        </button>

        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-ui-border rounded-full mx-auto mb-6 sm:hidden"></div>

        {/* Header */}
        <h2 className="text-2xl font-black text-text-primary mb-2">
          New Entry
        </h2>

        <p className="text-text-muted text-sm mb-6">
          Add a personal or shared expense.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Amount */}
          <input
            type="number"
            required
            placeholder="0.00"
            value={formData.totalAmount}
            onChange={(e) =>
              setFormData({
                ...formData,
                totalAmount: e.target.value
              })
            }
            className="text-4xl font-bold bg-transparent border-none focus:ring-0 outline-none w-full text-text-primary placeholder:text-text-muted"
          />

          {/* Description */}
          <input
            type="text"
            required
            placeholder="What was it for?"
            value={formData.description}
            onChange={(e) =>
              setFormData({
                ...formData,
                description: e.target.value
              })
            }
            className="w-full bg-ui-input p-4 rounded-xl border border-ui-border text-text-primary outline-none focus:border-brand-accent"
          />

          {/* Date + Category */}
          <div className="grid grid-cols-2 gap-3">

            {/* Date */}
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  date: e.target.value
                })
              }
              className="bg-ui-input p-4 rounded-xl border border-ui-border text-text-primary outline-none focus:border-brand-accent"
            />

            {/* Category */}
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value
                })
              }
              className="bg-ui-input p-4 rounded-xl border border-ui-border text-text-primary outline-none focus:border-brand-accent"
            >
              {[
                'Food',
                'Transport',
                'Rent',
                'Shopping',
                'Entertainment',
                'Bills',
                'Others'
              ].map((cat) => (
                <option
                  key={cat}
                  value={cat}
                  className="bg-ui-card"
                >
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <textarea
            placeholder="Add a note..."
            value={formData.note}
            onChange={(e) =>
              setFormData({
                ...formData,
                note: e.target.value
              })
            }
            className="w-full bg-ui-input p-4 rounded-xl border border-ui-border h-24 text-text-primary outline-none focus:border-brand-accent resize-none"
          />

          {/* Recurring Toggle */}
          <div className="flex items-center justify-between p-4 bg-ui-input/50 border border-ui-border rounded-xl">

            <div>
              <p className="text-sm font-semibold text-text-primary">
                Recurring Expense
              </p>

              <p className="text-xs text-text-muted">
                Mark this as a monthly recurring payment
              </p>
            </div>

            <input
              type="checkbox"
              checked={formData.isRecurring}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  isRecurring: e.target.checked
                })
              }
              className="w-5 h-5 accent-brand-accent cursor-pointer"
            />
          </div>

          {/* Split Toggle */}
          <div className="flex items-center justify-between p-4 bg-ui-input/50 border border-ui-border rounded-xl">

            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-accent/10 rounded-lg text-brand-accent">
                <UserPlus size={18} />
              </div>

              <span className="text-sm font-semibold text-text-primary">
                Split with a friend?
              </span>
            </div>

            <input
              type="checkbox"
              className="w-5 h-5 accent-brand-accent cursor-pointer"
              checked={isSplit}
              onChange={(e) => setIsSplit(e.target.checked)}
            />
          </div>

          {/* Friend Email */}
          {isSplit && (
            <div className="animate-in fade-in slide-in-from-top-2">

              <label className="block text-xs font-bold text-text-muted uppercase mb-2">
                Friend's Email
              </label>

              <input
                type="email"
                required
                value={formData.friendEmail}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    friendEmail: e.target.value
                  })
                }
                className="w-full bg-ui-input border border-ui-border rounded-xl px-4 py-3 text-text-primary focus:border-brand-accent outline-none transition-all"
                placeholder="friend@email.com"
              />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-2
              ${
                loading
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-brand-accent hover:bg-indigo-700 text-white shadow-indigo-500/20'
              }`}
          >
            <Zap size={18} />

            {loading
              ? 'Processing...'
              : isSplit
              ? 'Create Split'
              : 'Add Expense'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;