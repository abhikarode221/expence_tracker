import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import EmeraldNotification from '../components/EmeraldNotification';
import AddExpenseModal from '../components/AddExpenseModal';
import SpendingChart from '../components/SpendingChart';
import BudgetModal from '../components/BudgetModal';

import { ExpenseContext } from '../context/ExpenseContext';
import { Plus, Settings } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currency } = useContext(ExpenseContext);

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

  const [totalSpent, setTotalSpent] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState({
    peopleOweMe: 0,
    iOwe: 0
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [monthlyBudget, setMonthlyBudget] = useState(
    userInfo?.monthlyBudget || 5000
  );

  // ================= ROUTE PROTECTION =================
  useEffect(() => {
    if (!userInfo?.token) {
      navigate('/login');
    }
  }, [userInfo, navigate]);

  // ================= FETCH TOTAL SPENT =================
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        if (!userInfo?.token) return;

        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        };

        const { data } = await axios.get(
          'http://localhost:5000/api/expenses/my-expenses',
          config
        );

        const total = data.reduce(
          (acc, curr) => acc + (curr.totalAmount || 0),
          0
        );

        setTotalSpent(total);
      } catch (err) {
        console.error(err);
      }
    };
    fetchExpenses();
  }, [refreshTrigger, userInfo?.token]);

  // ================= FETCH SUMMARY =================
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        if (!userInfo?.token) return;

        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        };

        const { data } = await axios.get(
          'http://localhost:5000/api/expenses/debt-summary',
          config
        );

        setSummary(data || { peopleOweMe: 0, iOwe: 0 });
      } catch (err) {
        console.error(err);
      }
    };

    fetchSummary();
  }, [refreshTrigger, userInfo?.token]);

  // ================= FETCH CHART =================
  useEffect(() => {
    const fetchChart = async () => {
      try {
        if (!userInfo?.token) return;

        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        };

        const { data } = await axios.get(
          'http://localhost:5000/api/expenses/category-stats',
          config
        );

        setChartData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchChart();
  }, [refreshTrigger, userInfo?.token]);

  // Early return after all Hooks run unconditionally
  if (!userInfo) return null;

  // ================= BUDGET CALC =================
  const budgetPercentage =
    monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;

  let budgetColorClass = 'text-text-primary';
  let budgetBorderClass = 'hover:border-brand-accent/30';
  let budgetStatusText = `${Math.round(budgetPercentage)}% of monthly budget`;

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

        {/* HEADER */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-bold text-text-primary">
              Dashboard
            </h1>
            <p className="text-text-secondary mt-2">
              Welcome back to your expenses.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-accent text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 cursor-pointer"
          >
            <Plus size={20} />
            New Expense
          </button>
        </div>

        <EmeraldNotification />

        {/* ================= STATS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">

          {/* TOTAL SPENT + BUDGET */}
          <div className={`glass-card p-8 relative ${budgetBorderClass}`}>
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="absolute top-4 right-4 text-text-muted hover:text-brand-accent cursor-pointer"
            >
              <Settings size={16} />
            </button>

            <p className="text-xs uppercase text-text-muted font-bold">
              Total Spent
            </p>

            <h2 className={`text-3xl font-bold ${budgetColorClass}`}>
              {currency} {totalSpent.toLocaleString()}
            </h2>

            <div className="w-full bg-ui-input h-1.5 mt-4 rounded-full">
              <div
                className={`h-full ${
                  budgetPercentage >= 100
                    ? 'bg-rose-500'
                    : budgetPercentage >= 80
                    ? 'bg-orange-500'
                    : 'bg-brand-accent'
                }`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              />
            </div>

            <p className="text-[10px] mt-2 text-text-muted font-bold uppercase">
              {budgetStatusText}
            </p>
          </div>

          {/* PEOPLE OWE ME */}
          <div className="glass-card p-8">
            <p className="text-xs uppercase text-text-muted font-bold">
              People Owe Me
            </p>
            <h2 className="text-3xl font-bold text-indigo-500">
              {currency} {summary.peopleOweMe.toLocaleString()}
            </h2>
          </div>

          {/* I OWE */}
          <div className="glass-card p-8">
            <p className="text-xs uppercase text-text-muted font-bold">
              I Owe
            </p>
            <h2 className="text-3xl font-bold text-rose-500">
              {currency} {summary.iOwe.toLocaleString()}
            </h2>
          </div>
        </div>

        {/* ================= CHART ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">

          <div className="lg:col-span-2 glass-card p-8">
            <h3 className="text-xl font-bold mb-6">
              Spending Analysis
            </h3>

            {chartData.length > 0 ? (
              <SpendingChart data={chartData} />
            ) : (
              <p className="text-text-muted">
                Add expenses to see chart
              </p>
            )}
          </div>

          <div className="glass-card p-8">
            <p className="text-xs uppercase text-text-muted font-bold">
              Net Balance
            </p>

            <h2
              className={`text-3xl font-bold ${
                summary.peopleOweMe - summary.iOwe >= 0
                  ? 'text-emerald-500'
                  : 'text-rose-500'
              }`}
            >
              {currency}{' '}
              {(summary.peopleOweMe - summary.iOwe).toLocaleString()}
            </h2>
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