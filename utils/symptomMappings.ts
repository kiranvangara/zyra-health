export const symptomMappings: Record<string, string> = {
    // Cardiology
    'heart': 'Cardiology',
    'chest pain': 'Cardiology',
    'palpitations': 'Cardiology',
    'bp': 'Cardiology',
    'blood pressure': 'Cardiology',

    // Dermatology
    'skin': 'Dermatology',
    'rash': 'Dermatology',
    'acne': 'Dermatology',
    'hair': 'Dermatology',
    'hair loss': 'Dermatology',

    // Orthopedics
    'bone': 'Orthopedics',
    'joint': 'Orthopedics',
    'knee': 'Orthopedics',
    'back pain': 'Orthopedics',
    'fracture': 'Orthopedics',

    // General Medicine
    'fever': 'General Physician',
    'cold': 'General Physician',
    'flu': 'General Physician',
    'headache': 'General Physician',
    'weakness': 'General Physician',

    // Pediatrics
    'child': 'Pediatrics',
    'baby': 'Pediatrics',
    'vaccination': 'Pediatrics',

    // Gynecology
    'period': 'Gynecology',
    'pregnancy': 'Gynecology',
    'women': 'Gynecology',

    // Neurology
    'brain': 'Neurology',
    'nerves': 'Neurology',
    'seizure': 'Neurology',

    // Psychiatry
    'mental': 'Psychiatry',
    'depression': 'Psychiatry',
    'anxiety': 'Psychiatry',
    'stress': 'Psychiatry',

    // Matches for General Physician (fallback for organs not covered)
    'kidney': 'General Physician',
    'stomach': 'General Physician',
    'liver': 'General Physician'
};

export const getSpecializationForSymptom = (term: string): string | null => {
    const lowerTerm = term.toLowerCase();

    // Direct match
    if (symptomMappings[lowerTerm]) {
        return symptomMappings[lowerTerm];
    }

    // Partial match (e.g. "severe headache" -> matches "headache")
    const foundKey = Object.keys(symptomMappings).find(key => lowerTerm.includes(key));
    return foundKey ? symptomMappings[foundKey] : null;
};
