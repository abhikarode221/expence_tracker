import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { ExpenseContext } from '../context/ExpenseContext';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight } from 'lucide-react';

const EmeraldNotification = () => {
  const [sharedTotal, setSharedTotal] = useState(0);
  const { currency } = useContext(ExpenseContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShared = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));

        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
        };

        const { data } = await axios.get(
          'http://localhost:5000/api/expenses/shared',
          config
        );

        // ✅ CLEAN merged logic (only unpaid splits counted)
        const total = data.reduce((acc, expense) => {
          const mySplit = expense.splits.find(
            (s) => s.user === userInfo._id
          );

          if (mySplit && !mySplit.isPaid) {
            return acc + mySplit.amount;
          }

          return acc;
        }, 0);

        setSharedTotal(total);

      } catch (error) {
        console.error("Failed to fetch shared expenses", error);
      }
    };

    fetchShared();
  }, []);

  if (sharedTotal === 0) return null;

  return (
    <button
      onClick={() => navigate('/ledger')}
      className="w-full mb-6 text-left animate-in fade-in slide-in-from-top-4 duration-500 group"
    >
      <div className="bg-brand-success/10 border border-brand-success/20 p-4 rounded-2xl flex items-center justify-between hover:bg-brand-success/20 transition-all">

        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="bg-brand-success/20 p-2 rounded-full text-brand-success">
            <Bell size={18} />
          </div>

          <div>
            <p className="text-brand-success text-sm font-bold">
              Pending Shared Expenses
            </p>
            <p className="text-text-secondary text-xs">
              Tap to view your shared splits in the Ledger.
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xl font-bold text-brand-success">
              {currency} {sharedTotal.toLocaleString()}
            </span>
          </div>

          <ChevronRight
            size={18}
            className="text-brand-success opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1"
          />
        </div>

      </div>
    </button>
  );
};

export default EmeraldNotification;