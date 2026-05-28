import { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { ExpenseContext } from '../context/ExpenseContext';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  LogOut,
  Bell
} from 'lucide-react';

const Navbar = () => {
  const { currency, setCurrency } = useContext(ExpenseContext);
  const navigate = useNavigate();

  // ✅ Safe user parsing
  const userInfo = JSON.parse(
    localStorage.getItem('userInfo') || '{}'
  );

  // ✅ Notifications
  const [showNotifications, setShowNotifications] =
    useState(false);

  const [notifications, setNotifications] = useState([]);

  // ✅ Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!userInfo?.token) return;

        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
        };

        const { data } = await axios.get(
          'http://localhost:5000/api/notifications',
          config
        );

        setNotifications(Array.isArray(data) ? data : []);

      } catch (error) {
        console.error('Notification fetch error:', error);
      }
    };

    fetchNotifications();
  }, [userInfo?.token]);

  // ✅ MARK SINGLE NOTIFICATION AS READ
  const markAsRead = async (id) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      };

      await axios.put(
        `http://localhost:5000/api/notifications/${id}/read`,
        {},
        config
      );

      // Instant UI update
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id
            ? { ...n, isRead: true }
            : n
        )
      );

    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  // ✅ MARK ALL AS READ
  const markAllAsRead = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      };

      await axios.put(
        'http://localhost:5000/api/notifications/read-all',
        {},
        config
      );

      // Instant UI update
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true
        }))
      );

    } catch (error) {
      console.error('Read all error:', error);
    }
  };

  // ✅ Unread count
  const unreadCount = notifications.filter(
    (n) => !n.isRead
  ).length;

  // ✅ Logout
  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/auth');
    window.location.reload();
  };

  return (
    <nav className="glass-card mx-2 sm:mx-4 mt-4 flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4">

      {/* LOGO & NAVIGATION */}
      <div className="flex items-center gap-3 sm:gap-8">
        <div 
          onClick={() => navigate('/dashboard')}
          className="text-lg sm:text-xl font-bold tracking-tight text-brand-accent cursor-pointer"
        >
          SpendWise
        </div>
        
        {/* NAV LINKS */}
        <div className="flex items-center gap-3 sm:gap-6">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="text-xs sm:text-sm font-bold text-text-secondary hover:text-brand-accent transition-all cursor-pointer bg-transparent border-none"
          >
            Dashboard
          </button>
          <button 
            onClick={() => navigate('/ledger')} 
            className="text-xs sm:text-sm font-bold text-text-secondary hover:text-brand-accent transition-all cursor-pointer bg-transparent border-none"
          >
            Ledger
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-6">

        {/* CURRENCY SELECTOR */}
        <div className="flex items-center gap-1 sm:gap-2 rounded-full bg-ui-input px-2 sm:px-3 py-1 border border-ui-border">
          <Globe
            size={12}
            className="text-text-secondary sm:block hidden"
          />

          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-transparent text-[10px] sm:text-xs font-semibold text-text-primary outline-none cursor-pointer"
          >
            {['INR', 'USD', 'EUR', 'GBP'].map((curr) => (
              <option
                key={curr}
                value={curr}
                className="bg-ui-card"
              >
                {curr}
              </option>
            ))}
          </select>
        </div>

        {/* 🔔 NOTIFICATION BELL */}
        <div className="relative">
          <button
            onClick={() =>
              setShowNotifications(!showNotifications)
            }
            className="relative p-1.5 sm:p-2 rounded-lg hover:bg-ui-input transition-all cursor-pointer"
          >
            <Bell
              size={20}
              className="text-text-muted hover:text-brand-accent transition-colors"
            />

            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 bg-rose-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-ui-bg">
                {unreadCount}
              </span>
            )}
          </button>

          {/* DROPDOWN */}
          {showNotifications && (
            <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 mt-4 w-auto sm:w-80 glass-card p-4 shadow-2xl z-50 border border-brand-accent/20 rounded-2xl">

              {/* HEADER */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">
                  Notifications
                </h3>

                {notifications.length > 0 && unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-brand-accent hover:underline cursor-pointer bg-transparent border-none"
                  >
                    Read All
                  </button>
                )}
              </div>

              {/* NOTIFICATION LIST */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => markAsRead(n._id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer hover:border-brand-accent/40 ${
                        n.isRead
                          ? 'bg-transparent border-ui-border'
                          : 'bg-brand-accent/5 border-brand-accent/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-text-primary">
                            {n.title}
                          </p>

                          <p className="text-[11px] text-text-muted mt-1">
                            {n.message}
                          </p>
                        </div>

                        {!n.isRead && (
                          <div className="h-2 w-2 rounded-full bg-brand-accent mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-text-muted italic text-center py-4">
                    All caught up!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* USER SECTION */}
        <div className="flex items-center gap-2 sm:gap-4 border-l border-ui-border pl-2 sm:pl-4">

          {/* USER INFO CARD */}
          <div className="flex items-center gap-2 sm:gap-3 bg-ui-input/50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-ui-border">
            {/* Avatar */}
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-brand-accent/20 flex items-center justify-center text-brand-accent font-bold text-sm sm:text-base">
              {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            {/* Name + Email */}
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-sm font-bold text-text-primary">
                {userInfo?.name || 'Guest User'}
              </span>

              <span className="text-[10px] text-text-muted">
                {userInfo?.email || 'No email'}
              </span>
            </div>
          </div>

          {/* LOGOUT */}
          <button
            onClick={handleLogout}
            className="p-1.5 sm:p-2 text-text-muted hover:text-brand-negative hover:bg-brand-negative/10 rounded-lg transition-all cursor-pointer"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;