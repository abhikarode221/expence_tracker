import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Lock, Loader2 } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/register`, { name, email, password });
      localStorage.setItem('userInfo', JSON.stringify(data));
      window.location.href = '/dashboard';
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ui-bg flex items-center justify-center p-6">
      <div className="glass-card w-full max-w-md p-8 relative overflow-hidden border-t-4 border-t-brand-accent">

        <div className="relative z-10">
          <h1 className="text-3xl font-black text-text-primary mb-2 tracking-tighter">Join Spendwise</h1>
          <p className="text-text-muted text-sm mb-8">Start tracking and splitting in seconds.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-widest">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  type="text"
                  required
                  className="w-full bg-ui-input border border-ui-border rounded-xl pl-12 pr-4 py-3 text-text-primary focus:border-brand-accent outline-none transition-all"
                  placeholder="Abhishek Karode"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-widest">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  type="email"
                  required
                  className="w-full bg-ui-input border border-ui-border rounded-xl pl-12 pr-4 py-3 text-text-primary focus:border-brand-accent outline-none transition-all"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted uppercase mb-2 tracking-widest">Create Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  type="password"
                  required
                  className="w-full bg-ui-input border border-ui-border rounded-xl pl-12 pr-4 py-3 text-text-primary focus:border-brand-accent outline-none transition-all"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-brand-accent hover:bg-indigo-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Create Account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-text-muted">
            Already have an account? <Link to="/login" className="text-brand-accent font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;