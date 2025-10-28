// pages/HomePage.tsx

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import HeaderMenu from '../components/HeaderMenu';
import { useLanguage, useTranslations } from '../contexts/LanguageContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const t = useTranslations();
  const { lang } = useLanguage();

  const handleBookingClick = () => {
    navigate('/booking');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-amber-50">
      <HeaderMenu />
      
      {/* Hero Banner Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/image/1761225388708.jpg"
            alt="Blessing Haven"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-transparent"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-wide">
              🌊 Blessing Haven
            </h1>
            <div className="w-24 h-1 bg-amber-400 mx-auto mb-8"></div>
            <p className="text-xl md:text-2xl font-light leading-relaxed max-w-3xl mx-auto">
              {lang === 'zh' 
                ? '在恩典的懷抱中，找到心靈的安息之所。讓海浪的輕柔聲響，帶您進入深度的休息與恢復。'
                : 'In the embrace of grace, find your place of rest. Let the gentle sound of waves guide you into deep restoration and peace.'
              }
            </p>
          </div>
          
          <button
            onClick={handleBookingClick}
            className="inline-flex items-center px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white text-lg font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-amber-300"
          >
            {lang === 'zh' ? '立即訂房' : 'Book Now'}
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="animate-bounce">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-800 mb-6">
                {lang === 'zh' ? '關於祝福海灣' : 'About Blessing Haven'}
              </h2>
              <div className="space-y-4 text-lg text-slate-600 leading-relaxed">
                <p>
                  {lang === 'zh' 
                    ? '祝福海灣不僅是一個住宿地點，更是一個心靈的避風港。在這裡，您可以暫時遠離都市的喧囂，在恩典的氛圍中重新與自己連結。'
                    : 'Blessing Haven is more than just a place to stay—it\'s a sanctuary for the soul. Here, you can step away from urban noise and reconnect with yourself in an atmosphere of grace.'
                  }
                </p>
                <p>
                  {lang === 'zh' 
                    ? '我們相信真正的安息來自於內心的平靜。每一處細節都經過精心設計，讓您能在自然的懷抱中，體驗到前所未有的放鬆與恢復。'
                    : 'We believe true rest comes from inner peace. Every detail is carefully designed to help you experience unprecedented relaxation and restoration in nature\'s embrace.'
                  }
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="/image/1761228528795.jpg"
                alt="Blessing Haven Interior"
                className="w-full h-96 object-cover rounded-lg shadow-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-amber-50 to-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-slate-800 mb-16">
            {lang === 'zh' ? '為什麼選擇祝福海灣？' : 'Why Choose Blessing Haven?'}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌊</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                {lang === 'zh' ? '海景第一排' : 'Oceanfront Location'}
              </h3>
              <p className="text-slate-600">
                {lang === 'zh' 
                  ? '面海而居，每日都能欣賞到壯麗的海景與夕陽，讓自然的美景成為您最好的療癒師。'
                  : 'Wake up to stunning ocean views and breathtaking sunsets every day, letting nature\'s beauty be your greatest healer.'
                }
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏡</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                {lang === 'zh' ? '溫馨舒適' : 'Cozy Comfort'}
              </h3>
              <p className="text-slate-600">
                {lang === 'zh' 
                  ? '精心設計的空間，融合現代便利與自然元素，為您提供最舒適的居住體驗。'
                  : 'Thoughtfully designed spaces that blend modern convenience with natural elements for the most comfortable stay.'
                }
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💚</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                {lang === 'zh' ? '心靈安息' : 'Soul Rest'}
              </h3>
              <p className="text-slate-600">
                {lang === 'zh' 
                  ? '在恩典的氛圍中，找到內心的平靜與安息，讓身心靈得到真正的恢復與更新。'
                  : 'Find inner peace and rest in an atmosphere of grace, allowing your body, mind, and spirit to experience true restoration.'
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-slate-800 mb-16">
            {lang === 'zh' ? '空間環境' : 'Our Spaces'}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="relative group overflow-hidden rounded-lg shadow-lg">
              <img
                src="/image/1761228530997.jpg"
                alt="Blessing Haven Space 1"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            <div className="relative group overflow-hidden rounded-lg shadow-lg">
              <img
                src="/image/1761228533460.jpg"
                alt="Blessing Haven Space 2"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            <div className="relative group overflow-hidden rounded-lg shadow-lg">
              <img
                src="/image/1761228535262.jpg"
                alt="Blessing Haven Space 3"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            <div className="relative group overflow-hidden rounded-lg shadow-lg">
              <img
                src="/image/1761228537207.jpg"
                alt="Blessing Haven Space 4"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            <div className="relative group overflow-hidden rounded-lg shadow-lg">
              <img
                src="/image/1761228539042.jpg"
                alt="Blessing Haven Space 5"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            <div className="relative group overflow-hidden rounded-lg shadow-lg bg-gradient-to-br from-amber-100 to-slate-100 flex items-center justify-center">
              <div className="text-center p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-3">
                  {lang === 'zh' ? '更多驚喜' : 'More Surprises'}
                </h3>
                <p className="text-slate-600 mb-4">
                  {lang === 'zh' ? '等待您來探索' : 'Awaiting your discovery'}
                </p>
                <button
                  onClick={handleBookingClick}
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors duration-200"
                >
                  {lang === 'zh' ? '立即預訂' : 'Book Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            {lang === 'zh' ? '準備好體驗祝福海灣了嗎？' : 'Ready to Experience Blessing Haven?'}
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            {lang === 'zh' 
              ? '讓我們為您安排一場心靈的旅程，在恩典與安息中找到真正的自己。'
              : 'Let us arrange a journey for your soul, where you can find your true self in grace and rest.'
            }
          </p>
          <button
            onClick={handleBookingClick}
            className="inline-flex items-center px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white text-lg font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-amber-300"
          >
            {lang === 'zh' ? '開始您的旅程' : 'Start Your Journey'}
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">🌊 Blessing Haven</h3>
            <p className="text-slate-400 mb-6">
              {lang === 'zh' 
                ? '在恩典的懷抱中，找到心靈的安息之所'
                : 'In the embrace of grace, find your place of rest'
              }
            </p>
            <div className="flex justify-center space-x-6">
              <button
                onClick={handleBookingClick}
                className="text-amber-400 hover:text-amber-300 transition-colors duration-200"
              >
                {lang === 'zh' ? '訂房' : 'Booking'}
              </button>
              <Link
                to="/lookup"
                className="text-slate-400 hover:text-white transition-colors duration-200"
              >
                {lang === 'zh' ? '查詢訂單' : 'Order Lookup'}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
