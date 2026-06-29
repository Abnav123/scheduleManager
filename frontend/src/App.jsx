import React, { useContext, useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { AuthContext } from './context/AuthContextValue.jsx';
import Layout from './components/Layout.jsx';
import FocusMode from './components/FocusMode.jsx';
const Login = React.lazy(() => import('./pages/Login.jsx'));
const Dashboard = React.lazy(() => import('./pages/Dashboard.jsx'));
const TimetableManager = React.lazy(() => import('./pages/TimetableManager.jsx'));
const History = React.lazy(() => import('./pages/History.jsx'));
const Diary = React.lazy(() => import('./pages/Diary.jsx'));
const Stats = React.lazy(() => import('./pages/Stats.jsx'));
const Goals = React.lazy(() => import('./pages/Goals.jsx'));
const NotesPlaceholder = React.lazy(() => import('./pages/NotesPlaceholder.jsx'));
const Punishments = React.lazy(() => import('./pages/Punishments.jsx'));

import api from './utils/api.js';
import { RefreshCw } from 'lucide-react';

// Helper component for private routes
const ProtectedRoute = ({ children, onEnterFocusMode }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030408] flex flex-col items-center justify-center gap-4 text-white">
        <RefreshCw className="animate-spin" size={32} />
        <span className="font-mono text-sm font-bold">Verifying crewmate signature...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout onEnterFocusMode={onEnterFocusMode}>
      {children}
    </Layout>
  );
};

const AppContent = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [activeFocusTask, setActiveFocusTask] = useState(null);

  // Search and update current active focus task on start or interval
  const updateActiveTask = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/stats/dashboard');
      const currentTask = res.data.currentTask;
      setActiveFocusTask(currentTask);
    } catch (error) {
      console.error('Failed to update active task for focus mode:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      updateActiveTask();
      const interval = setInterval(updateActiveTask, 30000); // refresh active task every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, updateActiveTask]);

  // Focus Mode Actions
  const handleEnterFocusMode = () => {
    updateActiveTask().then(() => {
      setIsFocusMode(true);
    });
  };

  const handleExitFocusMode = () => {
    setIsFocusMode(false);
  };

  const handleCompleteTaskInFocus = async (taskId) => {
    try {
      await api.post(`/tasks/${taskId}/complete`);
      alert('Task completed successfully! You earned XP.');
      setIsFocusMode(false);
      // Reload page content by triggers
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Completion failed.');
    }
  };

  return (
    <>
      {/* 1. Fullscreen Focus Mode Overlay */}
      {isFocusMode && (
        <FocusMode
          task={activeFocusTask}
          onExit={handleExitFocusMode}
          onComplete={handleCompleteTaskInFocus}
        />
      )}

      {/* 2. Routing Tables */}
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-[#030408] flex flex-col items-center justify-center gap-4 text-white">
            <RefreshCw className="animate-spin" size={32} />
            <span className="font-mono text-sm font-bold">Unfolding view...</span>
          </div>
        }
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute onEnterFocusMode={handleEnterFocusMode}>
                <Dashboard onEnterFocusMode={handleEnterFocusMode} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/timetables" 
            element={
              <ProtectedRoute onEnterFocusMode={handleEnterFocusMode}>
                <TimetableManager />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/history" 
            element={
              <ProtectedRoute onEnterFocusMode={handleEnterFocusMode}>
                <History />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/punishments" 
            element={
              <ProtectedRoute onEnterFocusMode={handleEnterFocusMode}>
                <Punishments />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/diary" 
            element={
              <ProtectedRoute onEnterFocusMode={handleEnterFocusMode}>
                <Diary />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/stats" 
            element={
              <ProtectedRoute onEnterFocusMode={handleEnterFocusMode}>
                <Stats />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/goals" 
            element={
              <ProtectedRoute onEnterFocusMode={handleEnterFocusMode}>
                <Goals />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/notes" 
            element={
              <ProtectedRoute onEnterFocusMode={handleEnterFocusMode}>
                <NotesPlaceholder />
              </ProtectedRoute>
            } 
          />

          {/* Fallbacks */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
