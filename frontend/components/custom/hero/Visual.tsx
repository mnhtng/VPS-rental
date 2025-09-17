'use client';

import { Server, Shield } from 'lucide-react';

export default function VPSControlPanel({
    isDark = false,
    t
}: {
    isDark?: boolean;
    t: (key: string) => string;
}) {
    const services = [
        { name: t('hero.services.web_server'), color: 'bg-green-500 dark:bg-green-600', position: 'top-4 left-1/2', transform: '-translate-x-1/2', delay: '0s' },
        { name: t('hero.services.database'), color: 'bg-purple-500 dark:bg-purple-600', position: 'top-1/2 right-4', transform: '-translate-y-1/2', delay: '0.5s' },
        { name: t('hero.services.backup'), color: 'bg-orange-500 dark:bg-orange-600', position: 'bottom-4 left-1/2', transform: '-translate-x-1/2', delay: '1s' },
        { name: t('hero.services.monitoring'), color: 'bg-red-500 dark:bg-red-600', position: 'top-1/2 left-4', transform: '-translate-y-1/2', delay: '1.5s' }
    ];

    const performanceCards = [
        { value: t('hero.performance.value.uptime'), label: t('hero.performance.label.uptime'), position: '-top-6 -right-8', colors: 'from-blue-500 to-blue-700' },
        { value: t('hero.performance.value.deploy'), label: t('hero.performance.label.deploy'), position: 'top-1/2 -left-8', colors: 'from-green-500 to-green-700' },
        { value: t('hero.performance.value.support'), label: t('hero.performance.label.support'), position: '-bottom-6 right-6', colors: 'from-purple-500 to-purple-700' }
    ];

    const connectionLines = [
        { x1: 96, y1: 96, x2: 96, y2: 16, color: '#3B82F6', delay: '0s' },
        { x1: 96, y1: 96, x2: 176, y2: 96, color: '#8B5CF6', delay: '0.5s' },
        { x1: 96, y1: 96, x2: 96, y2: 176, color: '#F97316', delay: '1s' },
        { x1: 96, y1: 96, x2: 16, y2: 96, color: '#EF4444', delay: '1.5s' }
    ];

    const styles = isDark ? {
        container: 'bg-gray-900/80 backdrop-blur-sm border-gray-700',
        title: 'text-white',
        subtitle: 'text-gray-400',
        border: 'border-blue-400',
        centerHub: 'bg-blue-600 border border-blue-400/30',
        labels: 'text-gray-400',
        glow: 'from-blue-900/70 to-purple-900/70',
        iconBg: (color: string) => `bg-${color}-600`
    } : {
        container: 'bg-white border',
        title: 'text-gray-900',
        subtitle: 'text-gray-600',
        border: 'border-blue-600',
        centerHub: 'bg-blue-500',
        labels: 'text-gray-600',
        glow: 'from-blue-50 to-purple-50',
        iconBg: (color: string) => `bg-${color}-500`
    };

    return (
        <div className="relative max-w-lg ml-auto">
            <div className={`${styles.container} rounded-3xl shadow-2xl p-8 border`}>
                <div className="text-center mb-6">
                    <h3 className={`text-lg font-semibold ${styles.title} mb-2`}>
                        {t('hero.visual_alt')}
                    </h3>
                    <p className={`text-sm ${styles.subtitle}`}>
                        {t('hero.visual_desc')}
                    </p>
                </div>

                <div className="relative w-48 h-48 mx-auto">
                    {/* Ripple effect circles */}
                    {[0, 1, 2].map((index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 rounded-full border-2 ${styles.border} animate-ping`}
                            style={{
                                opacity: 0.6 - index * 0.2,
                                animationDelay: `${index * 0.5}s`,
                                animationDuration: '2s',
                                transform: `scale(${0.1 + index * 0.3})`
                            }}
                        />
                    ))}

                    {/* Center Hub */}
                    <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 ${styles.centerHub} rounded-full flex items-center justify-center shadow-lg`}>
                        <Server className="w-6 h-6 text-white" />
                    </div>

                    {/* Service Nodes */}
                    {services.map((service) => (
                        <div
                            key={service.name}
                            className={`absolute ${service.position} transform ${service.transform} w-6 h-6 ${service.color} rounded-full animate-pulse`}
                            style={{ animationDelay: service.delay }}
                        >
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full" />
                        </div>
                    ))}

                    {/* Connection Lines */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 192 192">
                        {connectionLines.map((line, index) => (
                            <line
                                key={index}
                                x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                                stroke={line.color} strokeWidth="1"
                                opacity={isDark ? "0.8" : "0.6"} strokeDasharray="2,2"
                            >
                                <animate
                                    attributeName="stroke-dashoffset"
                                    values="0;4" dur="1s"
                                    repeatCount="indefinite"
                                    begin={line.delay}
                                />
                            </line>
                        ))}
                    </svg>
                </div>

                {/* Service Labels */}
                <div className={`grid grid-cols-2 gap-2 text-xs ${styles.labels} mt-4`}>
                    {services.map((service) => (
                        <div key={service.name} className="flex items-center">
                            <div className={`w-2 h-2 ${service.color} rounded-full mr-2`} />
                            {service.name}
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating Performance Cards */}
            {performanceCards.map((card, index) => (
                <div
                    key={index}
                    className={`absolute ${card.position} bg-gradient-to-r ${card.colors} text-white p-3 rounded-xl shadow-xl`}
                >
                    <div className="text-center">
                        <div className="text-lg font-bold">{card.value}</div>
                        <div className="text-xs opacity-90">{card.label}</div>
                    </div>
                </div>
            ))}

            {/* Floating Security Icons */}
            <div className={`absolute top-2 left-2 ${styles.iconBg('green')} text-white p-2 rounded-full shadow-lg animate-bounce`}>
                <Shield className="w-4 h-4" />
            </div>
            <div
                className={`absolute bottom-2 right-2 ${styles.iconBg('blue')} text-white p-2 rounded-full shadow-lg animate-bounce`}
                style={{ animationDelay: '1s' }}
            >
                <Server className="w-4 h-4" />
            </div>

            {/* Background Glow */}
            <div className={`absolute inset-0 bg-gradient-to-r ${styles.glow} rounded-3xl -z-10 transform scale-110 opacity-40 blur-sm`} />
        </div>
    );
}
