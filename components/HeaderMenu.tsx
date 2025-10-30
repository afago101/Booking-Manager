// components/HeaderMenu.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bars3Icon } from './icons';
import { useLanguage, useTranslations } from '../contexts/LanguageContext';

const HeaderMenu: React.FC = () => {
    const t = useTranslations();
    const { lang, setLang } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const toggleLanguage = () => {
        setLang(lang === 'zh' ? 'en' : 'zh');
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div ref={menuRef} className="fixed top-4 left-4 z-30">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full bg-transparent border-none text-white hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                aria-label="Open menu"
            >
                {isOpen ? (
                    <div className="h-8 w-8 flex items-center justify-center bg-white/15 backdrop-blur-sm rounded-full ring-1 ring-gray-400/50">
                        <div className="relative h-5 w-5">
                            <div className="w-5 h-0.5 bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45" style={{
                                boxShadow: '1px 1px 0px #6b7280, -1px -1px 0px #6b7280, 1px -1px 0px #6b7280, -1px 1px 0px #6b7280'
                            }}></div>
                            <div className="w-5 h-0.5 bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45" style={{
                                boxShadow: '1px 1px 0px #6b7280, -1px -1px 0px #6b7280, 1px -1px 0px #6b7280, -1px 1px 0px #6b7280'
                            }}></div>
                        </div>
                    </div>
                ) : (
                    <div className="h-6 w-6 flex flex-col justify-center items-center space-y-1">
                        <div className="w-5 h-0.5 bg-white" style={{
                            boxShadow: '1px 1px 0px #6b7280, -1px -1px 0px #6b7280, 1px -1px 0px #6b7280, -1px 1px 0px #6b7280'
                        }}></div>
                        <div className="w-5 h-0.5 bg-white" style={{
                            boxShadow: '1px 1px 0px #6b7280, -1px -1px 0px #6b7280, 1px -1px 0px #6b7280, -1px 1px 0px #6b7280'
                        }}></div>
                        <div className="w-5 h-0.5 bg-white" style={{
                            boxShadow: '1px 1px 0px #6b7280, -1px -1px 0px #6b7280, 1px -1px 0px #6b7280, -1px 1px 0px #6b7280'
                        }}></div>
                    </div>
                )}
            </button>
            
            <div 
                className={`
                    origin-top-left absolute left-0 mt-2 w-64 rounded-xl shadow-2xl bg-white/95 backdrop-blur-md border border-gray-200
                    transition-all ease-out duration-200
                    ${isOpen ? 'transform opacity-100 scale-100' : 'transform opacity-0 scale-95 pointer-events-none'}
                `}
            >
                <div className="py-2" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <Link
                        to="/"
                        className="block px-5 py-3 text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-all duration-200 border-l-3 border-transparent hover:border-amber-400"
                        role="menuitem"
                        onClick={() => setIsOpen(false)}
                    >
                        {lang === 'zh' ? '首頁' : 'Home'}
                    </Link>
                    <Link
                        to="/booking"
                        className="block px-5 py-3 text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-all duration-200 border-l-3 border-transparent hover:border-amber-400"
                        role="menuitem"
                        onClick={() => setIsOpen(false)}
                    >
                        {lang === 'zh' ? '訂房' : 'Booking'}
                    </Link>
                    <Link
                        to="/lookup"
                        className="block px-5 py-3 text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-all duration-200 border-l-3 border-transparent hover:border-amber-400"
                        role="menuitem"
                        onClick={() => setIsOpen(false)}
                    >
                        {t.header.lookupOrder}
                    </Link>
                    <button
                        onClick={toggleLanguage}
                        className="block w-full text-left px-5 py-3 text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-all duration-200 border-l-3 border-transparent hover:border-amber-400"
                        role="menuitem"
                    >
                        {t.header.language}
                    </button>
                    
                    {/* Social Media Links */}
                    <div className="border-t border-gray-200 my-2"></div>
                    <div className="px-5 py-3">
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">
                            {lang === 'zh' ? '關注我們' : 'Follow Us'}
                        </p>
                        <div className="flex space-x-3">
                            <a
                                href="https://lin.ee/AIhqwPU1"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center w-9 h-9 bg-green-500 hover:bg-green-600 text-white rounded-full transition-all duration-200 hover:scale-110 shadow-lg"
                                aria-label="LINE"
                                onClick={() => setIsOpen(false)}
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                                </svg>
                            </a>
                            <a
                                href="https://www.instagram.com/blessing_haven_?igsh=dnh5ZWx0NXM1YzVx&utm_source=qr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center w-9 h-9 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full transition-all duration-200 hover:scale-110 shadow-lg"
                                aria-label="Instagram"
                                onClick={() => setIsOpen(false)}
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.418-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.418 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.418 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.417-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeaderMenu;