'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from './utils/supabase';

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      // 1. Check for active Supabase session (Native Storage takes a moment)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/dashboard');
        return;
      }

      // 2. Fallback to onboarding check
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
    };

    // Check immediately without delay for faster load
    checkSession();
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
