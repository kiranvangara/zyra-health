import { getDoctorSlots } from '../app/actions/availability';
import { supabase } from '../app/utils/supabase';

// Mock Supabase
jest.mock('../app/utils/supabase', () => ({
    supabase: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        single: jest.fn(),
    }
}));

describe('getDoctorSlots', () => {
    const mockDoctorId = 'doc-123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return error if doctor not found', async () => {
        // Mock doctor fetch returning null
        (supabase.from('doctors').select('...').eq('...').single as jest.Mock).mockResolvedValueOnce({
            data: null,
            error: { message: 'Not found' }
        });

        const result = await getDoctorSlots(mockDoctorId);
        expect(result.error).toBe('Doctor not found');
        expect(result.slots).toEqual([]);
    });

    it('should return available slots based on schedule', async () => {
        const mockDoctor = {
            weekly_schedule: {
                mon: [{ start: '09:00', end: '10:00' }] // 2 slots: 09:00, 09:30
            },
            time_zone: 'UTC',
            consultation_fee: 100
        };

        // Date: Mon 08:00
        jest.useFakeTimers().setSystemTime(new Date('2024-01-01T08:00:00Z'));

        (supabase.from as jest.Mock).mockImplementation((table) => {
            const mockChain: any = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                or: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lte: jest.fn().mockReturnThis(),
                single: jest.fn(),
                then: (resolve: any) => resolve({ data: [], error: null }) // Default resolved value
            };

            if (table === 'doctors') {
                mockChain.select = jest.fn().mockReturnValue(mockChain);
                mockChain.eq = jest.fn().mockReturnValue(mockChain);
                mockChain.single.mockResolvedValue({ data: mockDoctor, error: null });
            }
            return mockChain;
        });

        const result = await getDoctorSlots(mockDoctorId);

        expect(result.error).toBeNull();
        expect(result.slots).toContain('2024-01-01T09:00:00.000Z');
        expect(result.slots).toContain('2024-01-01T09:30:00.000Z');
        expect(result.slots.length).toBe(2);

        jest.useRealTimers();
    });

    it('should filter out booked slots', async () => {
        const mockDoctor = {
            weekly_schedule: {
                mon: [{ start: '09:00', end: '10:00' }]
            },
            time_zone: 'UTC'
        };

        jest.useFakeTimers().setSystemTime(new Date('2024-01-01T08:00:00Z'));

        (supabase.from as jest.Mock).mockImplementation((table) => {
            const mockChain: any = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                or: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lte: jest.fn().mockReturnThis(),
                single: jest.fn(),
                then: (resolve: any) => resolve({ data: [], error: null })
            };

            if (table === 'doctors') {
                mockChain.select = jest.fn().mockReturnValue(mockChain);
                mockChain.eq = jest.fn().mockReturnValue(mockChain);
                mockChain.single.mockResolvedValue({ data: mockDoctor, error: null });
                return mockChain;
            }

            if (table === 'appointments') {
                mockChain.then = (resolve: any) => resolve({
                    data: [{ scheduled_at: '2024-01-01T09:00:00.000Z', status: 'confirmed' }],
                    error: null
                });
                return mockChain;
            }

            return mockChain;
        });

        const result = await getDoctorSlots(mockDoctorId);
        expect(result.slots).not.toContain('2024-01-01T09:00:00.000Z'); // Booked
        expect(result.slots).toContain('2024-01-01T09:30:00.000Z'); // Free

        jest.useRealTimers();
    });

    it('should filter out blocked slots (overrides)', async () => {
        const mockDoctor = {
            weekly_schedule: {
                mon: [{ start: '09:00', end: '10:00' }]
            },
            time_zone: 'UTC'
        };

        jest.useFakeTimers().setSystemTime(new Date('2024-01-01T08:00:00Z'));

        (supabase.from as jest.Mock).mockImplementation((table) => {
            const mockChain: any = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                or: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lte: jest.fn().mockReturnThis(),
                single: jest.fn(),
                then: (resolve: any) => resolve({ data: [], error: null })
            };

            if (table === 'doctors') {
                mockChain.single.mockResolvedValue({ data: mockDoctor, error: null });
                return mockChain;
            }

            if (table === 'doctor_overrides') {
                mockChain.then = (resolve: any) => resolve({
                    data: [{
                        start_time: '2024-01-01T09:00:00.000Z',
                        end_time: '2024-01-01T09:30:00.000Z'
                    }],
                    error: null
                });
                return mockChain;
            }

            return mockChain;
        });

        const result = await getDoctorSlots(mockDoctorId);
        expect(result.slots).not.toContain('2024-01-01T09:00:00.000Z'); // Blocked
        expect(result.slots).toContain('2024-01-01T09:30:00.000Z'); // Free

        jest.useRealTimers();
    });

    it('should filter out past slots', async () => {
        const mockDoctor = {
            weekly_schedule: {
                mon: [{ start: '09:00', end: '10:00' }]
            },
            time_zone: 'UTC'
        };

        // Mock Date: Mon 09:15
        // 09:00 slot is in past. 09:30 is future.
        jest.useFakeTimers().setSystemTime(new Date('2024-01-01T09:15:00Z'));

        (supabase.from as jest.Mock).mockImplementation((table) => {
            const mockChain: any = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                or: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lte: jest.fn().mockReturnThis(),
                single: jest.fn(),
                then: (resolve: any) => resolve({ data: [], error: null })
            };

            if (table === 'doctors') {
                mockChain.single.mockResolvedValue({ data: mockDoctor, error: null });
                return mockChain;
            }
            return mockChain;
        });

        const result = await getDoctorSlots(mockDoctorId);
        expect(result.slots).not.toContain('2024-01-01T09:00:00.000Z'); // Past
        expect(result.slots).toContain('2024-01-01T09:30:00.000Z'); // Future

        jest.useRealTimers();
    });

    it('should fallback to UTC if doctor has no timezone', async () => {
        const mockDoctor = {
            weekly_schedule: {
                mon: [{ start: '09:00', end: '10:00' }]
            },
            time_zone: null, // Test fallback
            consultation_fee: 100
        };

        jest.useFakeTimers().setSystemTime(new Date('2024-01-01T08:00:00Z'));

        (supabase.from as jest.Mock).mockImplementation((table) => {
            const mockChain: any = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                or: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lte: jest.fn().mockReturnThis(),
                single: jest.fn(),
                then: (resolve: any) => resolve({ data: [], error: null })
            };

            if (table === 'doctors') {
                mockChain.single.mockResolvedValue({ data: mockDoctor, error: null });
                return mockChain;
            }
            return mockChain;
        });

        const result = await getDoctorSlots(mockDoctorId);

        expect(result.error).toBeNull();
        expect(result.slots[0]).toContain('2024-01-01T09:00:00.000Z');

        jest.useRealTimers();
    });
});
