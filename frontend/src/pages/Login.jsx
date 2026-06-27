import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { ShieldAlert, KeyRound, User } from 'lucide-react';

const Login = () => {
  const { login, isAuthenticated } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // If already logged in, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in both fields.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070707] relative p-6">
      {/* Background Subtle texture */}
      <div className="absolute inset-0 bg-rice-paper opacity-[0.02] pointer-events-none"></div>

      {/* Decorative calligraphic scroll container */}
      <div className="w-full max-w-md parchment-card px-8 py-10 rounded border-2 border-vagabond-brown relative select-none animate-scroll-unfurl">
        {/* Scroll Wooden rollers styling details */}
        <div className="absolute -top-3 left-10 right-10 h-1.5 bg-[#4a3b2c] rounded-full"></div>
        <div className="absolute -bottom-3 left-10 right-10 h-1.5 bg-[#4a3b2c] rounded-full"></div>

        {/* Scroll Heading */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold font-serif tracking-widest text-[#1a1a1a] uppercase">
            ENTER THE PATH
          </h2>
          <div className="w-24 h-0.5 bg-vagabond-brown mx-auto mt-2"></div>
          <p className="text-xs text-[#554738] font-serif italic mt-2">
            "Only the disciplined are truly free."
          </p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mb-6 p-3 bg-opacity-10 bg-vagabond-red border border-vagabond-red rounded text-xs text-[#7d2020] flex items-start gap-2 font-serif font-semibold">
            <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Inputs Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-[#1a1a1a]">
          {/* Username Input */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-serif uppercase tracking-widest text-[#554738] font-bold">
              User Identity
            </label>
            <div className="relative flex items-center">
              <User size={16} className="absolute left-3 text-vagabond-brown" />
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                disabled={isSubmitting}
                className="w-full pl-9 pr-4 py-2.5 rounded border border-vagabond-parchment-dark bg-white bg-opacity-70 focus:bg-white focus:outline-none focus:border-vagabond-gold focus:ring-1 focus:ring-vagabond-gold text-sm font-sans transition-all duration-200"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-serif uppercase tracking-widest text-[#554738] font-bold">
              Access Cipher
            </label>
            <div className="relative flex items-center">
              <KeyRound size={16} className="absolute left-3 text-vagabond-brown" />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
                className="w-full pl-9 pr-4 py-2.5 rounded border border-vagabond-parchment-dark bg-white bg-opacity-70 focus:bg-white focus:outline-none focus:border-vagabond-gold focus:ring-1 focus:ring-vagabond-gold text-sm font-sans transition-all duration-200"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#1a1a1a] hover:bg-vagabond-gold hover:text-black text-white font-serif uppercase tracking-widest text-sm rounded font-bold transition-all duration-300 shadow-zen"
          >
            {isSubmitting ? 'Verifying spirit...' : 'Unfurl Scheduler'}
          </button>
        </form>

        {/* Footer citation details */}
        <p className="text-[10px] text-center text-[#7d6e5c] font-mono mt-8 uppercase tracking-wider">
          Single Admin Configuration System
        </p>
      </div>
    </div>
  );
};

export default Login;
