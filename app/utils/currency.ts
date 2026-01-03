export const formatPrice = (amount: number, currency: 'INR' | 'USD' = 'INR'): string => {
    if (currency === 'USD') {
        const usdAmount = Math.ceil(amount / 83); // Simple static conversion for now
        return `$${usdAmount}`;
    }
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

export const getDisplayFee = (
    baseFeeInr: number,
    currency: 'INR' | 'USD',
    explicitUsdFee?: number
): string => {
    if (currency === 'USD') {
        const fee = explicitUsdFee || Math.ceil(baseFeeInr / 83);
        return `$${fee}`;
    }
    return formatPrice(baseFeeInr, 'INR');
};
