```markdown
# DontJustTrain

DontJustTrain is a starter monorepo for a trainer-client platform (web + mobile + backend).

Chosen defaults for the MVP:
- Backend: Node.js + Express (easy to extend) with option to migrate to Postgres or Firebase later
- Auth & invites: draft flow using email invites (SendGrid recommended)
- Video hosting: YouTube/Vimeo embeds for quick start; optional cloud storage for uploads
- Mobile: Expo (React Native) for cross-platform mobile app

Quick start (Windows PowerShell):

1. Install project dependencies at the repo root (uses npm workspaces):

```powershell
npm install
```

2. Start the backend in one terminal:

```powershell
npm run dev:backend
```

3. Start the web app in another terminal:

```powershell
npm run dev:web
```

4. Start the mobile app (requires Expo CLI) in another terminal:

```powershell
npm run dev:mobile
```

What I implemented now:
- Monorepo scaffold with `packages/backend`, `packages/web`, and `packages/mobile` starters
- Basic Express backend with a health route
- Next.js web starter page
- Expo mobile starter app

Next steps (I'll work on these next):
1. Design data models & API contract for Users, Invites, Exercises, Workouts, Programs, Messages, and Media
2. Implement onboarding/invite flow (invite API + email sending + signup)
3. Exercise library CRUD with video embeds
4. Workout & program composition UI and APIs
5. Messaging with media (chat)

If you want, I can now:
- Implement the invite flow end-to-end using SendGrid and a temporary invite token table
- Or design the Firestore schema instead if you'd prefer Firebase as the backend

Tell me which of the two you'd prefer next: implement invite flow now or finalize the data model/API contract?
