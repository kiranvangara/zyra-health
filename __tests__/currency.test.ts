import { formatPrice, getDisplayFee } from '../app/utils/currency';

describe('Currency Utilities', () => {

    describe('formatPrice', () => {
        it('should format INR correctly', () => {
            expect(formatPrice(1000, 'INR')).toBe('₹1,000');
        });

        it('should convert INR to USD when currency is USD', () => {
            // 830 INR / 83 = 10 USD
            expect(formatPrice(830, 'USD')).toBe('$10');
        });

        it('should round up USD conversion', () => {
            // 100 INR / 83 = 1.20... -> 2 USD
            expect(formatPrice(100, 'USD')).toBe('$2');
        });
    });

    describe('getDisplayFee', () => {
        it('should prefer explicit USD fee if available', () => {
            const result = getDisplayFee(1000, 'USD', 50);
            expect(result).toBe('$50'); // Should ignore the conversion (1000/83 ~ 12)
        });

        it('should fallback to conversion if no explicit USD fee', () => {
            const result = getDisplayFee(830, 'USD', undefined);
            expect(result).toBe('$10');
        });

        it('should always show INR if currency is INR', () => {
            const result = getDisplayFee(1000, 'INR', 50);
            expect(result).toBe('₹1,000');
        });
    });
});
