'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    // Check if onboarding is already complete
    // Simple client-side cookie check for MVP
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      acc[name] = value;
      return acc;
    }, {} as Record<string, string>);

    if (cookies['onboarding_complete']) {
      router.push('/login'); // Or /home if we assume logged in, but login is safer
      return;
    }

    // Simulate loading/splash delay then go to onboarding
    const timer = setTimeout(() => {
      router.push('/onboarding');
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'white',
      border: '4px solid #333' // Keeping the wireframe border aesthetic for now
    }}>
      <Image
        src="/logo.png"
        alt="ZyraHealth Logo"
        width={100}
        height={100}
        style={{ marginBottom: '20px' }}
      />
      <h2 style={{ color: '#0047AB', margin: 0 }}>ZyraHealth</h2>
      <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '20px', color: '#0047AB' }}>
        (Loading...)
      </div>
    </div>
  );
}
