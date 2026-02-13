import { generatePrescriptionPDF } from '../app/utils/generatePrescriptionPDF';
import jsPDF from 'jspdf';

// Mock jsPDF
const mockJsPDFInstance = {
    internal: {
        pageSize: {
            getWidth: jest.fn().mockReturnValue(210),
            getHeight: jest.fn().mockReturnValue(297),
        },
    },
    setFillColor: jest.fn(),
    rect: jest.fn(),
    setTextColor: jest.fn(),
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    text: jest.fn(),
    setDrawColor: jest.fn(),
    line: jest.fn(),
    splitTextToSize: jest.fn().mockReturnValue(['line1', 'line2']),
    save: jest.fn(),
};

jest.mock('jspdf', () => {
    return {
        __esModule: true,
        default: jest.fn(() => mockJsPDFInstance),
    };
});

describe('generatePrescriptionPDF', () => {
    it('should generate PDF with correct details', () => {
        const mockPrescription = {
            id: 'presc-123',
            created_at: '2024-01-01T10:00:00Z',
            medications: [
                { name: 'Med A', frequency: 'Twice daily', duration: '5 days' },
                { name: 'Med B', frequency: 'Once daily', duration: '10 days' },
            ],
            advice: 'Drink water',
            appointment: {
                doctor_name: 'Smith',
                scheduled_at: '2024-01-01T09:00:00Z',
            },
            patient_name: 'John Doe',
        };

        generatePrescriptionPDF(mockPrescription);

        // Verify header
        expect(mockJsPDFInstance.text).toHaveBeenCalledWith('Medivera', 20, 25);

        // Verify doctor name
        expect(mockJsPDFInstance.text).toHaveBeenCalledWith('Dr. Smith', 20, 55);

        // Verify medications
        expect(mockJsPDFInstance.text).toHaveBeenCalledWith('Med A', 20, expect.any(Number));
        expect(mockJsPDFInstance.text).toHaveBeenCalledWith('Twice daily', 100, expect.any(Number));

        // Verify Advice
        expect(mockJsPDFInstance.text).toHaveBeenCalledWith('Advice / Instructions', 20, expect.any(Number));

        // Verify Save
        expect(mockJsPDFInstance.save).toHaveBeenCalledWith(expect.stringContaining('Prescription_2024-01-01'));
    });
});
