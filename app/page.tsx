'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Capacitor } from '@capacitor/core';
import { supabase } from './utils/supabase';
import LandingPage from './components/LandingPage';

export default function Splash() {
  const router = useRouter();
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    const checkSessionAndPlatform = async () => {
      // 1. If Native App -> Always Auto-Redirect
      if (Capacitor.isNativePlatform()) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/dashboard');
          return;
        }

        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [name, value] = cookie.trim().split('=');
          acc[name] = value;
          return acc;
        }, {} as Record<string, string>);

        if (cookies['onboarding_complete']) {
          router.replace('/login');
        } else {
          router.replace('/onboarding');
        }
      } else {
        // 2. If Web -> Show Landing Page
        // (Optional: You could still auto-redirect if logged in, but standard SaaS behavior is to show landing page)
        setShowLanding(true);
      }
    };

    checkSessionAndPlatform();
  }, [router]);

  if (showLanding) {
    return <LandingPage />;
  }

  // Splash Screen (Loading state for Web / Permanent state while redirecting for Native)
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'white',
      // border: '4px solid #333' // Removed debug border for production look
    }}>
      <Image
        src="/logo.png"
        alt="Medivera Logo"
        width={100}
        height={100}
        style={{ marginBottom: '20px' }}
      />
      <h2 style={{ color: '#0047AB', margin: 0 }}>Medivera</h2>
      {!showLanding && (
        <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '20px', color: '#0047AB' }}>
          (Loading...)
        </div>
      )}
    </div>
  );
}
