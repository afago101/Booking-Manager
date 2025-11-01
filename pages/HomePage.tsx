// pages/HomePage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import HeaderMenu from '../components/HeaderMenu';
import { useLanguage, useTranslations } from '../contexts/LanguageContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const t = useTranslations();
  const { lang } = useLanguage();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const galleryImages = [
    '/image/1761228530997.jpg',
    '/image/1761228533460.jpg',
    '/image/1761228535262.jpg',
    '/image/1761228537207.jpg',
    '/image/1761228539042.jpg'
  ];

  const handleBookingClick = () => {
    navigate('/booking');
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  // Auto carousel every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [galleryImages.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-amber-50">
      <HeaderMenu />
      
      {/* Hero Banner Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/image/1761225388708.jpg"
            alt="頭城海灘近滿山望海海景房"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-transparent"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
          <div className="mb-8 -mt-16 md:-mt-20">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-wide text-white drop-shadow-2xl">
              Blessing Haven
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto mb-6 rounded-full drop-shadow-lg"></div>
            <p className="text-lg md:text-xl font-bold mb-4 text-amber-100" style={{
              textShadow: '0px 0px 8px rgba(0,0,0,0.3), 0px 0px 4px rgba(255,255,255,0.1)'
            }}>
              {lang === 'zh' 
                ? '在恩典的懷抱中，找到心靈安息之所'
                : 'In the embrace of grace, find your place of rest'
              }
            </p>
            <p className="text-xl md:text-2xl font-bold leading-relaxed max-w-3xl mx-auto text-white" style={{
              textShadow: '0px 0px 8px rgba(0,0,0,0.3), 0px 0px 4px rgba(255,255,255,0.1)'
            }}>
              {lang === 'zh' 
                ? '讓海浪的輕柔與壯闊，帶您深度休息'
                : 'Let the gentle and magnificent waves guide you into deep rest'
              }
            </p>
          </div>
          
          <button
            onClick={handleBookingClick}
            className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xl font-semibold rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-amber-300/50 backdrop-blur-sm"
          >
            {lang === 'zh' ? '立即訂房' : 'Book Now'}
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
              <h2 className="text-4xl font-bold text-slate-800 mb-6 relative">
                {lang === 'zh' ? '關於 Blessing Haven' : 'About Blessing Haven'}
                <div className="absolute -bottom-2 left-0 w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
              </h2>
              <div className="space-y-4 text-lg text-slate-600 leading-relaxed">
                <p className="text-xl font-medium text-slate-700 mb-4">
                  {lang === 'zh' 
                    ? '拋下城市的重量，走進 Blessing Haven'
                    : 'Leave the weight of the city behind and step into Blessing Haven'
                  }
                </p>
                <p className="text-lg mb-4">
                  {lang === 'zh' 
                    ? '在這裡，海不僅是風景，也是一種溫柔的陪伴'
                    : 'Here, the sea is not just scenery, but also a gentle companion'
                  }
                </p>
                <p>
                  {lang === 'zh' 
                    ? 'Blessing Haven 坐落於宜蘭頭城海岸線上，是能真正面向太平洋第一排的海景住所。我們相信休息不只是停下腳步，而是讓自己能被擁抱，能被重新溫柔對待。'
                    : 'Blessing Haven is located on the coast of Toucheng, Yilan, offering true first-row oceanfront views of the Pacific. We believe rest is not just stopping, but allowing yourself to be embraced and treated with gentleness again.'
                  }
                </p>
                <p>
                  {lang === 'zh' 
                    ? '在這裡，您可以在日出中甦醒、在潮聲中入眠。看著山林海景，慢慢理解「生活可以更慢、更美」。'
                    : 'Here, you can wake up to sunrise and fall asleep to the sound of waves. Watching the mountain and sea views, slowly understanding that "life can be slower and more beautiful."'
                  }
                </p>
              </div>
            </div>
            <div className="relative">
              {/* Image Carousel */}
              <div className="relative w-full h-96 rounded-xl shadow-xl overflow-hidden">
                <img
                  src={galleryImages[currentImageIndex]}
                  alt="頭城海灘近滿山望海海景房"
                  className="w-full h-full object-cover"
                />
                
                {/* Navigation Arrows */}
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                  aria-label="Previous image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                  aria-label="Next image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* Image Indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {galleryImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        index === currentImageIndex 
                          ? 'bg-white shadow-lg' 
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-amber-50 to-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-slate-800 mb-16 relative">
            {lang === 'zh' ? '美好亮點' : 'Beautiful Highlights'}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="p-8 bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-amber-100">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <span className="text-2xl">🌊</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                {lang === 'zh' ? '出門即是海景，不需走遠' : 'Ocean Views Right Outside Your Door'}
              </h3>
              <div className="space-y-3 text-slate-600">
                <p className="font-bold text-slate-800">
                  {lang === 'zh' 
                    ? '透過大面落地窗直面太平洋，感受海天相接的靜謐。天氣晴朗時可遠眺龜山島牛奶海，日出時分更是絕景'
                    : 'Through large floor-to-ceiling windows, face the Pacific Ocean directly and feel the tranquility where sea meets sky. On clear days, you can see Turtle Island\'s milky sea in the distance, with sunrise being absolutely spectacular.'
                  }
                </p>
              </div>
            </div>
            
            <div className="p-8 bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-amber-100">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <span className="text-2xl">🏡</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                {lang === 'zh' ? '舒適中見質感' : 'Comfort with Quality'}
              </h3>
              <div className="space-y-3 text-slate-600">
                <p className="font-bold text-slate-800">
                  {lang === 'zh' 
                    ? '全室採用溫潤木質 × 柔和自然系配色。我們希望每位入住者，都能在這裡睡得比家還好'
                    : 'The entire space features warm wood × soft natural color schemes. We hope every guest can sleep better here than at home.'
                  }
                </p>
                <div className="mt-4">
                  <p className="font-bold text-slate-800 mb-2">
                    {lang === 'zh' ? '房內提供：' : 'Room amenities include:'}
                  </p>
                  <ul className="grid grid-cols-2 gap-1 text-sm">
                    <li>• {lang === 'zh' ? 'Wi-Fi' : 'Wi-Fi'}</li>
                    <li>• {lang === 'zh' ? '智慧型電視' : 'Smart TV'}</li>
                    <li>• {lang === 'zh' ? '浴缸與沐浴用品' : 'Bathtub & Toiletries'}</li>
                    <li>• {lang === 'zh' ? '舒適寢具' : 'Comfortable Bedding'}</li>
                    <li>• {lang === 'zh' ? '廚房設施' : 'Kitchen Facilities'}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location & Target Section */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-amber-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="p-8 bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-amber-100">
              <h3 className="text-2xl font-bold text-slate-800 mb-6 relative">
                {lang === 'zh' ? '地理位置' : 'Location'}
                <div className="absolute -bottom-2 left-0 w-12 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
              </h3>
              <div className="space-y-4 text-slate-600">
                <p className="font-bold text-slate-800">
                  {lang === 'zh' ? '位於 宜蘭頭城｜大坑路 海岸線' : 'Located on the coast of Toucheng, Yilan | Dakan Road'}
                </p>
                <p className="font-bold text-slate-800">
                  {lang === 'zh' ? '近滿山望海咖啡廳，生活便利，卻不失寧靜' : 'Near Manshan Wanghai Cafe, convenient for daily life yet peaceful'}
                </p>
                
                <div>
                  <p className="font-bold text-slate-800 mb-2">
                    {lang === 'zh' ? '車程距離：' : 'Driving distance:'}
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li>• {lang === 'zh' ? '頭城交流道 約 7 分鐘' : 'Toucheng Interchange ~7 minutes'}</li>
                    <li>• {lang === 'zh' ? '頭城火車站 約 5 分鐘' : 'Toucheng Train Station ~5 minutes'}</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-bold text-slate-800 mb-2">
                    {lang === 'zh' ? '周邊景點：' : 'Nearby attractions:'}
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li>• {lang === 'zh' ? '滿山望海' : 'Manshan Wanghai'}</li>
                    <li>• {lang === 'zh' ? '烏石港 / 龜山島登島碼頭' : 'Wushi Port / Turtle Island Pier'}</li>
                    <li>• {lang === 'zh' ? '蘭陽博物館' : 'Lanyang Museum'}</li>
                    <li>• {lang === 'zh' ? '頭城老街' : 'Toucheng Old Street'}</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="p-8 bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-amber-100">
              <h3 className="text-2xl font-bold text-slate-800 mb-6 relative">
                {lang === 'zh' ? '適合這樣的你' : 'Perfect For You'}
                <div className="absolute -bottom-2 left-0 w-12 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
              </h3>
              <div className="space-y-4 text-slate-600">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-amber-500 mr-2">•</span>
                    <span className="font-bold text-slate-800">{lang === 'zh' ? '想安靜休息、需要喘口氣的人' : 'Those who want quiet rest and need to catch their breath'}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-amber-500 mr-2">•</span>
                    <span className="font-bold text-slate-800">{lang === 'zh' ? '渴望面海閱讀 / 思想 / 放空的旅人' : 'Travelers who long for ocean-facing reading / meditation / relaxation'}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-amber-500 mr-2">•</span>
                    <span className="font-bold text-slate-800">{lang === 'zh' ? '喜歡海、但不喜歡人群的人' : 'Those who love the sea but dislike crowds'}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-amber-500 mr-2">•</span>
                    <span className="font-bold text-slate-800">{lang === 'zh' ? '想與家人、伴侶度過一段不被打擾的時光' : 'Those who want to spend uninterrupted time with family or partners'}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-amber-500 mr-2">•</span>
                    <span className="font-bold text-slate-800">{lang === 'zh' ? '這裡不是華麗的度假村，而是一個能讓心真正降噪的地方' : 'This is not a luxurious resort, but a place where your heart can truly find peace'}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            {lang === 'zh' ? '立即預訂' : 'Book Now'}
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            {lang === 'zh' 
              ? '不要再讓「想要休息」只停留在口中'
              : 'Don\'t let "wanting to rest" remain just words'
            }
          </p>
          <p className="text-lg text-slate-300 mb-8">
            {lang === 'zh' 
              ? '也許，你現在就需要這片海'
              : 'Maybe you need this ocean right now'
            }
          </p>
          <button
            onClick={handleBookingClick}
            className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xl font-semibold rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-amber-300/50 backdrop-blur-sm"
          >
            {lang === 'zh' ? '立即查看空房與價格' : 'Check Availability & Prices'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">
              Blessing Haven
            </h3>
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
