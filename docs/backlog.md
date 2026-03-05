# Medivera — Product Backlog

> **Last Updated:** Mar 5, 2026
> Consolidated from all previous conversations into a single source of truth.

---

## ✅ Completed (44 Phases)

<details>
<summary>Click to expand full history (Phases 1–44)</summary>

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Foundation & Auth (Next.js, CSS, PWA) | ✅ |
| 2 | Patient Core (Splash, Login, Signup, Profile Setup) | ✅ |
| 3 | Doctor Core & Booking (Login, Dashboard, Queue, Consultation) | ✅ |
| 4 | Medical Records & Prescriptions (Rx Writer, Records Vault) | ✅ |
| 5 | Backend Integration (Supabase) | ✅ |
| 6 | Doctor Search & Booking | ✅ |
| 7 | Video Consultations | ✅ |
| 8 | Prescription Writer & Medical Records | ✅ |
| 9 | Doctor Dashboard Integration | ✅ |
| 10 | Admin Panel & Reports | ✅ |
| 11 | Core Refinements (Fees, Currency, Slot Logic) | ✅ |
| 12 | Search & Discovery (Symptoms/Body Parts) | ✅ |
| 13 | Ratings & Reviews | ✅ |
| 14 | Communication & Visuals (WhatsApp Share, Email Rx) | ✅ |
| 15 | Post-Release Bug Fixes | ✅ |
| 16 | Admin Doctor Management (Create/Edit) | ✅ |
| 17 | Country-Specific Pricing (Uber Model) | ✅ |
| 18 | Admin Image Upload | ✅ |
| 19 | PDF Prescriptions | ✅ |
| 20 | Testing Infrastructure (Jest + Playwright) | ✅ |
| 21 | Analytics Integration (PostHog) | ✅ |
| 22 | Medical Records Enhancements (Title, Viewer) | ✅ |
| 23 | Enhanced Doctor Availability (Status Badge) | ✅ |
| 24 | UI Polish for Search Page | ✅ |
| 25 | Standardize UI Across App (Glass Headers, Icons) | ✅ |
| 26 | Legal Pages (Privacy, Terms) | ✅ |
| 27 | Auth Enhancements (Forgot Password, Profile Edit, Age/Gender) | ✅ |
| 28 | Deployment & Mobile (Capacitor, Deep Linking, Secure Storage) | ✅ |
| 29 | Doctor App Mobile (Role Routing, Rx Writer Touch, Video Call) | ✅ |
| 30 | Detailed Doctor Availability (Weekly Schedule, Overrides) | ✅ |
| 31 | Enhanced Doctor Schedule & History | ✅ |
| 32 | Doctor Profile & Timezone Refactor | ✅ |
| 33 | Profile Enhancements (Specialization Dropdown, Languages) | ✅ |
| 34 | General Cleanup & Fixes | ✅ |
| 35 | Dynamic Specializations (Server-Side Cache) | ✅ |
| 36 | Unified Doctor Profile (Tabs UI) | ✅ |
| 37 | Profile Nav & Read-Only View | ✅ |
| 38 | Visual Polish & Aesthetics (Typography, Glass, Animations) | ✅ |
| 44 | Refactor Find a Doctor Page (Premium UI) | ✅ |
| — | Rename App (ZyraHealth → Medivera) | ✅ |
| — | Update App Logo | ✅ |
| — | Web Landing Page | ✅ |
| — | Search Keyword Analytics | ✅ |
| — | Full Analytics (Tiers 1–3, 36 PostHog events) | ✅ |
| — | Product Metrics Framework | ✅ |
| — | Unit Test Coverage (100%) | ✅ |
| — | Searchable Medicines Database (254K drugs, Rx Writer autocomplete) | ✅ |

</details>

---

## 🔴 P0 — Pre-Launch Blockers (Regulatory & Compliance)

> **Strategy:** India-first launch. Gain traction domestically before expanding abroad.

### Legal & Business Setup 🇮🇳
- [/] Register company entity (Pvt Ltd / LLP) — *in progress*
- [ ] Obtain GST registration
- [x] Add jurisdiction clause to Terms (Amaravathi, Andhra Pradesh)
- [ ] Obtain medical malpractice / professional indemnity insurance

### Patient Consent Flows
- [x] Add teleconsultation consent checkbox at booking confirmation
- [x] Add data processing consent at signup (DPDP Act requirement)
- [x] Build consent audit log — store timestamped records in DB
- [x] Add "right to withdraw consent" mechanism for patients

### E-Prescription Compliance
- [x] Add `qualification` field to `doctors` table and admin panel
- [x] Include doctor reg number + qualification on prescription PDF
- [x] Add "Teleconsultation" watermark/label to all Rx PDFs
- [x] Add patient name, age, gender to prescription header
- [x] Add drug prescribing disclaimer to Rx Writer UI

### Legal Pages Overhaul
- [x] Rewrite Privacy Policy — DPDP Act obligations, retention periods, patient rights, data fiduciary details
- [x] Rewrite Terms & Conditions — telemedicine-specific clauses, jurisdiction, liability

### Data Privacy & Retention (DPDP Act 2023)
- [x] Implement 3-year minimum retention policy for medical records
- [x] Add "Download My Data" option in patient profile
- [x] Add "Delete My Account" option in patient profile (right to erasure)
- [x] Document and implement data breach response plan
- [ ] Report cybersecurity incidents per CERT-In guidelines

### Doctor Credential Enforcement
- [x] Make `registration_number` mandatory in admin doctor creation/edit
- [x] Make `qualification` mandatory in admin doctor creation/edit
- [x] Display credentials on search result cards (not just profile page)

---

## 🔴 P0 — Must Have (Revenue & Core Experience)

