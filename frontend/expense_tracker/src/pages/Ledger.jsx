import { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { Search, Trash2, User, CheckCircle2, Calendar, History, ChevronDown } from 'lucide-react';
import { ExpenseContext } from '../context/ExpenseContext';
import SubscriptionList from '../components/SubscriptionList';

// Helper functions for month key parsing and formatting
const getMonthKey = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getMonthLabel = (monthKey) => {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-');
  if (!year || !month) return '';
  const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const Ledger = () => {
  // 1. Initialize states with safe defaults
  const [activeTab, setActiveTab] = useState('shared');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('current'); // 'current', 'all', or 'YYYY-MM'
  const [subscriptions, setSubscriptions] = useState([]);
  const [personalExpenses, setPersonalExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Context
  const { sharedExpenses = [], fetchSharedExpenses, currency = "INR" } = useContext(ExpenseContext) || {};
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  // Compute Current Month Key & Label
  const now = new Date();
  const currentMonthKey = getMonthKey(now);
  const currentMonthLabel = getMonthLabel(currentMonthKey);

  // Handlers
  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/subscriptions`, config);
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch Subscriptions Error:", error);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteSubscription = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/subscriptions/${id}`, config);
      fetchSubscriptions();
    } catch (error) {
      console.error("Delete Subscription Error:", error);
    }
  };

  const fetchPersonalExpenses = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/expenses/my-expenses`, config);
      setPersonalExpenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch Personal Expenses Error:", error);
      setPersonalExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const deletePersonalExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/expenses/${id}`, config);
      if (activeTab === 'personal') {
        fetchPersonalExpenses();
      } else if (activeTab === 'shared') {
        fetchSharedExpenses?.();
      }
    } catch (error) {
      console.error("Delete Personal Expense Error:", error);
    }
  };

  const settleExpense = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/expenses/${id}/settle`, {}, config);
      fetchSharedExpenses?.();
    } catch (error) {
      console.error("Settle Expense Error:", error);
    }
  };

  // 2. Fetch initial data for all expense sources to populate history options
  useEffect(() => {
    fetchSharedExpenses?.();
    fetchPersonalExpenses();
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    if (activeTab === 'shared') {
      fetchSharedExpenses?.();
    } else if (activeTab === 'recurring') {
      fetchSubscriptions();
    } else if (activeTab === 'personal') {
      fetchPersonalExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Extract all unique past month keys from all available expenses (excluding current month)
  const pastMonthKeys = useMemo(() => {
    const allExpenses = [
      ...(Array.isArray(sharedExpenses) ? sharedExpenses : []),
      ...(Array.isArray(personalExpenses) ? personalExpenses : [])
    ];
    const monthKeysSet = new Set();
    allExpenses.forEach(exp => {
      const mKey = getMonthKey(exp.date || exp.createdAt);
      if (mKey && mKey !== currentMonthKey) {
        monthKeysSet.add(mKey);
      }
    });
    return Array.from(monthKeysSet).sort((a, b) => b.localeCompare(a));
  }, [sharedExpenses, personalExpenses, currentMonthKey]);

  // Generic Expense Filtering Pipeline (Search + Category + Month)
  const filterExpenses = (list) => {
    return (Array.isArray(list) ? list : [])
      .filter(exp => exp.description?.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(exp => filterCategory === 'All' || exp.category === filterCategory)
      .filter(exp => {
        const expMonthKey = getMonthKey(exp.date || exp.createdAt);
        if (selectedMonth === 'current') {
          return expMonthKey === currentMonthKey;
        }
        if (selectedMonth === 'all') {
          return true;
        }
        return expMonthKey === selectedMonth;
      });
  };

  const filteredSharedExpenses = filterExpenses(sharedExpenses);
  const filteredPersonalExpenses = filterExpenses(personalExpenses);

  // Compute total spent for the currently displayed filtered tab list
  const currentDisplayedExpenses = activeTab === 'shared' ? filteredSharedExpenses : filteredPersonalExpenses;
  const totalMonthSpent = useMemo(() => {
    return currentDisplayedExpenses.reduce((acc, exp) => acc + (Number(exp.totalAmount) || 0), 0);
  }, [currentDisplayedExpenses]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* TAB NAVIGATION */}
      <div className="flex gap-4 mb-8 bg-ui-input/30 p-1.5 rounded-2xl border border-ui-border">
        {['shared', 'personal', 'recurring'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 rounded-xl font-bold text-sm capitalize transition-all cursor-pointer ${
              activeTab === tab ? 'bg-brand-accent text-white' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* SEARCH, MONTH & CATEGORY FILTER BAR */}
      {activeTab !== 'recurring' && (
        <div className="space-y-4 mb-6">
          <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input 
                className="w-full bg-ui-input border border-ui-border rounded-xl pl-12 pr-4 py-3 text-text-primary focus:outline-none focus:border-brand-accent transition-all placeholder:text-text-muted text-sm"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Month Dropdown / History Selector */}
            <div className="w-full md:w-64 relative">
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-accent" size={16} />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-ui-input border border-ui-border rounded-xl pl-10 pr-9 py-3 text-text-primary focus:outline-none focus:border-brand-accent transition-all text-sm font-semibold cursor-pointer appearance-none"
                >
                  <option value="current" className="bg-ui-card font-medium text-text-primary">
                    📅 Current Month ({currentMonthLabel})
                  </option>
                  <option value="all" className="bg-ui-card font-medium text-text-primary">
                    🗓️ All Time History
                  </option>
                  {pastMonthKeys.length > 0 && (
                    <optgroup label="Older Months History" className="bg-ui-card text-text-muted font-bold">
                      {pastMonthKeys.map((mKey) => (
                        <option key={mKey} value={mKey} className="bg-ui-card font-medium text-text-primary">
                          📜 {getMonthLabel(mKey)}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="w-full md:w-44">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-ui-input border border-ui-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-brand-accent transition-all text-sm cursor-pointer"
              >
                {['All', 'Food', 'Transport', 'Rent', 'Shopping', 'Entertainment', 'Bills', 'Others'].map(cat => (
                  <option key={cat} value={cat} className="bg-ui-card">{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* MONTHLY SUMMARY HEADER */}
          <div className="glass-card px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs border-l-4 border-l-brand-accent">
            <div className="flex items-center gap-2 flex-wrap">
              <History size={16} className="text-brand-accent" />
              <span className="font-bold text-text-primary text-sm">
                {selectedMonth === 'current'
                  ? `Current Month (${currentMonthLabel})`
                  : selectedMonth === 'all'
                  ? 'All-Time Expense History'
                  : `History for ${getMonthLabel(selectedMonth)}`}
              </span>
              {selectedMonth !== 'current' && (
                <button
                  onClick={() => setSelectedMonth('current')}
                  className="ml-2 text-[11px] font-bold text-brand-accent hover:underline cursor-pointer"
                >
                  ← Back to Current Month
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 text-text-muted font-medium">
              <span>
                Transactions: <strong className="text-text-primary font-bold">{currentDisplayedExpenses.length}</strong>
              </span>
              <span>•</span>
              <span>
                Total Amount: <strong className="text-brand-accent font-bold">{currency} {totalMonthSpent.toLocaleString()}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT AREA */}
      <div className="mt-6">
        {loading && (
          <div className="text-center p-20 text-text-muted">Loading...</div>
        )}

        {!loading && activeTab === 'shared' && (
          <div className="space-y-4">
            {filteredSharedExpenses.length > 0 ? (
              filteredSharedExpenses.map(exp => {
                // Find current user's split status
                const mySplit = exp.splits?.find(s => 
                  (s.user && (s.user._id === userInfo?._id || s.user === userInfo?._id)) ||
                  (s.email && s.email.toLowerCase() === userInfo?.email?.toLowerCase())
                );
                
                return (
                  <div key={exp._id} className="glass-card p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-brand-accent/30 transition-all">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-accent/15 text-brand-accent uppercase">Shared</span>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{exp.category}</span>
                      </div>
                      <h4 className="font-bold text-lg text-text-primary mb-1">{exp.description}</h4>
                      <p className="text-xs text-text-muted flex items-center gap-1.5">
                        <User size={12} /> Created by <span className="text-text-secondary font-medium">{exp.creator?.name || 'Someone'}</span> ({exp.creator?.email})
                      </p>
                      {(exp.date || exp.createdAt) && (
                        <p className="text-[10px] text-text-muted mt-1">
                          {new Date(exp.date || exp.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-ui-border/50 pt-4 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <span className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-0.5">Total: {currency} {exp.totalAmount}</span>
                        {mySplit && (
                          <span className="block font-black text-xl text-brand-accent">
                            Your share: {currency} {mySplit.amount}
                          </span>
                        )}
                      </div>

                      {mySplit && (
                        <div>
                          {mySplit.isPaid ? (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-success/15 text-brand-success font-bold text-xs uppercase">
                              <CheckCircle2 size={14} /> Settled
                            </span>
                          ) : (
                            <button
                              onClick={() => settleExpense(exp._id)}
                              className="px-4 py-2 bg-brand-accent hover:bg-brand-accent/80 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-accent/15 flex items-center gap-1 cursor-pointer"
                            >
                              Settle Split
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 px-4 glass-card rounded-2xl border border-dashed border-ui-border">
                <Calendar size={36} className="mx-auto text-text-muted mb-2 opacity-50" />
                <h3 className="font-bold text-text-primary text-base mb-1">No shared transactions found</h3>
                <p className="text-xs text-text-muted max-w-sm mx-auto mb-4">
                  {selectedMonth === 'current' 
                    ? 'No shared expenses recorded for this month yet.' 
                    : selectedMonth === 'all'
                    ? 'No shared expenses found matching your filter.'
                    : `No shared transactions recorded in ${getMonthLabel(selectedMonth)}.`}
                </p>
                {selectedMonth !== 'current' && (
                  <button
                    onClick={() => setSelectedMonth('current')}
                    className="px-4 py-2 bg-brand-accent/15 text-brand-accent rounded-xl text-xs font-bold hover:bg-brand-accent/25 transition-all cursor-pointer"
                  >
                    View Current Month
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'personal' && (
          <div className="space-y-4">
            {filteredPersonalExpenses.length > 0 ? (
              filteredPersonalExpenses.map(exp => {
                const isSplit = exp.splits && exp.splits.length > 0;
                
                return (
                  <div key={exp._id} className="glass-card p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-brand-accent/30 transition-all group">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          isSplit ? 'bg-indigo-500/15 text-indigo-400' : 'bg-brand-success/15 text-brand-success'
                        }`}>
                          {isSplit ? 'Split Out' : 'Personal'}
                        </span>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{exp.category}</span>
                      </div>
                      <h4 className="font-bold text-lg text-text-primary mb-1">{exp.description}</h4>
                      {isSplit ? (
                        <div className="space-y-1">
                          <p className="text-xs text-text-muted">
                            Split with: <span className="text-text-secondary font-medium">{exp.splits.map(s => s.email).join(', ')}</span>
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {exp.splits.map((s, idx) => (
                              <span key={idx} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                s.isPaid ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-negative/10 text-brand-negative'
                              }`}>
                                {s.email}: {s.isPaid ? 'Paid' : 'Unpaid'}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        exp.note && <p className="text-xs text-text-secondary italic">"{exp.note}"</p>
                      )}
                      {(exp.date || exp.createdAt) && (
                        <p className="text-[10px] text-text-muted mt-1">
                          {new Date(exp.date || exp.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-ui-border/50 pt-4 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <span className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-0.5">
                          {isSplit ? 'Total' : 'Amount'}
                        </span>
                        <span className="block font-black text-xl text-brand-accent">
                          {currency} {exp.totalAmount.toLocaleString()}
                        </span>
                      </div>

                      <button
                        onClick={() => deletePersonalExpense(exp._id)}
                        className="p-3 rounded-xl bg-rose-500/10 text-rose-500 md:opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white cursor-pointer"
                        title="Delete expense"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 px-4 glass-card rounded-2xl border border-dashed border-ui-border">
                <Calendar size={36} className="mx-auto text-text-muted mb-2 opacity-50" />
                <h3 className="font-bold text-text-primary text-base mb-1">No personal transactions found</h3>
                <p className="text-xs text-text-muted max-w-sm mx-auto mb-4">
                  {selectedMonth === 'current' 
                    ? 'No personal expenses recorded for this month yet.' 
                    : selectedMonth === 'all'
                    ? 'No personal expenses found matching your filter.'
                    : `No personal transactions recorded in ${getMonthLabel(selectedMonth)}.`}
                </p>
                {selectedMonth !== 'current' && (
                  <button
                    onClick={() => setSelectedMonth('current')}
                    className="px-4 py-2 bg-brand-accent/15 text-brand-accent rounded-xl text-xs font-bold hover:bg-brand-accent/25 transition-all cursor-pointer"
                  >
                    View Current Month
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'recurring' && (
          <SubscriptionList 
            subscriptions={subscriptions} 
            currency={currency} 
            onDelete={deleteSubscription} 
          />
        )}
      </div>
    </div>
  );
};

export default Ledger;