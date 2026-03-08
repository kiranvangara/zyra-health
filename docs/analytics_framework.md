# Medivera — Analytics & Metrics Framework

> **Purpose:** Track product-market fit, user friction, and growth signals for MVP.
> **Tool:** PostHog (already integrated)
> **Last Updated:** Mar 8, 2026

---

## North Star Metric

**Completed Consultations per Week** — everything else feeds into this.

---

## PMF Dashboard — 5 Weekly Numbers

| # | Metric | Formula | 🟢 PMF Target |
|---|--------|---------|---------------|
| 1 | Activation rate | Completed 1st call ÷ Signups | >20% |
| 2 | Week-4 retention | Active in week 4 ÷ Cohort size | >15% |
| 3 | Repeat booking rate | Patients with 2+ bookings ÷ Total patients | >25% |
| 4 | Sean Ellis score | % "Very disappointed" if gone | >40% |
| 5 | Organic share rate | Rx shared via WhatsApp ÷ Completed calls | >15% |

> All 5 green → **PMF confirmed, start scaling.**
> 1–2 red → iterate on those areas. 3+ red → rethink value prop.

---

## A. Acquisition & Demand Validation

| Metric | PostHog Event | Trackable |
|--------|--------------|-----------|
| Signups / week (by source) | `signup_completed` + UTM | ✅ |
| Organic vs paid signups | UTM params presence | ✅ |
| "How did you hear about us?" | `signup_source_selected` | ✅ Add |
| Geographic distribution | IP geolocation / profile city | ✅ |
| Specialty demand ranking | Search + booking by specialization | ✅ |
| Time-of-day booking patterns | Booking timestamps by hour | ✅ |

---

## B. Search & Discovery Failures

