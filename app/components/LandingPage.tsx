'use client';

import posthog from 'posthog-js';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState, useRef, useCallback } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);

  // Track CTA clicks with a reusable helper
  const trackCta = useCallback((ctaLabel: string, destination: string) => {
    posthog.capture('landing_cta_clicked', { cta_text: ctaLabel, destination });
    router.push(destination);
  }, [router]);

  useEffect(() => {
    // Track landing page view
    const params = new URLSearchParams(window.location.search);
    posthog.capture('landing_page_viewed', {
      referrer: document.referrer || 'direct',
      utm_source: params.get('utm_source') || undefined,
      utm_medium: params.get('utm_medium') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
    });

    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Track section visibility via IntersectionObserver
    const sections = ['features', 'how-it-works', 'testimonials', 'cta-section'];
    const viewedSections = new Set<string>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !viewedSections.has(entry.target.id)) {
          viewedSections.add(entry.target.id);
          posthog.capture('landing_section_viewed', { section: entry.target.id });
        }
      });
    }, { threshold: 0.3 });

    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div style={{ '--scroll': scrollY } as React.CSSProperties}>
      <style>{`
        /* ============================================
           LANDING PAGE STYLES
           ============================================ */
        .landing-root {
          min-height: 100vh;
          background: #ffffff;
          overflow-x: hidden;
          font-family: var(--font-inter), -apple-system, sans-serif;
        }

        /* --- NAVBAR --- */
        .landing-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 16px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
          transition: all 0.3s ease;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .nav-logo span {
          font-family: var(--font-outfit), sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -0.03em;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .nav-link {
          font-size: 14px;
          font-weight: 500;
          color: #64748B;
          cursor: pointer;
          transition: color 0.2s;
          background: none;
          border: none;
          padding: 0;
          font-family: inherit;
        }
        .nav-link:hover { color: #0F172A; }
        .nav-cta {
          background: linear-gradient(135deg, #2563EB 0%, #4F46E5 100%);
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
          font-family: var(--font-outfit), sans-serif;
        }
        .nav-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.35);
        }

        /* --- HERO --- */
        .hero {
          position: relative;
          padding: 140px 32px 100px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          overflow: hidden;
          min-height: 90vh;
          justify-content: center;
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, #F0F5FF 0%, #ffffff 60%);
          z-index: 0;
        }
        .hero-blob-1 {
          position: absolute;
          top: -120px;
          right: -200px;
          width: 600px;
          height: 600px;
          background: radial-gradient(ellipse at center, rgba(37, 99, 235, 0.08), transparent 70%);
          border-radius: 50%;
          z-index: 0;
          animation: floatBlob 20s ease-in-out infinite;
        }
        .hero-blob-2 {
          position: absolute;
          bottom: -100px;
          left: -200px;
          width: 500px;
          height: 500px;
          background: radial-gradient(ellipse at center, rgba(79, 70, 229, 0.06), transparent 70%);
          border-radius: 50%;
          z-index: 0;
          animation: floatBlob 25s ease-in-out infinite reverse;
        }
        .hero-blob-3 {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 800px;
          height: 800px;
          background: radial-gradient(ellipse at center, rgba(16, 185, 129, 0.04), transparent 70%);
          border-radius: 50%;
          z-index: 0;
        }
        @keyframes floatBlob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 800px;
          margin: 0 auto;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 100px;
          background: rgba(37, 99, 235, 0.08);
          color: #2563EB;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 24px;
          animation: fadeInUp 0.6s ease-out;
        }
        .hero-badge svg { flex-shrink: 0; }
        .hero-title {
          font-family: var(--font-outfit), sans-serif;
          font-size: clamp(40px, 6vw, 72px);
          font-weight: 800;
          color: #0F172A;
          line-height: 1.08;
          letter-spacing: -0.04em;
          margin: 0 0 24px;
          animation: fadeInUp 0.6s ease-out 0.1s both;
        }
        .hero-title-accent {
          background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          font-size: clamp(16px, 2vw, 20px);
          color: #64748B;
          line-height: 1.7;
          max-width: 600px;
          margin: 0 auto 40px;
          animation: fadeInUp 0.6s ease-out 0.2s both;
        }
        .hero-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
          animation: fadeInUp 0.6s ease-out 0.3s both;
        }
        .hero-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 36px;
          background: linear-gradient(135deg, #2563EB 0%, #4F46E5 100%);
          color: white;
          border: none;
          border-radius: 100px;
          font-size: 17px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 32px rgba(37, 99, 235, 0.3);
          font-family: var(--font-outfit), sans-serif;
          letter-spacing: -0.01em;
        }
        .hero-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(37, 99, 235, 0.4);
        }
        .hero-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 36px;
          background: white;
          color: #334155;
          border: 1.5px solid #E2E8F0;
          border-radius: 100px;
          font-size: 17px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: var(--font-outfit), sans-serif;
          letter-spacing: -0.01em;
        }
        .hero-btn-secondary:hover {
          border-color: #CBD5E1;
          background: #F8FAFC;
        }
        .hero-stats {
          display: flex;
          gap: 48px;
          justify-content: center;
          margin-top: 64px;
          animation: fadeInUp 0.6s ease-out 0.5s both;
        }
        .hero-stat-value {
          font-family: var(--font-outfit), sans-serif;
          font-size: 36px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.03em;
        }
        .hero-stat-label {
          font-size: 13px;
          color: #94A3B8;
          font-weight: 500;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* --- LOGOS / TRUST BAR --- */
        .trust-bar {
          padding: 48px 32px;
          text-align: center;
          border-top: 1px solid #F1F5F9;
          border-bottom: 1px solid #F1F5F9;
          background: #FAFBFC;
        }
        .trust-label {
          font-size: 12px;
          color: #94A3B8;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .trust-logos {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 48px;
          flex-wrap: wrap;
          opacity: 0.4;
        }
        .trust-logo {
          font-family: var(--font-outfit), sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #475569;
          letter-spacing: -0.02em;
        }

        /* --- FEATURES --- */
        .features {
          padding: 120px 32px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .features-header {
          text-align: center;
          max-width: 640px;
          margin: 0 auto 72px;
        }
        .features-label {
          font-size: 13px;
          font-weight: 700;
          color: #2563EB;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .features-title {
          font-family: var(--font-outfit), sans-serif;
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.03em;
          margin: 0 0 16px;
          line-height: 1.15;
        }
        .features-sub {
          font-size: 17px;
          color: #64748B;
          line-height: 1.7;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .feature-card {
          padding: 40px 32px;
          border-radius: 24px;
          border: 1px solid #F1F5F9;
          background: #FAFBFC;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .feature-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--card-accent, #2563EB), transparent);
          opacity: 0;
          transition: opacity 0.4s;
        }
        .feature-card:hover {
          background: white;
          border-color: #E2E8F0;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.06);
          transform: translateY(-4px);
        }
        .feature-card:hover::before { opacity: 1; }
        .feature-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          font-size: 24px;
        }
        .feature-card-title {
          font-family: var(--font-outfit), sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }
        .feature-card-desc {
          font-size: 15px;
          color: #64748B;
          line-height: 1.7;
        }

        /* --- HOW IT WORKS --- */
        .how-it-works {
          padding: 120px 32px;
          background: linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%);
        }
        .how-header {
          text-align: center;
          max-width: 640px;
          margin: 0 auto 72px;
        }
        .how-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 32px;
          max-width: 1100px;
          margin: 0 auto;
          position: relative;
        }
        .how-step {
          text-align: center;
          position: relative;
        }
        .how-step-num {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563EB 0%, #4F46E5 100%);
          color: white;
          font-family: var(--font-outfit), sans-serif;
          font-size: 22px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25);
        }
        .how-step-title {
          font-family: var(--font-outfit), sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 8px;
        }
        .how-step-desc {
          font-size: 14px;
          color: #64748B;
          line-height: 1.6;
        }

        /* --- TESTIMONIALS --- */
        .testimonials {
          padding: 120px 32px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 64px;
        }
        .testimonial-card {
          padding: 32px;
          border-radius: 24px;
          border: 1px solid #F1F5F9;
          background: white;
        }
        .testimonial-stars {
          color: #FBB040;
          font-size: 16px;
          margin-bottom: 16px;
          letter-spacing: 2px;
        }
        .testimonial-text {
          font-size: 15px;
          color: #334155;
          line-height: 1.7;
          margin-bottom: 24px;
          font-style: italic;
        }
        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .testimonial-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #DBEAFE, #E0E7FF);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          color: #2563EB;
          font-family: var(--font-outfit), sans-serif;
        }
        .testimonial-name {
          font-weight: 600;
          font-size: 14px;
          color: #0F172A;
        }
        .testimonial-location {
          font-size: 13px;
          color: #94A3B8;
        }

        /* --- CTA --- */
        .cta-section {
          padding: 120px 32px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .cta-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #1E3A8A 0%, #312E81 50%, #1E293B 100%);
        }
        .cta-glow-1 {
          position: absolute;
          top: -200px;
          right: -200px;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.3), transparent 60%);
          z-index: 0;
        }
        .cta-glow-2 {
          position: absolute;
          bottom: -200px;
          left: -200px;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(124, 58, 237, 0.2), transparent 60%);
          z-index: 0;
        }
        .cta-content {
          position: relative;
          z-index: 1;
          max-width: 640px;
          margin: 0 auto;
        }
        .cta-title {
          font-family: var(--font-outfit), sans-serif;
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 800;
          color: white;
          letter-spacing: -0.03em;
          margin: 0 0 20px;
          line-height: 1.1;
        }
        .cta-sub {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.7;
          margin-bottom: 40px;
        }
        .cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 18px 44px;
          background: white;
          color: #1E3A8A;
          border: none;
          border-radius: 100px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          font-family: var(--font-outfit), sans-serif;
          letter-spacing: -0.01em;
        }
        .cta-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 14px 44px rgba(0, 0, 0, 0.3);
        }

        /* --- FOOTER --- */
        .landing-footer {
          background: #0F172A;
          padding: 64px 32px 32px;
          color: white;
        }
        .footer-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 48px;
          padding-bottom: 48px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .footer-brand-desc {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.7;
          margin-top: 16px;
          max-width: 300px;
        }
        .footer-col-title {
          font-family: var(--font-outfit), sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .footer-link {
          display: block;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.45);
          margin-bottom: 12px;
          cursor: pointer;
          transition: color 0.2s;
          text-decoration: none;
        }
        .footer-link:hover { color: rgba(255, 255, 255, 0.8); }
        .footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding-top: 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.3);
        }

        /* --- RESPONSIVE --- */
        @media (max-width: 768px) {
          .landing-nav { padding: 12px 20px; }
          .nav-links { gap: 16px; }
          .nav-link { display: none; }
          .hero { padding: 120px 20px 80px; min-height: auto; }
          .hero-stats { gap: 24px; flex-wrap: wrap; }
          .hero-stat-value { font-size: 28px; }
          .features { padding: 80px 20px; }
          .features-grid { grid-template-columns: 1fr; }
          .how-it-works { padding: 80px 20px; }
          .how-steps { grid-template-columns: 1fr 1fr; }
          .testimonials { padding: 80px 20px; }
          .testimonials-grid { grid-template-columns: 1fr; }
          .cta-section { padding: 80px 20px; }
          .footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
          .footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
        }
      `}</style>

      <div className="landing-root">
        {/* ===== NAVBAR ===== */}
        <nav className="landing-nav">
          <div className="nav-logo">
            <Image src="/logo.png" alt="Medivera" width={32} height={32} />
            <span>Medivera</span>
          </div>
          <div className="nav-links">
            <button className="nav-link" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</button>
            <button className="nav-link" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>How It Works</button>
            <button className="nav-link" onClick={() => router.push('/login')}>Log in</button>
            <button className="nav-cta" onClick={() => trackCta('Get Started Free', '/signup')}>Get Started Free</button>
          </div>
        </nav>

        {/* ===== HERO ===== */}
        <section className="hero">
          <div className="hero-bg" />
          <div className="hero-blob-1" />
          <div className="hero-blob-2" />
          <div className="hero-blob-3" />
          <div className="hero-content">
            <div className="hero-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
              Trusted by 10,000+ NRIs worldwide
            </div>
            <h1 className="hero-title">
              World-class Indian doctors,
              <br />
              <span className="hero-title-accent">wherever you call home.</span>
            </h1>
            <p className="hero-sub">
              Skip the wait. Consult top Indian specialists via HD video — get prescriptions, second opinions, and care in your language, on your schedule.
            </p>
            <div className="hero-actions">
              <button className="hero-btn-primary" onClick={() => trackCta('Book a Consultation', '/signup')}>
                Book a Consultation
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </button>
              <button className="hero-btn-secondary" onClick={() => trackCta('Browse Doctors', '/search')}>
                Browse Doctors
              </button>
            </div>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-value">500+</div>
                <div className="hero-stat-label">Verified Doctors</div>
              </div>
              <div>
                <div className="hero-stat-value">50k+</div>
                <div className="hero-stat-label">Consultations</div>
              </div>
              <div>
                <div className="hero-stat-value">4.9</div>
                <div className="hero-stat-label">Patient Rating</div>
              </div>
              <div>
                <div className="hero-stat-value">12+</div>
                <div className="hero-stat-label">Countries</div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== TRUST BAR ===== */}
        <div className="trust-bar">
          <div className="trust-label">Trusted by families across</div>
          <div className="trust-logos">
            <span className="trust-logo">🇺🇸 United States</span>
            <span className="trust-logo">🇬🇧 United Kingdom</span>
            <span className="trust-logo">🇨🇦 Canada</span>
            <span className="trust-logo">🇦🇺 Australia</span>
            <span className="trust-logo">🇦🇪 UAE</span>
            <span className="trust-logo">🇸🇬 Singapore</span>
          </div>
        </div>

        {/* ===== FEATURES ===== */}
        <section className="features" id="features">
          <div className="features-header">
            <div className="features-label">Why Medivera</div>
            <h2 className="features-title">Healthcare that crosses borders</h2>
            <p className="features-sub">
              We bring the expertise of India's finest medical professionals to your fingertips, no matter where you are in the world.
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card" style={{ '--card-accent': '#2563EB' } as React.CSSProperties}>
              <div className="feature-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
              </div>
              <div className="feature-card-title">HD Video Consultations</div>
              <div className="feature-card-desc">Crystal-clear video calls with specialists. Share your screen, upload reports, and get real-time medical guidance.</div>
            </div>
            <div className="feature-card" style={{ '--card-accent': '#7C3AED' } as React.CSSProperties}>
              <div className="feature-icon" style={{ background: '#F3E8FF', color: '#7C3AED' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
              </div>
              <div className="feature-card-title">Digital Prescriptions</div>
              <div className="feature-card-desc">Receive legally valid, signed digital prescriptions. Download PDF instantly or share with your local pharmacy.</div>
            </div>
            <div className="feature-card" style={{ '--card-accent': '#059669' } as React.CSSProperties}>
              <div className="feature-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
              </div>
              <div className="feature-card-title">Cross-Border Care</div>
              <div className="feature-card-desc">Automatic timezone conversion, multi-currency payments, and doctors who speak your language.</div>
            </div>
            <div className="feature-card" style={{ '--card-accent': '#DC2626' } as React.CSSProperties}>
              <div className="feature-icon" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              </div>
              <div className="feature-card-title">Verified Specialists</div>
              <div className="feature-card-desc">Every doctor is credential-verified. Board-certified specialists with 10+ years of experience on average.</div>
            </div>
            <div className="feature-card" style={{ '--card-accent': '#D97706' } as React.CSSProperties}>
              <div className="feature-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <div className="feature-card-title">Skip the Wait</div>
              <div className="feature-card-desc">No more 2-week waits for a GP. Book same-day or next-day consultations with top Indian doctors in minutes.</div>
            </div>
            <div className="feature-card" style={{ '--card-accent': '#0891B2' } as React.CSSProperties}>
              <div className="feature-icon" style={{ background: '#ECFEFF', color: '#0891B2' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </div>
              <div className="feature-card-title">Your Language</div>
              <div className="feature-card-desc">Consult in Hindi, Tamil, Telugu, Bengali, or English. Communicate with doctors who understand your cultural context.</div>
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section className="how-it-works" id="how-it-works">
          <div className="how-header">
            <div className="features-label">Simple Process</div>
            <h2 className="features-title">Your consultation, in 4 easy steps</h2>
            <p className="features-sub">From booking to prescription — we've made every step seamless.</p>
          </div>
          <div className="how-steps">
            <div className="how-step">
              <div className="how-step-num">1</div>
              <div className="how-step-title">Search</div>
              <div className="how-step-desc">Find a specialist by condition, language, or availability.</div>
            </div>
            <div className="how-step">
              <div className="how-step-num">2</div>
              <div className="how-step-title">Book</div>
              <div className="how-step-desc">Pick a time slot in your timezone. Pay securely online.</div>
            </div>
            <div className="how-step">
              <div className="how-step-num">3</div>
              <div className="how-step-title">Consult</div>
              <div className="how-step-desc">Join an HD video call. Share reports and discuss your health.</div>
            </div>
            <div className="how-step">
              <div className="how-step-num">4</div>
              <div className="how-step-title">Prescription</div>
              <div className="how-step-desc">Receive a digital prescription. Download, share, or print.</div>
            </div>
          </div>
        </section>

        {/* ===== TESTIMONIALS ===== */}
        <section className="testimonials" id="testimonials">
          <div className="features-header">
            <div className="features-label">Patient Stories</div>
            <h2 className="features-title">Loved by patients worldwide</h2>
            <p className="features-sub">Real stories from real people who found care without borders.</p>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <div className="testimonial-text">"My mother in Toronto had a skin issue and waited 6 weeks for a dermatologist. On Medivera, she saw one the same day. The doctor spoke Tamil, which made her so comfortable."</div>
              <div className="testimonial-author">
                <div className="testimonial-avatar">P</div>
                <div>
                  <div className="testimonial-name">Priya Raghavan</div>
                  <div className="testimonial-location">Toronto, Canada</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <div className="testimonial-text">"Got a second opinion on my father's heart report from a cardiologist in Mumbai. The doctor was thorough, reviewed all reports on the video call, and gave us peace of mind."</div>
              <div className="testimonial-author">
                <div className="testimonial-avatar">R</div>
                <div>
                  <div className="testimonial-name">Rahul Menon</div>
                  <div className="testimonial-location">London, UK</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <div className="testimonial-text">"As an NRI in the US, finding a doctor who understands Indian dietary habits and lifestyle was impossible. Medivera solved that. The prescription was ready in 10 minutes."</div>
              <div className="testimonial-author">
                <div className="testimonial-avatar">A</div>
                <div>
                  <div className="testimonial-name">Ananya Sharma</div>
                  <div className="testimonial-location">New Jersey, USA</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="cta-section" id="cta-section">
          <div className="cta-bg" />
          <div className="cta-glow-1" />
          <div className="cta-glow-2" />
          <div className="cta-content">
            <h2 className="cta-title">Your health shouldn't wait for borders</h2>
            <p className="cta-sub">Join thousands of patients who've found trusted care from anywhere in the world. Your first consultation is just a click away.</p>
            <button className="cta-btn" onClick={() => trackCta('Get Started — Its Free', '/signup')}>
              Get Started — It's Free
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </button>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="landing-footer">
          <div className="footer-grid">
            <div>
              <div className="nav-logo" style={{ marginBottom: '4px' }}>
                <Image src="/logo.png" alt="Medivera" width={28} height={28} />
                <span style={{ fontFamily: 'var(--font-outfit)', fontSize: '20px', fontWeight: 700, color: 'white' }}>Medivera</span>
              </div>
              <div className="footer-brand-desc">
                Global digital healthcare for the Indian diaspora. Connecting patients with trusted specialists, anywhere in the world.
              </div>
            </div>
            <div>
              <div className="footer-col-title">Product</div>
              <span className="footer-link" onClick={() => router.push('/search')}>Find Doctors</span>
              <span className="footer-link" onClick={() => router.push('/signup')}>Sign Up</span>
              <span className="footer-link" onClick={() => router.push('/login')}>Patient Login</span>
              <span className="footer-link" onClick={() => router.push('/doctor/login')}>Doctor Login</span>
            </div>
            <div>
              <div className="footer-col-title">Company</div>
              <span className="footer-link">About Us</span>
              <span className="footer-link">Careers</span>
              <span className="footer-link">Blog</span>
              <span className="footer-link">Contact</span>
            </div>
            <div>
              <div className="footer-col-title">Legal</div>
              <span className="footer-link" onClick={() => router.push('/legal/privacy')}>Privacy Policy</span>
              <span className="footer-link" onClick={() => router.push('/legal/terms')}>Terms of Service</span>
              <span className="footer-link">Disclaimer</span>
              <span className="footer-link">HIPAA</span>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Medivera Health Inc. All rights reserved.</span>
            <span>Built with ❤️ for the global Indian community</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
