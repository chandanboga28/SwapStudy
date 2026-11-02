# SwapStudy 🎓✨

> **"Learn a skill. Teach a skill. Grow together."**

SwapStudy is a student-to-student skill exchange platform where students teach what they know to earn platform credits—and spend those credits to learn whatever they want from motivated peers. **No tuition bills, no credit cards, 100% peer-to-peer.**

---

## 🌟 The Core Exchange Model

```
                    ┌─────────────────────────┐
                    │ Chandan teaches Python  │
                    │   to a peer student     │
                    └───────────┬─────────────┘
                                │ Earns +3 Credits
                                ▼
                    ┌─────────────────────────┐
                    │     Platform Wallet     │
                    │   3 Credits Available   │
                    └───────────┬─────────────┘
                                │ Spends -3 Credits
                                ▼
                    ┌─────────────────────────┐
                    │  Chandan learns UI/UX   │
                    │   from Sophia Chen      │
                    └─────────────────────────┘
```

- **Every student is both a teacher and a learner.**
- **Fair Credit Exchange:** 1 hour of teaching = 1 to 3 credits; 1 hour of learning = 1 to 3 credits.
- **Starter Grant:** 3 free credits upon signup so new students can immediately book their first session.
- **Escrow Guarantee:** Credits are held in escrow during scheduling and released only when the student confirms the session is completed and submits peer review feedback.

---

## 🚀 Pages & Workflows Built

1. **Homepage (`/`)**:
   - Hero section with headline *"Your skills are worth sharing."*
   - Interactive live exchange demo card.
   - 3-step *How It Works* breakdown.
   - Featured skills grid: Python Programming, UI/UX Design & Figma, Modern Web Development, Video Editing, Public Speaking, and Data Structures & Algorithms.
   - Student testimonials and community values.

2. **Explore Skills Directory (`/skills`)**:
   - Live search by title, topic tags, teacher name, or university.
   - Multi-category pills (Programming & Tech, Design, Academics, Media, Business).
   - Filter by skill level and credit cost limit.
   - Sort by popularity, top rating, or lowest credits.

3. **Skill Details & Booking (`/skills/[id]`)**:
   - Comprehensive syllabus & topic breakdown.
   - Teacher profile, university affiliation, and verified peer rating.
   - Interactive booking modal with credit balance check, date/time picker, and notes.

4. **Offer to Teach a Skill (`/teach`)**:
   - Create custom skill listings with topics outline, duration, prerequisites, and credit rate (1-3 Cr/hr).
   - Instant publication to the marketplace.

5. **Student Dashboard (`/dashboard`)**:
   - Credit balance card with quick link to ledger.
   - Hours taught, hours learned, and peer reputation rating.
   - Incoming teaching requests with 1-click Accept / Decline.
   - Upcoming confirmed sessions with video room links.
   - Recommended skills matching the student's wishlist.

6. **My Sessions (`/sessions`)**:
   - Tabbed view: **As Learner** and **As Teacher**.
   - Filter by status: Confirmed, Pending, Completed.
   - Launch video room and interactive *"Mark Complete & Release Credits"* modal with 5-star rating & review feedback.

7. **Platform Credits & Ledger (`/credits`)**:
   - Explanation of the credit economy, non-monetary rules, and escrow guarantee.
   - Complete transaction audit trail (Earned, Spent, Refunded, Starter Grant).

8. **Authentication (`/login` & `/signup`)**:
   - Support for Supabase Auth via environment variables.
   - Interactive Local Demo Sandbox with pre-configured student accounts (Chandan, Sophia, Alex) and 1-click login.
   - Registration flow capturing university, major, and teach/learn skill tags with automatic 3 starter credits.

9. **Student Profile (`/profile`)**:
   - Edit university, degree, major, graduation year, and bio.
   - Interactive management of "Skills I Can Teach" and "Skills I Wish to Learn".

---

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router with Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 with Inter typography and emerald accent palette
- **Icons:** Lucide React
- **Authentication:** Supabase Auth ready with local interactive sandbox fallback

---

## 💻 Getting Started Locally

### 1. Install dependencies:
```bash
npm install
```

### 2. Configure Environment Variables (Optional):
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(If left blank, SwapStudy automatically runs in Interactive Demo Sandbox mode with zero setup required).*

### 3. Start Development Server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production:
```bash
npm run build
npm start
```