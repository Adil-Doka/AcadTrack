# AcadTrack Frontend

A modern, high-craft web application for academic capstone project tracking and evaluation, inspired by contemporary SaaS platforms (Linear, ProjectEase, Notion).

---

## 🎨 Design System & Aesthetics
- **Style Direction:** Clean SaaS dashboard with soft slate surfaces (`#f8fafc`), deep charcoal slate typography (`#0f172a`), refined borders (`#e2e8f0`), and soft indigo accents (`#4f46e5`).
- **No Neon/Cyberpunk:** Designed with subtle typography, soft card shadows, and gentle state badges.
- **Animations:** Fluid page transitions, staggered KPI entries, modal spring scale animations, and subtle status pulsing powered by **Framer Motion**.

---

## 🚀 Key Features

### 👨‍🎓 Student Experience
1. **Interactive Dashboard:**
   - Real-time team, project, and phase progress trackers.
   - Calculated aggregate evaluation score with animated progress bar.
   - Upcoming phase countdowns and deadline urgency tags.
2. **Team Workspace:**
   - Form and name project groups.
   - Invite peers by student PNR.
   - Leader access controls with submit-for-review checks.
3. **Project Proposition:**
   - Scope definition, abstract, and technology stack tags.
   - GitHub integration widget with stars, forks, commit count, and sync button.
4. **Phases & Deliverable Uploads:**
   - Multi-file drag-and-drop artifact uploads (PDF, DOCX, PPTX, ZIP).
   - Milestone rubric display and submission history review.
5. **Evaluations & Feedback:**
   - Criteria-wise rubric scorecards with coordinator remarks.

---

### 👨‍🏫 Coordinator Experience
1. **Command Dashboard:**
   - Real-time approval queues for pending teams and project propositions.
   - Quick one-click approvals from the dashboard.
2. **Academic Cycles:**
   - Semester configuration (dates, academic year, active toggle).
3. **Team Roster Verification:**
   - Approve, review, reject (with structured feedback), or reopen teams.
4. **Project Topic Governance:**
   - Validate proposed architecture, stack, and abstract.
5. **Phase & Rubric Milestones:**
   - Phase sequence and strict deadlines.
   - Manage criteria points (Innovation, Technical Depth, Documentation, Presentation).
   - Audit trail of deadline adjustments and historical reasons.
6. **Assessment & Grading Console:**
   - Inspect and download uploaded deliverables.
   - Grade per criterion with individual remarks.
   - Draft vs. official publication of grades to student portals.

---

## 🛠️ Tech Stack
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4 + Tailwind Merge + Lucide Icons
- **State & Data Fetching:** Zustand (persisted auth session) + TanStack React Query
- **Routing:** React Router v7
- **Toasts & Feedback:** React Hot Toast
- **Animations:** Framer Motion

---

## 💻 Running the Application

### Prerequisites
Make sure the Spring Boot backend (`AcadTrack`) is running on `http://localhost:8080`.

### Development Server
```bash
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
npm run build
npm run preview
```

### Default Credentials (from backend seed)
- **Coordinator Email/PNR:** `COORD001`
- **Coordinator Password:** `Coordinator@123`
- Or register a new student account via the `/register` page!

