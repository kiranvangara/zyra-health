'use client';

import { useState } from 'react';
import posthog from 'posthog-js';
import { X } from 'lucide-react';

interface SurveyOption {
    value: string;
    label: string;
    emoji?: string;
}

interface MicroSurveyProps {
    surveyId: string;          // Unique ID for PostHog tracking
    question: string;          // The question to ask
    options: SurveyOption[];   // Answer options
    onDismiss: () => void;     // Called when dismissed
    onSubmit?: (value: string) => void; // Optional callback
    context?: Record<string, any>;     // Extra PostHog properties
}

export default function MicroSurvey({ surveyId, question, options, onDismiss, onSubmit, context = {} }: MicroSurveyProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleSelect = (value: string) => {
        setSelected(value);
        setSubmitted(true);

        posthog.capture('micro_survey_responded', {
            survey_id: surveyId,
            question,
            response: value,
            ...context,
        });

        onSubmit?.(value);

        // Auto-dismiss after 1.5s with thank-you
        setTimeout(() => onDismiss(), 1500);
    };

    const handleDismiss = () => {
        posthog.capture('micro_survey_dismissed', {
            survey_id: surveyId,
            question,
            ...context,
        });
        onDismiss();
    };

    return (
        <div style={{
            position: 'fixed', bottom: '80px', left: '16px', right: '16px',
            background: 'white', borderRadius: '20px', padding: '20px',
            boxShadow: '0 10px 40px -5px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
            zIndex: 90, animation: 'slideUp 0.3s ease-out',
        }}>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>

            <button
                onClick={handleDismiss}
                style={{
                    position: 'absolute', top: '12px', right: '12px',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    color: '#94A3B8',
                }}
            >
                <X size={18} />
            </button>

            {submitted ? (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🙏</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Thanks for your feedback!</div>
                </div>
            ) : (
                <>
                    <div style={{
                        fontSize: '15px', fontWeight: '600', color: '#0F172A',
                        marginBottom: '16px', paddingRight: '24px', lineHeight: '1.4',
                    }}>
                        {question}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {options.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => handleSelect(opt.value)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '12px 16px', borderRadius: '12px',
                                    border: '1px solid #E2E8F0', background: '#F8FAFC',
                                    cursor: 'pointer', fontSize: '14px', color: '#334155',
                                    fontWeight: '500', textAlign: 'left',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                {opt.emoji && <span style={{ fontSize: '18px' }}>{opt.emoji}</span>}
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
