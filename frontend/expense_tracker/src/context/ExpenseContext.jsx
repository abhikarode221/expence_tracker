import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  const [sharedExpenses, setSharedExpenses] = useState([]);
  const [currency, setCurrency] = useState('INR');

  /* =========================
     FETCH SHARED EXPENSES
  ========================= */
  const fetchSharedExpenses = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));

      if (!userInfo) return;

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/expenses/shared`,
        config
      );

      // 🟢 CORRECT: Replace entire list with fresh data
      setSharedExpenses(data);

      // ❌ Avoid this — causes duplicate UI entries
      // setSharedExpenses(prev => [...prev, ...data]);

    } catch (error) {
      console.error('Error fetching shared expenses:', error);
    }
  };

  /* =========================
     ADD EXPENSE
  ========================= */
  const addExpense = async (expenseData) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/expenses`,
        expenseData,
        config
      );

      // 🔄 Refresh shared expenses after adding
      await fetchSharedExpenses();

      return data;

    } catch (error) {
      console.error(
        'Error adding expense:',
        error.response?.data?.message || error.message
      );
      throw error;
    }
  };

  /* =========================
     INITIAL LOAD
  ========================= */
  useEffect(() => {
    fetchSharedExpenses();
  }, []);

  return (
    <ExpenseContext.Provider
      value={{
        sharedExpenses,
        currency,
        setCurrency,
        fetchSharedExpenses,
        addExpense,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};