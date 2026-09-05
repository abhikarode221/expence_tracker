import { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import EmeraldNotification from '../components/EmeraldNotification';
import AddExpenseModal from '../components/AddExpenseModal';
import SpendingChart from '../components/SpendingChart';
import BudgetModal from '../components/BudgetModal';

import { ExpenseContext } from '../context/ExpenseContext';
import { Plus, Settings, Calendar, TrendingUp, TrendingDown, History, ChevronDown } from 'lucide-react';

// Helper functions for month parsing and formatting
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { currency } = useContext(ExpenseContext) || { currency: 'INR' };

  // ================= SAFE USER =================
  const getUserInfo = () => {
    try {
      const stored = localStorage.getItem('userInfo');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const userInfo = getUserInfo();

  // ================= STATE =================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  const [allExpenses, setAllExpenses] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('current'); // 'current', 'all', or 'YYYY-MM'
  
  const [summary, setSummary] = useState({
    peopleOweMe: 0,
    iOwe: 0
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [monthlyBudget, setMonthlyBudget] = useState(
    userInfo?.monthlyBudget || 5000
  );

  // Current and last month date keys
  const now = new Date();
  const currentMonthKey = getMonthKey(now);
  const currentMonthLabel = getMonthLabel(currentMonthKey);

  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = getMonthKey(lastMonthDate);
  const lastMonthLabel = getMonthLabel(lastMonthKey);

  // ================= ROUTE PROTECTION =================
  useEffect(() => {
    if (!userInfo?.token) {
      navigate('/login');
    }
  }, [userInfo, navigate]);

  // ================= FETCH ALL MY EXPENSES =================
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        if (!userInfo?.token) return;

        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        };

        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/expenses/my-expenses`,
          config
        );

        setAllExpenses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch Expenses Error:", err);
      }
    };
    fetchExpenses();
  }, [refreshTrigger, userInfo?.token]);

  // ================= FETCH DEBT SUMMARY =================
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        if (!userInfo?.token) return;

        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        };

        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/expenses/debt-summary`,
          config
        );

        setSummary(data || { peopleOweMe: 0, iOwe: 0 });
      } catch (err) {
        console.error("Fetch Debt Summary Error:", err);
      }
    };

    fetchSummary();
  }, [refreshTrigger, userInfo?.token]);

  // ================= MONTH-TO-MONTH COMPUTATIONS =================
  
  // Available month keys for dropdown
  const availableMonthKeys = useMemo(() => {
    const set = new Set();
    allExpenses.forEach(exp => {
      const key = getMonthKey(exp.date || exp.createdAt);
      if (key) set.add(key);
    });
    set.add(currentMonthKey);
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [allExpenses, currentMonthKey]);

  // Filtered expenses based on month selection
  const filteredExpenses = useMemo(() => {
    return allExpenses.filter(exp => {
      const expKey = getMonthKey(exp.date || exp.createdAt);
      if (selectedMonth === 'current') return expKey === currentMonthKey;
      if (selectedMonth === 'all') return true;
      return expKey === selectedMonth;
    });
  }, [allExpenses, selectedMonth, currentMonthKey]);

  // Current Month Spend
  const currentMonthTotal = useMemo(() => {
    return allExpenses
      .filter(exp => getMonthKey(exp.date || exp.createdAt) === currentMonthKey)
      .reduce((sum, exp) => sum + (Number(exp.totalAmount) || 0), 0);
  }, [allExpenses, currentMonthKey]);

  // Last Month Spend
  const lastMonthTotal = useMemo(() => {
    return allExpenses
      .filter(exp => getMonthKey(exp.date || exp.createdAt) === lastMonthKey)
      .reduce((sum, exp) => sum + (Number(exp.totalAmount) || 0), 0);
  }, [allExpenses, lastMonthKey]);

  // Total spent in selected period
  const totalSpent = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + (Number(exp.totalAmount) || 0), 0);
  }, [filteredExpenses]);

  // Category Breakdown Chart Data for Selected Month
  const chartData = useMemo(() => {
    const totals = {};
    filteredExpenses.forEach(exp => {
      const cat = exp.category || 'Others';
      totals[cat] = (totals[cat] || 0) + (Number(exp.totalAmount) || 0);
    });
    return Object.keys(totals).map(cat => ({
      name: cat,
      value: totals[cat]
    }));
  }, [filteredExpenses]);

  // Month-to-Month Trend %
  const monthDiff = currentMonthTotal - lastMonthTotal;
  const monthPercentageChange = lastMonthTotal > 0
    ? ((monthDiff / lastMonthTotal) * 100).toFixed(1)
    : null;

  // Early return after all Hooks run unconditionally
  if (!userInfo) return null;

  // ================= BUDGET CALC =================
  const budgetPercentage =
    monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;

  let budgetColorClass = 'text-text-primary';
  let budgetBorderClass = 'hover:border-brand-accent/30';
  let budgetStatusText = `${Math.round(budgetPercentage)}% of monthly budget used`;

  if (budgetPercentage >= 100) {
    budgetColorClass = 'text-rose-500';
    budgetBorderClass = 'border-rose-500/50';
    budgetStatusText = 'Budget Exceeded!';
  } else if (budgetPercentage >= 80) {
    budgetColorClass = 'text-orange-500';
    budgetBorderClass = 'border-orange-500/50';
    budgetStatusText = 'Approaching budget limit';
  }

  // ================= CALLBACK =================
  const handleExpenseAdded = () => {
    setIsModalOpen(false);
    setRefreshTrigger((p) => p + 1);
  };

  // ================= UI =================
  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto py-10 px-4">

        {/* HEADER & MONTH SELECTOR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-text-primary">
              Dashboard
            </h1>
            <p className="text-text-secondary mt-2">
              Track your month-to-month spending and budget limits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* MONTH-TO-MONTH SWITCHER */}
            <div className="relative flex-1 md:flex-none md:w-60">
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
                  🗓️ All-Time Overview
                </option>
                {availableMonthKeys.length > 1 && (
                  <optgroup label="Month-to-Month History" className="bg-ui-card text-text-muted font-bold">
                    {availableMonthKeys
                      .filter(m => m !== currentMonthKey)
                      .map(mKey => (
                        <option key={mKey} value={mKey} className="bg-ui-card font-medium text-text-primary">
                          📜 {getMonthLabel(mKey)}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-brand-accent text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-brand-accent/90 shadow-md shadow-brand-accent/20"
            >
              <Plus size={18} />
              New Expense
            </button>
          </div>
        </div>

        <EmeraldNotification />

        {/* MONTHLY STATUS BAR */}
        <div className="glass-card px-6 py-4 mb-8 flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-brand-accent">
          <div className="flex items-center gap-2">
            <History size={18} className="text-brand-accent" />
            <span className="font-bold text-text-primary text-sm">
              {selectedMonth === 'current'
                ? `Showing Spending for ${currentMonthLabel}`
                : selectedMonth === 'all'
                ? 'Showing All-Time Spending'
                : `Showing Spending for ${getMonthLabel(selectedMonth)}`}
            </span>
            {selectedMonth !== 'current' && (
              <button
                onClick={() => setSelectedMonth('current')}
                className="ml-2 text-xs font-bold text-brand-accent hover:underline cursor-pointer"
              >
                ← Reset to Current Month
              </button>
            )}
          </div>

          {/* Month-to-Month Comparison Badge */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="text-text-muted">Month-to-Month Trend:</span>
            {monthPercentageChange !== null ? (
              <span className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold ${
                monthDiff > 0 ? 'bg-rose-500/15 text-rose-500' : 'bg-emerald-500/15 text-emerald-500'
              }`}>
                {monthDiff > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(monthPercentageChange)}% vs {lastMonthLabel} ({currency} {lastMonthTotal.toLocaleString()})
              </span>
            ) : (
              <span className="text-text-secondary bg-ui-input px-2.5 py-1 rounded-lg">
                Last month: {currency} {lastMonthTotal.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* ================= STATS GRID ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">

          {/* TOTAL SPENT + BUDGET */}
          <div className={`glass-card p-8 relative ${budgetBorderClass} transition-all`}>
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="absolute top-4 right-4 p-2 text-text-muted hover:text-brand-accent rounded-lg transition-colors cursor-pointer"
              title="Set Monthly Budget"
            >
              <Settings size={16} />
            </button>

            <p className="text-xs uppercase text-text-muted font-bold tracking-wider">
              {selectedMonth === 'current'
                ? 'Current Month Spend'
                : selectedMonth === 'all'
                ? 'All-Time Total Spend'
                : `${getMonthLabel(selectedMonth)} Spend`}
            </p>

            <h2 className={`text-3xl font-bold mt-1 ${budgetColorClass}`}>
              {currency} {totalSpent.toLocaleString()}
            </h2>

            <div className="w-full bg-ui-input h-2 mt-4 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  budgetPercentage >= 100
                    ? 'bg-rose-500'
                    : budgetPercentage >= 80
                    ? 'bg-orange-500'
                    : 'bg-brand-accent'
                }`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center mt-2">
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                {budgetStatusText}
              </p>
              <p className="text-[10px] text-text-muted font-bold">
                Limit: {currency} {monthlyBudget.toLocaleString()}
              </p>
            </div>
          </div>

          {/* PEOPLE OWE ME */}
          <div className="glass-card p-8">
            <p className="text-xs uppercase text-text-muted font-bold tracking-wider">
              People Owe Me
            </p>
            <h2 className="text-3xl font-bold text-indigo-500 mt-1">
              {currency} {summary.peopleOweMe.toLocaleString()}
            </h2>
            <p className="text-[10px] mt-4 text-text-muted font-bold uppercase tracking-wider">
              Pending Split Payments
            </p>
          </div>

          {/* I OWE */}
          <div className="glass-card p-8">
            <p className="text-xs uppercase text-text-muted font-bold tracking-wider">
              I Owe
            </p>
            <h2 className="text-3xl font-bold text-rose-500 mt-1">
              {currency} {summary.iOwe.toLocaleString()}
            </h2>
            <p className="text-[10px] mt-4 text-text-muted font-bold uppercase tracking-wider">
              Your Unsettled Shares
            </p>
          </div>
        </div>

        {/* ================= CHART & MONTH COMPARISON ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">

          {/* SPENDING ANALYSIS CHART */}
          <div className="lg:col-span-2 glass-card p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-text-primary">
                Category Spending Analysis
              </h3>
              <span className="text-xs font-semibold text-text-muted bg-ui-input px-3 py-1 rounded-full">
                {selectedMonth === 'current'
                  ? currentMonthLabel
                  : selectedMonth === 'all'
                  ? 'All Time'
                  : getMonthLabel(selectedMonth)}
              </span>
            </div>

            {chartData.length > 0 ? (
              <SpendingChart data={chartData} />
            ) : (
              <div className="h-[250px] flex items-center justify-center text-text-muted text-sm italic">
                No expenses recorded for this month period yet.
              </div>
            )}
          </div>

          {/* NET BALANCE & MONTH-TO-MONTH SUMMARY */}
          <div className="glass-card p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase text-text-muted font-bold tracking-wider">
                Net Settlement Balance
              </p>

              <h2
                className={`text-3xl font-bold mt-1 ${
                  summary.peopleOweMe - summary.iOwe >= 0
                    ? 'text-emerald-500'
                    : 'text-rose-500'
                }`}
              >
                {currency}{' '}
                {(summary.peopleOweMe - summary.iOwe).toLocaleString()}
              </h2>
              <p className="text-xs text-text-muted mt-1">
                {summary.peopleOweMe - summary.iOwe >= 0
                  ? 'You are in net surplus'
                  : 'You have net pending debts'}
              </p>
            </div>

            {/* MONTH-TO-MONTH QUICK COMPARISON BOX */}
            <div className="mt-8 border-t border-ui-border/60 pt-6">
              <h4 className="text-xs uppercase text-text-muted font-bold tracking-wider mb-3">
                Month-to-Month Summary
              </h4>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary font-medium">
                    This Month ({currentMonthLabel})
                  </span>
                  <span className="font-bold text-text-primary">
                    {currency} {currentMonthTotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary font-medium">
                    Last Month ({lastMonthLabel})
                  </span>
                  <span className="font-bold text-text-primary">
                    {currency} {lastMonthTotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-2 border-t border-ui-border/40">
                  <span className="text-text-muted font-semibold">Difference</span>
                  <span className={`font-bold ${monthDiff > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {monthDiff > 0 ? '+' : ''}{currency} {monthDiff.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= MODALS ================= */}
        <AddExpenseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleExpenseAdded}
        />

        <BudgetModal
          isOpen={isBudgetModalOpen}
          onClose={() => setIsBudgetModalOpen(false)}
          currentBudget={monthlyBudget}
          onBudgetUpdate={setMonthlyBudget}
        />

      </main>
    </div>
  );
};

export default Dashboard;