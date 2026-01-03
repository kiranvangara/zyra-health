import { Preferences } from '@capacitor/preferences';

const CapacitorStorage = {
    getItem: async (key: string): Promise<string | null> => {
        try {
            const { value } = await Preferences.get({ key });
            console.log(`[CapacitorStorage] Get ${key}:`, value ? 'Found' : 'Null');
            return value;
        } catch (e) {
            console.error('[CapacitorStorage] Get Error', e);
            return null;
        }
    },
    setItem: async (key: string, value: string): Promise<void> => {
        console.log(`[CapacitorStorage] Set ${key}`);
        await Preferences.set({ key, value });
    },
    removeItem: async (key: string): Promise<void> => {
        console.log(`[CapacitorStorage] Remove ${key}`);
        await Preferences.remove({ key });
    },
};

export default CapacitorStorage;
