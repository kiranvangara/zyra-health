// Multi-Dimensional Review System — Shared Constants
// Question pool, emoji scale, and adjective mappings

export const REVIEW_QUESTIONS = [
    {
        key: 'communication',
        question: 'How clearly did the doctor explain things?',
        adjectiveHigh: 'an excellent communicator',
        adjectiveMedium: 'a clear communicator',
    },
    {
        key: 'expertise',
        question: 'How knowledgeable did the doctor seem?',
        adjectiveHigh: 'highly knowledgeable',
        adjectiveMedium: 'knowledgeable',
    },
    {
        key: 'punctuality',
        question: 'Did the consultation start on time?',
        adjectiveHigh: 'very punctual',
        adjectiveMedium: 'punctual',
    },
    {
        key: 'empathy',
        question: 'Did the doctor understand your concerns?',
        adjectiveHigh: 'very empathetic',
        adjectiveMedium: 'understanding',
    },
    {
        key: 'listening',
        question: 'Did the doctor listen to you carefully?',
        adjectiveHigh: 'an attentive listener',
        adjectiveMedium: 'a good listener',
    },
    {
        key: 'patience',
        question: 'Did the doctor take enough time with you?',
        adjectiveHigh: 'very patient and thorough',
        adjectiveMedium: 'thorough',
    },
    {
        key: 'rx_clarity',
        question: 'Were the medication instructions clear?',
        adjectiveHigh: 'very clear with prescriptions',
        adjectiveMedium: 'clear with instructions',
    },
    {
        key: 'professionalism',
        question: 'How professional was the experience?',
        adjectiveHigh: 'highly professional',
        adjectiveMedium: 'professional',
    },
] as const;

export type QuestionKey = typeof REVIEW_QUESTIONS[number]['key'];

export const EMOJI_SCALE = [
    { value: 1, emoji: '😞', label: 'Bad' },
    { value: 2, emoji: '😕', label: 'Below Avg' },
    { value: 3, emoji: '😐', label: 'Okay' },
    { value: 4, emoji: '🙂', label: 'Good' },
    { value: 5, emoji: '🤩', label: 'Great' },
] as const;

/**
 * Select 3 questions: 2 random + 1 least-answered for even distribution.
 * @param questionCounts - Map of question_key → number of responses for this doctor
 */
export function selectQuestions(questionCounts: Record<string, number> = {}) {
    const allKeys = REVIEW_QUESTIONS.map(q => q.key);

    // Find the least-answered question
    let leastKey = allKeys[0];
    let leastCount = questionCounts[leastKey] ?? 0;
    for (const key of allKeys) {
        const count = questionCounts[key] ?? 0;
        if (count < leastCount) {
            leastCount = count;
            leastKey = key;
        }
    }

    // Pick 2 random from the remaining 7
    const remaining = allKeys.filter(k => k !== leastKey);
    const shuffled = remaining.sort(() => Math.random() - 0.5);
    const randomTwo = shuffled.slice(0, 2);

    // Combine and shuffle final 3 so the "least" one isn't always last
    const selected = [leastKey, ...randomTwo].sort(() => Math.random() - 0.5);

    return selected.map(key => REVIEW_QUESTIONS.find(q => q.key === key)!);
}

/**
 * Build the adjective sentence for a doctor's profile.
 * Only includes dimensions with 5+ responses and average score >= 3.
 * @param aggregated - Map of question_key → { avg: number, count: number }
 */
export function buildAdjectiveSentence(
    aggregated: Record<string, { avg: number; count: number }>,
    doctorName: string
): string | null {
    const qualifying = REVIEW_QUESTIONS
        .map(q => {
            const data = aggregated[q.key];
            if (!data || data.count < 5 || data.avg < 3) return null;
            const adjective = data.avg >= 4 ? q.adjectiveHigh : q.adjectiveMedium;
            return { key: q.key, adjective, avg: data.avg };
        })
        .filter(Boolean) as { key: string; adjective: string; avg: number }[];

    // Sort by average score descending, take top 3
    qualifying.sort((a, b) => b.avg - a.avg);
    const top = qualifying.slice(0, 3);

    if (top.length === 0) return null;

    if (top.length === 1) {
        return `Patients describe ${doctorName} as ${top[0].adjective}.`;
    }
    if (top.length === 2) {
        return `Patients describe ${doctorName} as ${top[0].adjective} and ${top[1].adjective}.`;
    }
    return `Patients describe ${doctorName} as ${top[0].adjective}, ${top[1].adjective}, and ${top[2].adjective}.`;
}
