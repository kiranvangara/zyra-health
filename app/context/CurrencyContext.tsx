'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Currency = 'INR' | 'USD';

interface CurrencyContextType {
    currency: Currency;
    loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType>({
    currency: 'INR',
    loading: true,
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
    const [currency, setCurrency] = useState<Currency>('INR');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const detectLocation = async () => {
            try {
                // Check if already stored in session
                const cached = sessionStorage.getItem('medivera_currency');
                if (cached === 'USD' || cached === 'INR') {
                    setCurrency(cached);
                    setLoading(false);
                    return;
                }

                // Fetch location
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();

                const detectedCurrency = data.country_code === 'US' ? 'USD' : 'INR';

                setCurrency(detectedCurrency);
                sessionStorage.setItem('medivera_currency', detectedCurrency);
            } catch (error) {
                console.error('Error detecting location:', error);
                // Default to INR
                setCurrency('INR');
            } finally {
                setLoading(false);
            }
        };

        detectLocation();
    }, []);

    return (
        <CurrencyContext.Provider value={{ currency, loading }}>
            {children}
        </CurrencyContext.Provider>
    );
};
