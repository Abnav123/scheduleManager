import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContextValue.jsx';
import { ShieldAlert, KeyRound, User } from 'lucide-react';

const Login = () => {
  const { login, register, isAuthenticated } = useContext(AuthContext);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
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
      if (isRegisterMode) {
        await register(username, password);
      } else {
        await login(username, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030408] p-6 relative">
      {/* Decorative brutalist container */}
      <div className="w-full max-w-md brutalist-card px-8 py-10">
        
        {/* Heading */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold font-mono tracking-wider text-white uppercase">
            {isRegisterMode ? 'CREWMATE REGISTRATION' : 'SHUTTLE LOGIN'}
          </h2>
          <div className="w-24 h-1 bg-white mx-auto mt-2"></div>
          <p className="text-xs text-neutral-400 font-mono italic mt-2">
            {isRegisterMode ? '"Register a new identity on the bridge"' : '"Are you an Impostor or Crewmate?"'}
          </p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mb-6 p-3 bg-[#ff0000] text-white border-2 border-white text-xs flex items-start gap-2 font-mono font-bold shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Inputs Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-white">
          {/* Username Input */}
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-widest text-white font-bold font-mono">
              Identity Card
            </label>
            <div className="relative flex items-center">
              <User size={16} className="absolute left-3 text-white" />
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. crewmate1"
                disabled={isSubmitting}
                className="w-full pl-9 pr-4 py-2.5 border-2 border-white text-sm transition-all focus:ring-0 rounded-none bg-[#0e1017] text-white"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-widest text-white font-bold font-mono">
              Access Code
            </label>
            <div className="relative flex items-center">
              <KeyRound size={16} className="absolute left-3 text-white" />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
                className="w-full pl-9 pr-4 py-2.5 border-2 border-white text-sm transition-all focus:ring-0 rounded-none bg-[#0e1017] text-white"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="btn-blue w-full py-3"
          >
            {isSubmitting
              ? (isRegisterMode ? 'Registering identity...' : 'Verifying signature...')
              : (isRegisterMode ? 'Deploy Identity' : 'Unfurl Scheduler')}
          </button>
        </form>

        {/* Switch Mode Button */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError('');
            }}
            className="text-xs font-mono text-blue-400 hover:text-blue-300 underline uppercase tracking-wider font-bold"
          >
            {isRegisterMode ? 'Already registered? Sign In' : 'Need an identity? Register'}
          </button>
        </div>

        {/* Footer details */}
        <p className="text-[10px] text-center text-neutral-500 font-mono mt-8 uppercase tracking-wider font-bold">
          Spaceship Administration Console
        </p>
      </div>
    </div>
  );
};

export default Login;
