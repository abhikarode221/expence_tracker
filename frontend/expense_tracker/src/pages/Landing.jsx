import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, PieChart, Users, Zap, ArrowRight } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-ui-bg text-text-primary selection:bg-brand-accent/30">
      
      {/* --- HERO SECTION --- */}
      <header className="relative overflow-hidden pt-16 pb-24 lg:pt-32">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-brand-accent/10 border border-brand-accent/20 px-4 py-1.5 rounded-full mb-8">
              <Zap size={14} className="text-brand-accent" />
              <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">
                Version 2.0 is Live
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black mb-8 tracking-tighter leading-tight">
              Finance tracking <br />
              <span className="text-brand-accent">reimagined for you.</span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg text-text-muted mb-12 leading-relaxed">
              SpendWise helps you split expenses, track monthly budgets, and visualize your spending habits—all within a secure, minimalist interface.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/register" 
                className="w-full sm:w-auto px-8 py-4 bg-brand-accent hover:bg-indigo-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                Get Started for Free <ArrowRight size={18} />
              </Link>
              <Link 
                to="/login" 
                className="w-full sm:w-auto px-8 py-4 bg-ui-input border border-ui-border hover:border-brand-accent/50 rounded-2xl transition-all font-bold"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* --- FEATURES GRID --- */}
      <section className="py-24 bg-ui-card/30 border-y border-ui-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <FeatureCard 
              icon={<Users size={24} />} 
              title="Smart Splitting" 
              desc="Divide dinner, rent, or travel costs instantly. SpendWise tracks who owes what so you don't have to."
            />
            <FeatureCard 
              icon={<PieChart size={24} />} 
              title="Visual Analytics" 
              desc="Understand your habits with dynamic spending charts categorized by food, transport, and more."
            />
            <FeatureCard 
              icon={<Shield size={24} />} 
              title="Secure & Private" 
              desc="Your data is protected with industry-standard encryption and secure authentication."
            />

          </div>
        </div>
      </section>

      {/* --- CTA FOOTER --- */}
      <footer className="py-20 text-center">
        <h3 className="text-2xl font-bold mb-4">Ready to take control?</h3>
        <p className="text-text-muted mb-8">Join thousands of users simplifying their finances with  SpendWise.</p>
        <p className="text-[10px] text-text-muted/50 font-bold uppercase tracking-widest">
          Designed by Abhishek Karode &bull; 2026
        </p>
      </footer>
    </div>
  );
};

// Sub-component for clean code
const FeatureCard = ({ icon, title, desc }) => (
  <div className="glass-card p-8 group hover:border-brand-accent/30 transition-all">
    <div className="w-12 h-12 bg-brand-accent/10 rounded-xl flex items-center justify-center text-brand-accent mb-6">
      {icon}
    </div>
    <h4 className="text-xl font-bold mb-3">{title}</h4>
    <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
  </div>
);

export default Landing;