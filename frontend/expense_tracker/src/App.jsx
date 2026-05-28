import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Ledger from './pages/Ledger';

function App() {
  // Use state for userInfo so the UI updates immediately after login
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('userInfo')));

  // Sync state if localStorage changes (e.g., after login/logout)
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(JSON.parse(localStorage.getItem('userInfo')));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-ui-bg text-text-primary font-sans relative">
        
        {/* Navbar only shows when a valid user/token exists */}
        {user && <Navbar />}

        <main className="max-w-7xl mx-auto px-4">
          <Routes>
            {/* 1. Public Landing Page */}
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
            
            {/* 2. Auth Pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* 3. Dashboard - THIS WAS MISSING */}
            <Route
              path="/dashboard"
              element={user ? <Dashboard /> : <Navigate to="/login" />}
            />

            {/* 4. Ledger */}
            <Route
              path="/ledger"
              element={user ? <Ledger /> : <Navigate to="/login" />}
            />

            {/* 5. Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* Glow background blobs */}
        <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-accent/10 rounded-full blur-[120px] -z-10"></div>
        <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-brand-success/5 rounded-full blur-[100px] -z-10"></div>
      </div>
    </Router>
  );
}

export default App;