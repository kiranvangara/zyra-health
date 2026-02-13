import CapacitorStorage from '../app/utils/capacitorStorage';
import { Preferences } from '@capacitor/preferences';

// Mock Capacitor Preferences
jest.mock('@capacitor/preferences', () => ({
    Preferences: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
    }
}));

describe('CapacitorStorage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should get an item successfully', async () => {
        (Preferences.get as jest.Mock).mockResolvedValue({ value: 'some-value' });
        const result = await CapacitorStorage.getItem('test-key');
        expect(Preferences.get).toHaveBeenCalledWith({ key: 'test-key' });
        expect(result).toBe('some-value');
    });

    it('should return null if item not found', async () => {
        (Preferences.get as jest.Mock).mockResolvedValue({ value: null });
        const result = await CapacitorStorage.getItem('missing-key');
        expect(result).toBeNull();
    });

    it('should return null on error during get', async () => {
        (Preferences.get as jest.Mock).mockRejectedValue(new Error('Storage error'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        const result = await CapacitorStorage.getItem('error-key');

        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('should set an item successfully', async () => {
        await CapacitorStorage.setItem('key', 'value');
        expect(Preferences.set).toHaveBeenCalledWith({ key: 'key', value: 'value' });
    });

    it('should remove an item successfully', async () => {
        await CapacitorStorage.removeItem('key');
        expect(Preferences.remove).toHaveBeenCalledWith({ key: 'key' });
    });
});
