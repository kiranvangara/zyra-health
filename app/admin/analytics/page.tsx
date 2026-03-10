'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAnalyticsData } from '../analytics-actions';
import { verifyAdminSession } from '../actions';
import { REVIEW_QUESTIONS } from '../../utils/reviewConstants';

export default function AnalyticsDashboard() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'observability'>('overview');

    useEffect(() => {
        const init = async () => {
            const isAdmin = await verifyAdminSession();
            if (!isAdmin) { router.push('/admin/login'); return; }
            const result = await getAnalyticsData();
            if (result.error) { setError(result.error); }
            else { setData(result); }
            setLoading(false);
        };
        init();
    }, []);

    if (loading) return <div style={styles.loadingContainer}><div style={styles.spinner} /><p style={{ color: '#64748B' }}>Loading analytics...</p></div>;
    if (error) return <div style={{ padding: '40px', color: '#EF4444' }}>Error: {error}</div>;
    if (!data) return null;

    const { kpis, dailyTrends, funnel, doctorPerformance, specialtyDemand, reviewSentiment, observability } = data;

    // Compute trend sparkline data
    const trendDates = Object.keys(dailyTrends).sort();
    const maxBooking = Math.max(...trendDates.map(d => dailyTrends[d].bookings), 1);

    const tabs = [
        { key: 'overview', label: '📊 Overview' },
        { key: 'doctors', label: '👨‍⚕️ Doctors' },
        { key: 'observability', label: '🔍 Health' },
    ] as const;

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Product Analytics</h1>
                    <p style={styles.subtitle}>Real-time business metrics from Supabase</p>
                </div>
                <button onClick={() => router.push('/admin')} style={styles.backBtn}>← Back</button>
            </div>

            {/* Tab Navigation */}
            <div style={styles.tabBar}>
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            ...styles.tab,
                            ...(activeTab === tab.key ? styles.tabActive : {}),
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <>
                    {/* ─── KPI Cards ─── */}
                    <div style={styles.kpiGrid}>
                        <KPICard label="Patients" value={kpis.totalPatients} icon="👥" color="#3B82F6" />
                        <KPICard label="Consultations" value={kpis.completedConsultations} sub={`of ${kpis.totalAppointments} booked`} icon="📞" color="#10B981" />
                        <KPICard label="Revenue" value={`₹${kpis.totalRevenue.toLocaleString('en-IN')}`} icon="💰" color="#F59E0B" />
                        <KPICard label="Doctors" value={kpis.verifiedDoctors} sub={`${kpis.totalDoctors} total`} icon="👨‍⚕️" color="#8B5CF6" />
                        <KPICard label="Prescriptions" value={kpis.totalPrescriptions} icon="💊" color="#EC4899" />
                        <KPICard label="Reviews" value={kpis.approvedReviews} sub={`${kpis.totalReviews} total`} icon="⭐" color="#06B6D4" />
                    </div>

                    {/* ─── Activity Trend (30d) ─── */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>📈 Activity (Last 30 Days)</h3>
                        <div style={styles.chartContainer}>
                            <div style={styles.barChart}>
                                {trendDates.map((date, i) => {
                                    const d = dailyTrends[date];
                                    const h = Math.max((d.bookings / maxBooking) * 100, 4);
                                    const isToday = date === new Date().toISOString().split('T')[0];
                                    return (
                                        <div key={date} style={styles.barCol} title={`${date}\n${d.bookings} bookings\n${d.completions} completed\n${d.signups} signups`}>
                                            <div style={{
                                                ...styles.bar,
                                                height: `${h}%`,
                                                background: isToday
                                                    ? 'linear-gradient(180deg, #3B82F6, #2563EB)'
                                                    : d.bookings > 0
                                                        ? 'linear-gradient(180deg, #93C5FD, #60A5FA)'
                                                        : '#E2E8F0',
                                                opacity: isToday ? 1 : 0.8,
                                            }} />
                                            {i % 7 === 0 && (
                                                <div style={styles.barLabel}>
                                                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={styles.chartLegend}>
                                <span><span style={{ ...styles.legendDot, background: '#3B82F6' }} /> Bookings</span>
                                <span style={{ color: '#94A3B8', fontSize: '12px' }}>Hover bars for details</span>
                            </div>
                        </div>
                    </div>

                    {/* ─── Booking Funnel ─── */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>🔽 Conversion Funnel</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <FunnelStep label="Signed Up" value={funnel.signedUp} max={funnel.signedUp} color="#3B82F6" />
                            <FunnelStep label="Booked" value={funnel.booked} max={funnel.signedUp} color="#8B5CF6" pct={funnel.signedUp ? Math.round((funnel.booked / funnel.signedUp) * 100) : 0} />
                            <FunnelStep label="Completed" value={funnel.completed} max={funnel.signedUp} color="#10B981" pct={funnel.booked ? Math.round((funnel.completed / funnel.booked) * 100) : 0} />
                            <FunnelStep label="Reviewed" value={funnel.reviewed} max={funnel.signedUp} color="#F59E0B" pct={funnel.completed ? Math.round((funnel.reviewed / funnel.completed) * 100) : 0} />
                            <FunnelStep label="Prescribed" value={funnel.prescribed} max={funnel.signedUp} color="#EC4899" pct={funnel.completed ? Math.round((funnel.prescribed / funnel.completed) * 100) : 0} />
                        </div>
                    </div>

                    {/* ─── Specialty Demand ─── */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>📋 Specialty Demand vs Supply</h3>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Specialty</th>
                                    <th style={{ ...styles.th, textAlign: 'center' }}>Doctors</th>
                                    <th style={{ ...styles.th, textAlign: 'center' }}>Bookings</th>
                                    <th style={{ ...styles.th, textAlign: 'center' }}>Completed</th>
                                    <th style={{ ...styles.th, textAlign: 'center' }}>Demand/Doc</th>
                                </tr>
                            </thead>
                            <tbody>
                                {specialtyDemand.map((spec: any) => (
                                    <tr key={spec.name}>
                                        <td style={styles.td}><strong>{spec.name}</strong></td>
                                        <td style={{ ...styles.td, textAlign: 'center' }}>{spec.doctors}</td>
                                        <td style={{ ...styles.td, textAlign: 'center' }}>{spec.bookings}</td>
                                        <td style={{ ...styles.td, textAlign: 'center' }}>{spec.completed}</td>
                                        <td style={{ ...styles.td, textAlign: 'center' }}>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: '600',
                                                background: (spec.bookings / spec.doctors) > 5 ? '#FEF2F2' : '#F0FDF4',
                                                color: (spec.bookings / spec.doctors) > 5 ? '#DC2626' : '#16A34A',
                                            }}>
                                                {spec.doctors > 0 ? (spec.bookings / spec.doctors).toFixed(1) : '—'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {specialtyDemand.length === 0 && (
                                    <tr><td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#94A3B8' }}>No data yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ─── Review Sentiment ─── */}
                    {reviewSentiment.length > 0 && (
                        <div style={styles.card}>
                            <h3 style={styles.cardTitle}>💬 Review Sentiment by Dimension</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                {reviewSentiment.map((dim: any) => {
                                    const question = REVIEW_QUESTIONS.find(q => q.key === dim.dimension);
                                    const emoji = dim.avgScore >= 4 ? '😊' : dim.avgScore >= 3 ? '🙂' : dim.avgScore >= 2 ? '😐' : '😞';
                                    return (
                                        <div key={dim.dimension} style={{
                                            padding: '14px', background: '#F8FAFC', borderRadius: '12px',
                                            border: '1px solid #E2E8F0',
                                        }}>
                                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                                                {question?.emoji || '❓'} {question?.label || dim.dimension}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                                <span style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A' }}>
                                                    {dim.avgScore}
                                                </span>
                                                <span style={{ fontSize: '16px' }}>{emoji}</span>
                                                <span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: 'auto' }}>
                                                    {dim.responseCount} responses
                                                </span>
                                            </div>
                                            {/* Score bar */}
                                            <div style={{ height: '4px', background: '#E2E8F0', borderRadius: '2px', marginTop: '8px' }}>
                                                <div style={{
                                                    height: '100%', borderRadius: '2px',
                                                    width: `${(dim.avgScore / 5) * 100}%`,
                                                    background: dim.avgScore >= 4 ? '#10B981' : dim.avgScore >= 3 ? '#F59E0B' : '#EF4444',
                                                }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'doctors' && (
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>👨‍⚕️ Doctor Performance</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>#</th>
                                    <th style={styles.th}>Doctor</th>
                                    <th style={styles.th}>Specialty</th>
                                    <th style={{ ...styles.th, textAlign: 'center' }}>Bookings</th>
                                    <th style={{ ...styles.th, textAlign: 'center' }}>Completed</th>
                                    <th style={{ ...styles.th, textAlign: 'center' }}>Cancelled</th>
                                    <th style={{ ...styles.th, textAlign: 'center' }}>Avg Rating</th>
                                    <th style={{ ...styles.th, textAlign: 'center' }}>Rx Rate</th>
                                    <th style={{ ...styles.th, textAlign: 'right' }}>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {doctorPerformance.map((doc: any, i: number) => (
                                    <tr key={doc.id} style={{ background: i % 2 === 0 ? 'white' : '#F8FAFC' }}>
                                        <td style={{ ...styles.td, fontWeight: '700', color: '#94A3B8' }}>{i + 1}</td>
                                        <td style={{ ...styles.td, fontWeight: '600' }}>{doc.name}</td>
                                        <td style={styles.td}>
                                            <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '500' }}>
                                                {doc.specialization}
                                            </span>
                                        </td>
                                        <td style={{ ...styles.td, textAlign: 'center' }}>{doc.totalBookings}</td>
                                        <td style={{ ...styles.td, textAlign: 'center', fontWeight: '600', color: '#10B981' }}>{doc.completed}</td>
                                        <td style={{ ...styles.td, textAlign: 'center', color: doc.cancelled > 0 ? '#EF4444' : '#94A3B8' }}>{doc.cancelled}</td>
                                        <td style={{ ...styles.td, textAlign: 'center' }}>
                                            {doc.avgRating > 0 ? (
                                                <span>⭐ {doc.avgRating}</span>
                                            ) : (
                                                <span style={{ color: '#CBD5E1' }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ ...styles.td, textAlign: 'center' }}>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: '600',
                                                background: doc.rxRate >= 80 ? '#F0FDF4' : doc.rxRate >= 50 ? '#FFFBEB' : '#FEF2F2',
                                                color: doc.rxRate >= 80 ? '#16A34A' : doc.rxRate >= 50 ? '#D97706' : '#DC2626',
                                            }}>
                                                {doc.rxRate}%
                                            </span>
                                        </td>
                                        <td style={{ ...styles.td, textAlign: 'right', fontWeight: '600' }}>₹{doc.revenue.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                                {doctorPerformance.length === 0 && (
                                    <tr><td colSpan={9} style={{ ...styles.td, textAlign: 'center', color: '#94A3B8', padding: '30px' }}>No verified doctors yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'observability' && (
                <>
                    {/* ─── Platform Health ─── */}
                    <div style={styles.kpiGrid}>
                        <KPICard label="Completion Rate" value={`${observability.completionRate}%`} icon="✅" color="#10B981"
                            sub={observability.completionRate >= 80 ? 'Healthy' : 'Needs attention'} />
                        <KPICard label="Cancellation Rate" value={`${observability.cancellationRate}%`} icon="❌" color="#EF4444"
                            sub={observability.cancellationRate <= 15 ? 'Healthy' : 'High'} />
                        <KPICard label="Rx Rate" value={`${observability.rxCompletionRate}%`} icon="💊" color="#8B5CF6"
                            sub="of completed calls" />
                        <KPICard label="Review Rate" value={`${observability.reviewRate}%`} icon="⭐" color="#F59E0B"
                            sub="of completed calls" />
                    </div>

                    {/* ─── Failure Modes ─── */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>⚠️ Failure Modes</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                            <FailureCard label="No-Shows" value={observability.noShows} desc="Confirmed but never joined" severity={observability.noShows > 5 ? 'high' : 'low'} />
                            <FailureCard label="Window Shoppers" value={observability.windowShoppers} desc={`${observability.windowShopperRate}% of signups never booked`} severity={observability.windowShopperRate > 60 ? 'high' : observability.windowShopperRate > 30 ? 'mid' : 'low'} />
                            <FailureCard label="One-and-Done" value={observability.oneAndDone} desc="1 consultation, never returned" severity={observability.oneAndDone > 10 ? 'mid' : 'low'} />
                            <FailureCard label="Power Users" value={observability.powerUsers} desc="3+ consultations" severity="good" />
                        </div>
                    </div>

                    {/* ─── Action Items ─── */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>🔔 Action Items</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {observability.pendingDoctorApprovals > 0 && (
                                <ActionItem
                                    label={`${observability.pendingDoctorApprovals} doctor(s) awaiting verification`}
                                    action="Review"
                                    onClick={() => router.push('/admin/doctors')}
                                    severity="warning"
                                />
                            )}
                            {observability.pendingReviews > 0 && (
                                <ActionItem
                                    label={`${observability.pendingReviews} review(s) awaiting moderation`}
                                    action="Moderate"
                                    onClick={() => router.push('/admin/reviews')}
                                    severity="info"
                                />
                            )}
                            {observability.consentWithdrawn > 0 && (
                                <ActionItem
                                    label={`${observability.consentWithdrawn} patient(s) have withdrawn consent`}
                                    severity="warning"
                                />
                            )}
                            {observability.windowShopperRate > 50 && (
                                <ActionItem
                                    label={`High window-shopper rate (${observability.windowShopperRate}%) — consider onboarding flow improvements`}
                                    severity="info"
                                />
                            )}
                            {observability.pendingDoctorApprovals === 0 && observability.pendingReviews === 0 && observability.consentWithdrawn === 0 && (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#10B981', fontSize: '14px' }}>
                                    ✅ No pending action items
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── User Segments ─── */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>👤 User Segments</h3>
                        <div style={{ display: 'flex', gap: '4px', height: '40px', borderRadius: '8px', overflow: 'hidden' }}>
                            {(() => {
                                const total = kpis.totalPatients || 1;
                                const segments = [
                                    { label: 'Window Shoppers', count: observability.windowShoppers, color: '#CBD5E1' },
                                    { label: 'One-and-Done', count: observability.oneAndDone, color: '#FCD34D' },
                                    { label: 'Returning', count: Math.max(0, kpis.totalPatients - observability.windowShoppers - observability.oneAndDone - observability.powerUsers), color: '#60A5FA' },
                                    { label: 'Power Users', count: observability.powerUsers, color: '#34D399' },
                                ];
                                return segments.map(seg => (
                                    <div
                                        key={seg.label}
                                        title={`${seg.label}: ${seg.count} (${Math.round((seg.count / total) * 100)}%)`}
                                        style={{
                                            flex: seg.count,
                                            background: seg.color,
                                            minWidth: seg.count > 0 ? '4px' : '0',
                                            transition: 'flex 0.3s ease',
                                        }}
                                    />
                                ));
                            })()}
                        </div>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
                            {[
                                { label: 'Window Shoppers', color: '#CBD5E1', count: observability.windowShoppers },
                                { label: 'One-and-Done', color: '#FCD34D', count: observability.oneAndDone },
                                { label: 'Returning', color: '#60A5FA', count: Math.max(0, kpis.totalPatients - observability.windowShoppers - observability.oneAndDone - observability.powerUsers) },
                                { label: 'Power Users', color: '#34D399', count: observability.powerUsers },
                            ].map(seg => (
                                <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: seg.color }} />
                                    {seg.label} ({seg.count})
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Sub-Components ───

function KPICard({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: string; color: string }) {
    return (
        <div style={{
            padding: '18px', background: 'white', borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
            <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                <div style={{ fontSize: '26px', fontWeight: '700', color: '#0F172A', marginTop: '4px' }}>{value}</div>
                {sub && <div style={{ fontSize: '12px', color, marginTop: '2px', fontWeight: '500' }}>{sub}</div>}
            </div>
            <div style={{
                width: '46px', height: '46px', borderRadius: '14px',
                background: `${color}15`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '22px',
            }}>
                {icon}
            </div>
        </div>
    );
}

function FunnelStep({ label, value, max, color, pct }: { label: string; value: number; max: number; color: string; pct?: number }) {
    const width = max > 0 ? Math.max((value / max) * 100, 8) : 8;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '90px', fontSize: '13px', fontWeight: '500', color: '#64748B', textAlign: 'right' }}>{label}</div>
            <div style={{ flex: 1, position: 'relative' }}>
                <div style={{
                    height: '32px', borderRadius: '8px', background: `${color}20`,
                    width: `${width}%`, display: 'flex', alignItems: 'center',
                    paddingLeft: '12px', transition: 'width 0.5s ease',
                }}>
                    <div style={{
                        height: '32px', borderRadius: '8px', background: color,
                        position: 'absolute', left: 0, top: 0, width: `${width}%`,
                        opacity: 0.15,
                    }} />
                    <span style={{ fontWeight: '700', fontSize: '14px', color, position: 'relative', zIndex: 1 }}>{value}</span>
                </div>
            </div>
            {pct !== undefined && (
                <div style={{ width: '45px', fontSize: '12px', fontWeight: '600', color: pct >= 50 ? '#10B981' : pct >= 25 ? '#F59E0B' : '#EF4444' }}>
                    {pct}%
                </div>
            )}
        </div>
    );
}

function FailureCard({ label, value, desc, severity }: { label: string; value: number; desc: string; severity: 'high' | 'mid' | 'low' | 'good' }) {
    const colors = {
        high: { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626' },
        mid: { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706' },
        low: { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B' },
        good: { bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A' },
    };
    const c = colors[severity];
    return (
        <div style={{
            padding: '14px', borderRadius: '12px', background: c.bg,
            border: `1px solid ${c.border}`,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{label}</span>
                <span style={{ fontSize: '22px', fontWeight: '700', color: c.text }}>{value}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>{desc}</div>
        </div>
    );
}

function ActionItem({ label, action, onClick, severity }: { label: string; action?: string; onClick?: () => void; severity: 'warning' | 'info' }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderRadius: '10px',
            background: severity === 'warning' ? '#FFFBEB' : '#F0F9FF',
            border: `1px solid ${severity === 'warning' ? '#FDE68A' : '#BAE6FD'}`,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{severity === 'warning' ? '⚠️' : 'ℹ️'}</span>
                <span style={{ fontSize: '13px', color: '#334155' }}>{label}</span>
            </div>
            {action && onClick && (
                <button
                    onClick={onClick}
                    style={{
                        padding: '6px 14px', borderRadius: '8px', border: 'none',
                        background: severity === 'warning' ? '#F59E0B' : '#3B82F6',
                        color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    }}
                >
                    {action}
                </button>
            )}
        </div>
    );
}

// ─── Styles ───

const styles: Record<string, React.CSSProperties> = {
    container: { padding: '24px', maxWidth: '1200px', margin: '0 auto', background: '#F8FAFC', minHeight: '100vh' },
    loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
    spinner: { width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTop: '3px solid #3B82F6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
    title: { margin: 0, fontSize: '24px', fontWeight: '700', color: '#0F172A' },
    subtitle: { margin: '4px 0 0', fontSize: '13px', color: '#94A3B8' },
    backBtn: { padding: '8px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#64748B' },
    tabBar: { display: 'flex', gap: '4px', marginBottom: '24px', background: 'white', borderRadius: '14px', padding: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    tab: { flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#94A3B8', transition: 'all 0.2s' },
    tabActive: { background: '#3B82F6', color: 'white', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' },
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' },
    card: { background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9', marginBottom: '20px' },
    cardTitle: { margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#0F172A' },
    chartContainer: {},
    barChart: { display: 'flex', alignItems: 'flex-end', gap: '2px', height: '120px', padding: '0 4px' },
    barCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', position: 'relative' },
    bar: { width: '100%', borderRadius: '3px 3px 0 0', minHeight: '4px', transition: 'height 0.3s ease', cursor: 'pointer' },
    barLabel: { fontSize: '9px', color: '#94A3B8', marginTop: '4px', whiteSpace: 'nowrap' },
    chartLegend: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' },
    legendDot: { display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', marginRight: '4px' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: { padding: '10px 12px', textAlign: 'left' as const, borderBottom: '2px solid #E2E8F0', color: '#64748B', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
    td: { padding: '10px 12px', borderBottom: '1px solid #F1F5F9', color: '#334155' },
};