### Payment Integration *(blocked — depends on company registration)*
- [ ] Secure Stripe/Razorpay integration (collect before booking)
- [ ] Refund logic (automated refunds for cancellations >24h)
- [ ] Receipts & invoice generation

### Second Opinion Service
- [ ] Dedicated async service: patient uploads reports → specialist provides written opinion
- [ ] New DB table or appointment type for second opinion requests
- [ ] Upload UI for reports/scans, delivery of written opinion via records page
- [ ] Integration into existing booking flow

### On-Demand / Immediate Doctor Connect
- [ ] "Talk to a doctor now" — match patient with first available doctor
- [ ] Real-time availability status (online/offline) for doctors
- [ ] Quick connect form: Name + Concern → matched with available specialist

---

## 🟠 P1 — High Priority (Engagement & Growth)

### Communication & Notifications
- [ ] Push Notifications — system notifications for appointments and prescriptions
- [ ] Appointment Reminders — push/email notifications before calls
- [ ] Chat System — simple text chat between patient and doctor (post-consultation)

### WhatsApp Business Integration *(blocked — depends on company registration)*
- [ ] Set up WhatsApp Business account
- [ ] Add WhatsApp contact link/button to landing page and footer
- [ ] Use `https://wa.me/<number>` deep link for one-tap chat

### Customer Support Chat *(decision pending)*
> **Options under consideration:**
> - **Option A:** Freshchat Growth ($19/mo) — AI bot (Freddy) + WhatsApp handoff
> - **Option B:** Simple WhatsApp click-to-chat button (free, no AI) + FAQ page
> - See detailed analysis: `chatbot_analysis.md` in brain artifacts
- [ ] Finalize chatbot approach (Freshchat vs WhatsApp button)
- [ ] Implement chosen solution

### Multi-Dimensional Doctor Reviews
- [ ] Replace single overall rating with aspect-based ratings (Friendliness, Expertise, Communication, Punctuality)
- [ ] Update `reviews` table schema (add per-aspect rating columns)
- [ ] Update review submission UI (patient side)
- [ ] Update doctor profile to display per-aspect average ratings
- [ ] Update admin review moderation panel

---

## 🟡 P2 — Medium Priority (Enhancement & Polish)

### Advanced Consultation Features
- [ ] Audio-Only Mode — toggle for low-bandwidth scenarios
- [ ] Follow-up Appointments — one-click re-booking logic
- [ ] Live/Adhoc Queue — "Go Online" mode for immediate walk-ins

### Strategic Benefit-Driven CTAs
- [ ] Weighted CTAs for specialized/experienced doctors ("Get Expert Opinion")
- [ ] CTA language based on experience years, specialization tier, or verified status
- [ ] Keep generic "Book Consultation" for standard profiles

### Auth & Platform Expansion
- [ ] Mobile Number Login — OTP-based authentication (Twilio/Supabase)
- [ ] Apple ID Integration — native Sign-in for iOS
- [ ] Performance Optimization — LCP improvements and bundle analysis

### Android Build (Incomplete)
- [ ] Complete Android APK build (Java environment ready, final build pending)
- [ ] Fix Google Sign-In redirect (native auth plugin configured, needs testing)

### Minor Patient Safeguards
- [x] Age verification at booking — patients must be 18+ for MVP
- [ ] Guardian consent flow for minor teleconsultations *(future)*

### Drug Category Enforcement *(long-term)*
- [x] Build drug database with 254K medicines (Kaggle dataset, Supabase)
- [x] Tag medicines with List O / A / B category
- [ ] Validate prescriptions against consultation type (first vs follow-up)
- [ ] Enforce video-only requirement for List A first prescriptions

---

## 🔵 P3 — Future Roadmap

### ABDM / ABHA Integration
- [ ] ABHA ID-based patient verification
- [ ] Health record interoperability via Health Information Exchange
- [ ] Consent-based health record sharing with other providers

### Cross-Border / NRI Expansion
- [ ] Evaluate target-country telehealth laws (US state-by-state, UK GMC, UAE DOH)
- [ ] Decide service positioning: "second opinion" vs primary teleconsultation
- [ ] Assess international data transfer compliance under DPDP Act
- [ ] Engage healthcare regulatory lawyer for cross-border model

### AI-Powered Features
- [ ] Lab report analysis — upload report → AI flags abnormal values, suggests specialist
- [ ] Symptom checker — guided Q&A → recommended specialization
- [ ] Prescription translation — Indian Rx → equivalent medications abroad
- [ ] AI Summaries — transcribe and summarize consultations (LLM integration)

### Comprehensive Care Ecosystem
- [ ] Lab Tests Integration — booking flow for lab tests and report management
- [ ] Mobile Health Sync — Apple Health / Google Fit integration
- [ ] Medication Reminders — push motivation for adherence
- [ ] Patient Education Hub — automated content delivery based on diagnosis

### Multi-Doctor Consultation Panel
- [ ] Premium offering: patient's case reviewed by 2–3 specialists together
- [ ] Panel scheduling, shared case notes, joint video call

### Health Blog / SEO Content
- [ ] Add `/blog` section with NRI-relevant health articles
- [ ] Topics: prescriptions abroad, vaccination schedules, cross-border healthcare tips
- [ ] Blog CMS or markdown-based posts

---

## 📊 Summary

| Priority | Items | Focus |
|----------|-------|-------|
| **P0 Regulatory** | 6 areas | Compliance, legal, DPDP, consent |
| **P0 Product** | 3 features | Revenue, core experience |
| **P1** | 4 features | Engagement, growth |
| **P2** | 6 features | Enhancement, polish, safeguards |
| **P3** | 5 features | ABDM, AI, ecosystem, future |
| **Done** | 44+ phases | Foundation → current state |