| # | Failure | Event | Trackable |
|---|---------|-------|-----------|
| B1 | Search dead-end (0 results) | `search_no_results` + query | ✅ Add |
| B2 | Specialty gap (we don't offer it) | `search_no_results` + specialization | ✅ Add |
| B3 | Browse abandonment (saw list, clicked nothing) | Funnel: `search_results_shown` → no `doctor_profile_viewed` | ✅ |
| B4 | Profile bounce (viewed doc, went back) | `doctor_profile_viewed` → no `doctor_book_cta_clicked` | ✅ |
| B5 | Fee shock (profile viewed, no book) | Inferred from B4 + fee data | ⚠️ |
| B6 | Silent exit (opened app, did nothing) | Session with no events | ✅ PostHog |

---

## C. Booking Friction

| # | Failure | Event | Trackable |
|---|---------|-------|-----------|
| C1 | No availability | `booking_no_slots_available` | ✅ Add |
| C2 | Wrong date (changed date multiple times) | `booking_date_changed` count | ⚠️ Inferred |
| C3 | Booking abandoned (slot selected, no confirm) | Funnel: `booking_slot_selected` → no `booking_confirmed` | ✅ |
| C4 | Consent refused | `booking_consent_not_given` | ✅ Add |
| C5 | Age blocked (<18) | `booking_age_restricted` | ✅ Add |
| C6 | Consent withdrawn block | `booking_consent_withdrawn_block` | ✅ Add |
| C7 | Technical error | `booking_error` + message | ✅ Add |

**Supply-Demand Gap:**

| Metric | Formula | Action |
|--------|---------|--------|
| Unmet demand | Zero-result searches ÷ total searches | Add doctors in missing specialties |
| Slot fill rate | Booked ÷ available slots | Low → demand problem. High → supply problem |
| Wait time to next slot | Avg days to next available | >3 days → supply bottleneck |

---

## D. Pre-Consultation (No-Show Analysis)

| # | Failure | Event | Trackable |
|---|---------|-------|-----------|
| D1 | True no-show (never returned) | No session near appointment time | ✅ Backend |
| D2 | Late arrival (opened after window) | Session start > scheduled_at + 15min | ✅ Inferred |
| D3 | Join failed (clicked but errored) | `call_join_failed` + error | ✅ Add |
| D4 | Permission denied (camera/mic) | `call_permission_denied` + type | ✅ Add |
| D5 | Doctor no-show | Patient joined, doctor absent >10min | ✅ Add |

---

## E. Call Quality & Connectivity

| # | Failure | Event | Trackable |
|---|---------|-------|-----------|
| E1 | Call dropped | `call_disconnected` + duration_seconds | ✅ Add |
| E2 | Multiple rejoins | `call_rejoined` + rejoin_count | ✅ Add |
| E3 | Ultra-short call (<2min) | `call_ended` + duration <120s | ✅ Duration |
| E4 | Audio failure | Can't auto-detect | ❌ Need feedback |
| E5 | Video failure | `call_video_track_failed` | ⚠️ WebRTC |
| E6 | Poor quality (lag/pixelation) | WebRTC stats (bitrate, packet loss) | ⚠️ Advanced |

---

## F. Post-Consultation Gaps

| # | Failure | Event | Trackable |
|---|---------|-------|-----------|
| F1 | No prescription generated | `call_ended` → no `prescription_created` | ✅ Backend |
| F2 | Rx not shared/downloaded | `prescription_created` → no share event | ✅ Funnel |
| F3 | Review skipped (7+ days) | Completed + hasReviewed=false >7 days | ✅ Backend |
| F4 | Low review scores (all 😞/😕) | `review_submitted` + avg <2.5 | ✅ |
| F5 | No follow-up rebook | Doctor recommended but patient didn't return | ⚠️ Needs schema |

---

## G. Doctor-Side Failures

| # | Failure | Event | Trackable |
|---|---------|-------|-----------|
| G1 | Never set availability | Empty availability_schedule | ✅ DB |
| G2 | Empty schedule (0 bookings in 30d) | Query | ✅ Backend |
| G3 | Doctor no-show | Same as D5 | ✅ |
| G4 | Slow Rx (>24h after call) | Timestamps delta | ✅ Backend |
| G5 | Never approved by admin (>7d) | is_verified=false >7 days | ✅ DB |

---

## H. Value Perception & PMF Signals

### Post-Call Micro-Surveys (1 question each)

| When | Question | Options |
|------|----------|---------|
| After 1st booking | "What made you choose Medivera?" | Convenience / Price / Doctor quality / Recommendation |
| After 1st call | "Was this consultation worth the fee?" | Yes / Somewhat / No |
| After 2nd call | Sean Ellis: "How would you feel if Medivera was gone?" | Very / Somewhat / Not disappointed |
| 7d after call, no rebook | "Any reason you haven't booked again?" | Didn't need to / Too expensive / Bad experience |

### Alternative Comparison (Onboarding)
> *"Before Medivera, how did you consult a doctor?"*
> In-person / Another app (Practo, Apollo) / WhatsApp with known doctor / Self-medicated

### Retention Curve
Track weekly active users by cohort. **Curve flattens at 15%+ → PMF.**

---

## I. Growth & Virality

| Metric | Target | How |
|--------|--------|-----|
| Rx WhatsApp share rate | >15% | Already tracked |
| Referral signups (friend/family) | >20% of signups | "How did you hear?" |
| K-factor (invites × conversion) | >0.5 | Attribution tracking |
| Unprompted recommendations | Monitor | Scan review comments for "recommend" |
| Return visits without marketing | Growing | Sessions with no UTM |

**Viral Loop:**
```
Good consultation → Share Rx on WhatsApp → Friend sees Medivera branding → Signs up
```

---

## J. User Segments to Watch

| Segment | Definition | Action |
|---------|-----------|--------|
| **Power users** | 3+ consultations in 60d | Study their behavior |
| **One-and-done** | 1 consultation, never returned | Interview — why not? |
| **Window shoppers** | Signed up, browsed, never booked | Fee? Trust? Availability? |
| **Doctor loyalists** | Always same doctor | Strong relationship forming |

---

## Implementation Priority

### 🔴 Phase 1 — Add Now (Pre-Launch) ✅
- [x] `search_no_results` + query + specialization
- [x] `booking_no_slots_available`, `booking_age_restricted`
- [x] `call_join_attempted`, `call_join_failed`, `call_permission_denied`
- [x] `call_ended` + duration (ultra-short detection)
- [x] Signup source tracking ("How did you hear?")
- [ ] Time-to-first-booking calculation *(needs backend query, deferred)*

### 🟡 Phase 2 — At Launch ✅
- [x] Sean Ellis survey (after 2nd call)
- [x] "Worth the fee?" post-call micro-survey
- [x] Reusable MicroSurvey component with PostHog tracking
- [ ] Cohort retention tracking in PostHog *(PostHog dashboard config, no code needed)*
- [ ] Supply-demand gap dashboard *(PostHog dashboard config, data already captured)*

### 🟢 Phase 3 — Growth Phase ✅
- [x] Doctor feedback surveys (video quality, Rx writer, recommend colleagues)
- [x] Referral attribution (UTM params + referral code on signup)
- [x] Referral sharing (Copy Link + WhatsApp on profile page)
- [x] Churn signal enrichment (PostHog user properties: segment, booking count, loyalty)
- ❌ WebRTC quality stats *(blocked — iframe architecture)*
- ❌ Churn prediction model *(needs months of production data)*
