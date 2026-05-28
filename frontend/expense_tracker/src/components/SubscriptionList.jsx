import React from 'react';
import { Repeat, Trash2, Calendar } from 'lucide-react';

const SubscriptionList = ({ subscriptions, onDelete, currency }) => {
  if (subscriptions.length === 0) {
    return (
      <div className="glass-card p-12 text-center text-text-muted italic">
        No active subscriptions. Add your first recurring bill!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {subscriptions.map((sub) => (
        <div key={sub._id} className="glass-card p-6 flex items-center justify-between group hover:border-brand-accent/40 transition-all">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
              <Repeat size={20} />
            </div>
            <div>
              <h4 className="font-bold text-text-primary text-lg">{sub.name}</h4>
              <p className="flex items-center gap-1.5 text-xs font-bold text-text-muted uppercase tracking-wider">
                <Calendar size={12} /> Every month on the {sub.billingDate}th
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="block text-xl font-black text-brand-accent">
                {currency} {sub.amount.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">
                Auto-Tracking Active
              </span>
            </div>
            <button 
              onClick={() => onDelete(sub._id)}
              className="p-3 rounded-xl bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SubscriptionList;