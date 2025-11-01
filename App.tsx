import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import ConfirmationPage from './pages/ConfirmationPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import LookupPage from './pages/LookupPage';
import BenefitsPage from './pages/BenefitsPage';
import LineBindSuccessPage from './pages/LineBindSuccessPage';
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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/booking" element={<BookingPage setLastBooking={setLastBooking} />} />
          <Route path="/confirmation" element={<ConfirmationPage booking={lastBooking} />} />
          <Route path="/line-bind-success" element={<LineBindSuccessPage />} />
          <Route path="/lookup" element={<LookupPage />} />
          <Route path="/benefits" element={<BenefitsPage />} />
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
      </BrowserRouter>
    </LanguageProvider>
  );
};

export default App;