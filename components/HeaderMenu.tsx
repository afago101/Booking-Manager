// components/HeaderMenu.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from './icons';
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
                className="p-2 rounded-md text-brand-dark hover:text-brand-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                aria-label="Open menu"
            >
                {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
            
            <div 
                className={`
                    origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5
                    transition-all ease-out duration-150
                    ${isOpen ? 'transform opacity-100 scale-100' : 'transform opacity-0 scale-95 pointer-events-none'}
                `}
            >
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <Link
                        to="/"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                        onClick={() => setIsOpen(false)}
                    >
                        {lang === 'zh' ? '首頁' : 'Home'}
                    </Link>
                    <Link
                        to="/booking"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                        onClick={() => setIsOpen(false)}
                    >
                        {lang === 'zh' ? '訂房' : 'Booking'}
                    </Link>
                    <Link
                        to="/lookup"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                        onClick={() => setIsOpen(false)}
                    >
                        {t.header.lookupOrder}
                    </Link>
                    <button
                        onClick={toggleLanguage}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                    >
                        {t.header.language}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HeaderMenu;