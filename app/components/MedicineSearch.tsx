'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

interface MedicineResult {
    id: number;
    name: string;
    composition: string;
    manufacturer: string | null;
    packSize: string | null;
    price: number | null;
}

interface MedicineSearchProps {
    value: string;
    onSelect: (medicine: { name: string; composition: string }) => void;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function MedicineSearch({ value, onSelect, onChange, placeholder = 'Search medicine...' }: MedicineSearchProps) {
    const [results, setResults] = useState<MedicineResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const searchMedicines = useCallback(async (query: string) => {
        if (query.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('medicines')
                .select('id, name, short_composition1, short_composition2, manufacturer_name, pack_size_label, price')
                .ilike('name', `%${query}%`)
                .eq('is_discontinued', false)
                .order('name')
                .limit(10);

            if (error) throw error;

            const mapped: MedicineResult[] = (data || []).map(med => ({
                id: med.id,
                name: med.name,
                composition: [med.short_composition1, med.short_composition2]
                    .filter(Boolean)
                    .join(' + '),
                manufacturer: med.manufacturer_name,
                packSize: med.pack_size_label,
                price: med.price,
            }));

            setResults(mapped);
            setIsOpen(mapped.length > 0);
            setHighlightedIndex(-1);
        } catch (err) {
            console.error('Medicine search failed:', err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchMedicines(val), 300);
    };

    const handleSelect = (medicine: MedicineResult) => {
        onSelect({
            name: medicine.name,
            composition: medicine.composition,
        });
        setIsOpen(false);
        setResults([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        } else if (e.key === 'Enter' && highlightedIndex >= 0) {
            e.preventDefault();
            handleSelect(results[highlightedIndex]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current && !inputRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightedIndex >= 0 && dropdownRef.current) {
            const items = dropdownRef.current.querySelectorAll('[data-medicine-item]');
            items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightedIndex]);

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
                <input
                    ref={inputRef}
                    type="text"
                    className="input-box"
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { if (results.length > 0) setIsOpen(true); }}
                    placeholder={placeholder}
                    autoComplete="off"
                    style={{ paddingRight: loading ? '36px' : undefined }}
                />
                {loading && (
                    <div style={{
                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                        width: '16px', height: '16px', border: '2px solid #ddd',
                        borderTopColor: '#0070f3', borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite',
                    }} />
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div
                    ref={dropdownRef}
                    style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: 'white', borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        border: '1px solid #e0e0e0', zIndex: 1000,
                        maxHeight: '260px', overflowY: 'auto',
                        marginTop: '4px',
                    }}
                >
                    {results.map((med, index) => (
                        <div
                            key={med.id}
                            data-medicine-item
                            onClick={() => handleSelect(med)}
                            style={{
                                padding: '10px 12px', cursor: 'pointer',
                                borderBottom: index < results.length - 1 ? '1px solid #f0f0f0' : 'none',
                                background: highlightedIndex === index ? '#f0f7ff' : 'white',
                                transition: 'background 0.1s',
                            }}
                            onMouseEnter={() => setHighlightedIndex(index)}
                        >
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>
                                {med.name}
                            </div>
                            {med.composition && (
                                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                    {med.composition}
                                </div>
                            )}
                            <div style={{ fontSize: '10px', color: '#999', marginTop: '2px', display: 'flex', gap: '8px' }}>
                                {med.packSize && <span>{med.packSize}</span>}
                                {med.manufacturer && <span>• {med.manufacturer}</span>}
                                {med.price && <span>• ₹{med.price}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                @keyframes spin {
                    to { transform: translateY(-50%) rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
