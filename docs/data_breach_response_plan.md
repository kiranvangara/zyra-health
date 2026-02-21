# Data Breach Response Plan

**Medivera** | Last reviewed: February 2026

---

## 1. Scope

This plan covers any breach of security leading to unauthorized access, disclosure, alteration, loss, or destruction of personal data (including health data) processed by Medivera.

## 2. Regulatory Obligations

| Regulation | Requirement |
|---|---|
| **DPDP Act 2023** | Notify Data Protection Board of India of every personal data breach |
| **CERT-In (IT Act 2000)** | Report cybersecurity incidents within **6 hours** of detection |
| **Telemedicine Practice Guidelines** | Ensure confidentiality of patient health records |

## 3. Incident Classification

| Severity | Definition | Response Time |
|---|---|---|
| **Critical** | Health data exposed, auth credentials compromised, DB exfiltrated | Immediate (< 1 hour) |
| **High** | Unauthorized access to patient records, consent logs, or Rx data | < 4 hours |
| **Medium** | Analytics data leaked, non-health PII exposed | < 24 hours |
| **Low** | Failed intrusion attempt, no data accessed | < 72 hours |

## 4. Response Procedure

### Phase 1: Detect & Contain (0–1 hours)
1. Identify the breach source (Supabase logs, application logs, infra alerts)
2. Isolate affected systems — revoke compromised keys, disable affected API endpoints
3. Preserve evidence — snapshot logs, DB state, and network traces
4. Activate response team (Founder, Tech Lead, Legal Counsel)

### Phase 2: Assess & Classify (1–6 hours)
1. Determine scope — which users, which data types, how many records
2. Classify sensitivity — health data, PII, financial data
3. Classify severity per table above
4. Determine root cause — vulnerability, misconfiguration, insider threat, third-party

### Phase 3: Notify (within 6 hours for Critical/High)
1. **CERT-In** — file incident report via [cert-in.org.in](https://www.cert-in.org.in) within 6 hours
2. **Data Protection Board** — notify as required by DPDP Act Section 8
3. **Affected Users** — email notification with:
   - What data was compromised
   - What we are doing about it
   - Steps they should take (change password, monitor accounts)
   - Grievance Officer contact
4. Document all notifications with timestamps

### Phase 4: Remediate (24–72 hours)
1. Patch vulnerability or fix misconfiguration
2. Force password resets for affected accounts if credentials exposed
3. Rotate all API keys and secrets (Supabase, Daily.co, PostHog, Stripe/Razorpay)
4. Deploy fix to production
5. Verify fix with penetration test on affected vector

### Phase 5: Post-Incident Review (within 7 days)
1. Write incident report: timeline, root cause, impact, response
2. Update security controls to prevent recurrence
3. Review and update this response plan
4. Conduct team debrief

## 5. Key Contacts

| Role | Responsibility |
|---|---|
| **Founder** | Final decision authority, external communications |
| **Tech Lead** | Technical investigation, containment, remediation |
| **Legal Counsel** | Regulatory filings, user notifications, liability |
| **Grievance Officer** | Patient-facing communication (privacy@medivera.com) |

## 6. Third-Party Breach

If a breach originates from a third-party provider:

| Provider | Data at Risk | Action |
|---|---|---|
| **Supabase** | All patient/doctor data, auth | Contact Supabase security, assess scope, rotate keys |
| **Daily.co** | Video consultation streams | Verify recording exposure, notify patients |
| **PostHog** | Anonymized analytics | Assess if any PII was inadvertently tracked |
| **Google OAuth** | Auth tokens | Force re-auth, revoke OAuth tokens |

## 7. Testing & Maintenance

- Review this plan **every 6 months** or after any incident
- Conduct a **tabletop exercise** annually simulating a Critical breach
- Maintain an **incident log** of all breaches (including near-misses)
