import { getSpecializationForSymptom } from '../utils/symptomMappings';

describe('Symptom Mappings', () => {

    it('should return correct specialization for direct matches', () => {
        expect(getSpecializationForSymptom('heart')).toBe('Cardiology');
        expect(getSpecializationForSymptom('skin')).toBe('Dermatology');
        expect(getSpecializationForSymptom('depression')).toBe('Psychiatry');
    });

    it('should be case insensitive', () => {
        expect(getSpecializationForSymptom('Heart')).toBe('Cardiology');
        expect(getSpecializationForSymptom('SKIN')).toBe('Dermatology');
    });

    it('should handle partial matches', () => {
        expect(getSpecializationForSymptom('severe chest pain')).toBe('Cardiology');
        expect(getSpecializationForSymptom('bad headache')).toBe('General Physician');
    });

    it('should return null for unknown symptoms', () => {
        expect(getSpecializationForSymptom('random term')).toBeNull();
        expect(getSpecializationForSymptom('')).toBeNull();
    });

    it('should map fallback organs to General Physician', () => {
        expect(getSpecializationForSymptom('stomach ache')).toBe('General Physician');
        expect(getSpecializationForSymptom('kidney stone')).toBe('General Physician');
    });
});
