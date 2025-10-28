import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import ConfirmationPage from './pages/ConfirmationPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import LookupPage from './pages/LookupPage';
import { Booking } from './types';
import { LanguageProvider } from './contexts/LanguageContext';
import { apiService } from './services/apiService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    // 清除存儲的管理員密碼
    apiService.clearAdminPassword();
  }

  return (
    <LanguageProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/booking" element={<BookingPage setLastBooking={setLastBooking} />} />
          <Route path="/confirmation" element={<ConfirmationPage booking={lastBooking} />} />
          <Route path="/lookup" element={<LookupPage />} />
          <Route path="/admin/login" element={<AdminLoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route 
            path="/admin/dashboard" 
            element={
              isAuthenticated ? (
                <AdminDashboard onLogout={handleLogout} />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            } 
          />
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </HashRouter>
    </LanguageProvider>
  );
};

export default App;