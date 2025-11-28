'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react';
import { useTheme } from 'next-themes';
import FooterPlaceholder from '@/components/custom/placeholder/footer';

export const Footer = () => {
    const { resolvedTheme } = useTheme();
    const [isMounted, setIsMounted] = useState(false);
    const [theme, setTheme] = useState<string | undefined>(undefined);

    useEffect(() => {
        setIsMounted(true);
        setTheme(resolvedTheme || 'light');
    }, [resolvedTheme]);

    if (!isMounted) {
        return (
            <footer className="bg-gray-900 text-white relative w-full">
                <FooterPlaceholder />
            </footer>
        );
    }

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
            <div className="py-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Company Info */}
                <div>
                    <div className="mb-8 sm:mb-15 md:mb-9.5 lg:mb-15">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="h-25 w-25 float-left mr-3"
                        />
                        <p className="text-gray-400 mb-6">
                            {t('description')}
                        </p>
                    </div>

                    <div className="flex space-x-4">
                        <Link
                            href="#"
                            className="text-gray-400 hover:text-blue-500 transition-all duration-300 hover:scale-110 hover:-translate-y-1"
                            aria-label="Facebook"
                        >
                            <Facebook className="h-5 w-5" />
                        </Link>
                        <Link
                            href="#"
                            className="text-gray-400 hover:text-rose-600 transition-all duration-300 hover:scale-110 hover:-translate-y-1"
                            aria-label="Instagram"
                        >
                            <Instagram className="h-5 w-5" />
                        </Link>
                        <Link
                            href="#"
                            className="text-gray-400 hover:text-blue-400 transition-all duration-300 hover:scale-110 hover:-translate-y-1"
                            aria-label="LinkedIn"
                        >
                            <Linkedin className="h-5 w-5" />
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">
                            {t('quick_links')}
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href={`/${locale}/plans`}
                                    className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block"
                                >
                                    {t('plans')}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${locale}/support`}
                                    className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block"
                                >
                                    {t('support')}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${locale}/support`}
                                    className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block"
                                >
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
                            <li className="flex items-center space-x-3 group">
                                <Mail className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform duration-200" />
                                <span className="text-gray-400 group-hover:text-white transition-colors duration-200">support@vpsrental.com</span>
                            </li>
                            <li className="flex items-center space-x-3 group">
                                <Phone className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform duration-200" />
                                <span className="text-gray-400 group-hover:text-white transition-colors duration-200">+1 (555) 123-4567</span>
                            </li>
                            <li className="flex items-center space-x-3 group">
                                <MapPin className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform duration-200" />
                                <span className="text-gray-400 group-hover:text-white transition-colors duration-200">123 Cloud Street, Tech City</span>
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
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="text-gray-400 text-sm">
                        © {currentYear} PCloud.{" "}
                        {t('all_rights_reserved')}
                    </div>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <Link
                            href="#"
                            className="text-gray-400 hover:text-white text-sm transition-all duration-200 hover:scale-105"
                        >
                            {t('privacy')}
                        </Link>
                        <Link
                            href="#"
                            className="text-gray-400 hover:text-white text-sm transition-all duration-200 hover:scale-105"
                        >
                            {t('terms')}
                        </Link>
                        <Link
                            href="#"
                            className="text-gray-400 hover:text-white text-sm transition-all duration-200 hover:scale-105"
                        >
                            {t('cookies')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}