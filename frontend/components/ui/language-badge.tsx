'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';
import { useTransition } from 'react';

const languages = (t: (key: string) => string) => {
    return [
        { code: 'en', name: t('en'), flag: '🇺🇸', shortName: 'EN' },
        { code: 'vi', name: t('vi'), flag: '🇻🇳', shortName: 'VI' }
    ]
};

export function LanguageBadge({
    activeTab
}: {
    activeTab: (tab: string) => void;
}) {
    const locale = useLocale();
    const t = useTranslations('language');

    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const currentLanguage = languages(t).find(lang => lang.code === locale);

    const handleLanguageChange = (newLocale: string) => {
        startTransition(() => {
            localStorage.setItem('locale', newLocale);
            document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

            const pathWithoutLocale = pathname.startsWith(`/${locale}`)
                ? pathname.substring(locale.length + 1)
                : pathname;

            const newPath = `/${newLocale}${pathWithoutLocale}`;
            activeTab(newPath);
            router.replace(newPath);
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-sm font-medium"
                    disabled={isPending}
                >
                    {isPending ? (
                        <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3" />
                            <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3" />
                            <span className="text-xs">{currentLanguage?.shortName || 'EN'}</span>
                        </div>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-[180px]">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    {t('select_language')}
                </div>
                {languages(t).map((language) => (
                    <DropdownMenuItem
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        className="flex items-center justify-between cursor-pointer py-2"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-base">{language.flag}</span>
                            <span className="font-medium">{language.name}</span>
                        </div>
                        {locale === language.code && (
                            <Check className="h-4 w-4 text-primary" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
