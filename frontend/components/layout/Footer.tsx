'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Server, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useTheme } from 'next-themes';

export const Footer = () => {
    const localTheme = localStorage.getItem('theme') === 'system'
        ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : (localStorage.getItem('theme') || 'light');

    const { resolvedTheme } = useTheme();
    const [theme, setTheme] = useState(localTheme);

    useEffect(() => {
        setTheme(resolvedTheme || 'light');
    }, [resolvedTheme]);

    return theme === 'dark' ? (
        <div className="bg-gray-900 text-white relative w-full">
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: `
                        radial-gradient(circle 100vw at 50% 100%, rgba(70, 85, 110, 0.3) 0%, transparent 20%),
                        radial-gradient(circle 100vw at 50% 100%, rgba(99, 102, 241, 0.2) 0%, transparent 30%),
                        radial-gradient(circle 100vw at 50% 100%, rgba(181, 184, 208, 0.1) 0%, transparent 50%)
                    `,
                }}
            ></div>
            <FooterContent />
        </div>
    ) : (
        <footer className="bg-gray-900 text-white">
            <FooterContent />
        </footer>
    )
};

const FooterContent = () => {
    const t = useTranslations('footer');
    const locale = useLocale();

    const currentYear = new Date().getFullYear();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-1 relative">
            <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Company Info */}
                <div className="col-span-1 lg:col-span-2">
                    <div className="flex items-center space-x-2 mb-4">
                        <Server className="h-8 w-8 text-blue-400" />
                        <span className="text-xl font-bold">VStack</span>
                    </div>
                    <p className="text-gray-400 mb-6 max-w-md">
                        {t('description')}
                    </p>

                    <div className="flex space-x-4">
                        <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                            <Facebook className="h-5 w-5" />
                        </Link>
                        <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                            <Twitter className="h-5 w-5" />
                        </Link>
                        <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                            <Instagram className="h-5 w-5" />
                        </Link>
                        <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                            <Linkedin className="h-5 w-5" />
                        </Link>
                    </div>
                </div>

                {/* Quick Links */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">
                        {t('quick_links')}
                    </h3>
                    <ul className="space-y-2">
                        <li>
                            <Link href={`/${locale}/plans`} className="text-gray-400 hover:text-white transition-colors">
                                {t('plans')}
                            </Link>
                        </li>
                        <li>
                            <Link href={`/${locale}/support`} className="text-gray-400 hover:text-white transition-colors">
                                {t('support')}
                            </Link>
                        </li>
                        <li>
                            <Link href={`/${locale}/support`} className="text-gray-400 hover:text-white transition-colors">
                                {t('faq')}
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Contact Info */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">
                        {t('contact')}
                    </h3>

                    <ul className="space-y-3">
                        <li className="flex items-center space-x-3">
                            <Mail className="h-4 w-4 text-blue-400" />
                            <span className="text-gray-400">support@vpsrental.com</span>
                        </li>
                        <li className="flex items-center space-x-3">
                            <Phone className="h-4 w-4 text-blue-400" />
                            <span className="text-gray-400">+1 (555) 123-4567</span>
                        </li>
                        <li className="flex items-center space-x-3">
                            <MapPin className="h-4 w-4 text-blue-400" />
                            <span className="text-gray-400">123 Cloud Street, Tech City</span>
                        </li>
                    </ul>

                    <div className="mt-6">
                        <h4 className="text-sm font-semibold mb-2">
                            {t('24_7')}
                        </h4>
                        <p className="text-gray-400 text-sm">
                            {t('24_7_desc')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="text-gray-400 text-sm">
                        © {currentYear} VStack.{" "}
                        {t('all_rights_reserved')}
                    </div>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                            {t('privacy')}
                        </Link>
                        <Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                            {t('terms')}
                        </Link>
                        <Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                            {t('cookies')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}