'use client';

import { colorsHex } from '@/utils/color';
import { ProgressProvider } from '@bprogress/next/app';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const BProgressProviders = ({
    children
}: {
    children: React.ReactNode
}) => {
    const { resolvedTheme } = useTheme()
    const [theme, setTheme] = useState('')

    useEffect(() => {
        if (resolvedTheme) {
            setTheme(resolvedTheme as string)
        }
    }, [resolvedTheme]);

    return (
        <ProgressProvider
            height="4px"
            color={`${theme === 'dark' ? `rgb(${colorsHex.gold})` : `rgb(${colorsHex.purple})`}`}
            options={{ showSpinner: false }}
            shallowRouting
        >
            {children}
        </ProgressProvider>
    );
};

export default BProgressProviders;