'use client';

import { useEffect, useState } from 'react';
import { getAdminStats } from './actions';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalPatients: 0,
        totalDoctors: 0,
        verifiedDoctors: 0,
        totalAppointments: 0,
        totalRevenue: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const data = await getAdminStats();
        if (data.error) {
            setError(data.error + ' (Check if SUPABASE_SERVICE_ROLE_KEY is set in .env.local)');
        } else {
            setStats(data);
        }
        setLoading(false);
    };

    if (loading) return <div style={{ padding: '40px' }}>Loading analytics...</div>;
    if (error) return <div style={{ padding: '40px', color: 'red' }}>Error: {error}</div>;

    return (
        <div style={{ padding: '30px' }}>
            <h1 style={{ margin: '0 0 30px 0', fontSize: '24px' }}>Dashboard Overview</h1>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                <StatCard
                    title="Total Patients"
                    value={stats.totalPatients}
                    icon="👥"
                    color="#3b82f6"
                />
                <StatCard
                    title="Total Doctors"
                    value={stats.totalDoctors}
                    subValue={`${stats.verifiedDoctors} Verified`}
                    icon="👨‍⚕️"
                    color="#10b981"
                />
                <StatCard
                    title="Appointments"
                    value={stats.totalAppointments}
                    icon="📅"
                    color="#8b5cf6"
                />
                <StatCard
                    title="Revenue (Est.)"
                    value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.totalRevenue)}
                    icon="💰"
                    color="#f59e0b"
                />
            </div>

            {/* Recent Activity Section Placeholder */}
            <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ marginTop: 0 }}>Platform Health</h3>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', color: '#666', fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
                        System Operational
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
                        Database Connected
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
                        Storage Active
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, subValue, icon, color }: any) {
    return (
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>{title}</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '5px', color: '#1e293b' }}>{value}</div>
                {subValue && <div style={{ fontSize: '12px', color: color, marginTop: '2px' }}>{subValue}</div>}
            </div>
            <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: `${color}20`,
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
            }}>
                {icon}
            </div>
        </div>
    );
}
