import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import Navbar from './components/Navbar';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GroupsPage from './pages/GroupsPage';
import ReportsPage from './pages/ReportsPage';

// Suppress React Router future flag warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    args.length > 0 &&
    typeof args[0] === 'string' &&
    args[0].includes('React Router Future Flag Warning')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const api = (await import('./utils/api')).default;
      const response = await api.get('/auth/me');
      console.log('=== FETCHED USER PROFILE ===');
      console.log('User profile:', response.data);
      console.log('User ID field:', response.data._id ? '_id' : response.data.id ? 'id' : 'unknown');
      console.log('=== END DEBUG ===');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, token) => {
    console.log('=== LOGIN USER DATA ===');
    console.log('UserData:', userData);
    console.log('User ID field:', userData._id ? '_id' : userData.id ? 'id' : 'unknown');
    console.log('=== END DEBUG ===');
    
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-gray-100">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        <Routes>
          <Route 
            path="/signup" 
            element={!user ? <Signup onLogin={handleLogin} /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/login" 
            element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/groups" 
            element={user ? <GroupsPage user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/reports/:groupId" 
            element={user ? <ReportsPage user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={user ? "/dashboard" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;