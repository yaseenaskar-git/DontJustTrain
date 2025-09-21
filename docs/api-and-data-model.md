# Data Models & API Contract (Draft)

This document outlines the initial data models and REST API endpoints for the DontJustTrain MVP.

Data models (Firestore-style, can be translated to SQL):

- Users
  - id (string)
  - name (string)
  - email (string)
  - role ("trainer" | "client")
  - passwordHash (string) -- server-only
  - createdAt (timestamp)

- Invites
  - token (string)
  - email (string)
  - inviterId (string)
  - createdAt (timestamp)
  - used (boolean)

- Exercises
  - id (string)
  - title (string)
  - description (string)
  - videoUrl (string) -- YouTube/Vimeo or storage URL
  - thumbnailUrl (string)
  - tags ([string])
  - createdBy (userId)
  - createdAt

- Workouts
  - id
  - title
  - description
  - exercises: [{ exerciseId, order, sets, reps, notes }]
  - createdBy
  - createdAt

- Programs
  - id
  - title
  - description
  - workouts: [{ workoutId, order, scheduledDate? }]
  - createdBy
  - createdAt

- Messages
  - id
  - from (userId)
  - to (userId) or threadId
  - text
  - media: [{ url, type }]
  - createdAt
  - read (boolean)

Storage
- Media (images, videos) stored in cloud storage (S3/Firebase Storage) and referenced by URL in the models.

API endpoints (REST) - authentication/auth flow omitted for brevity:

- Invites
  - POST /invites { email } -> { ok, invite: { email, token } }
  - GET /invites/accept?token= -> { ok, email, token }

- Users
  - POST /users/signup { token, name, password } -> { ok, user }
  - POST /auth/login { email, password } -> { ok, token }
  - GET /users/:id -> { user }

- Exercises
  - POST /exercises { title, description, videoUrl, tags } -> { exercise }
  - GET /exercises -> [exercises]
  - GET /exercises/:id -> exercise
  - PUT /exercises/:id -> exercise
  - DELETE /exercises/:id -> { ok }

- Workouts
  - POST /workouts { title, exercises } -> { workout }
  - GET /workouts -> [workouts]
  - GET /workouts/:id -> workout
  - PUT /workouts/:id -> workout
  - DELETE /workouts/:id

- Programs
  - POST /programs { title, workouts } -> { program }
  - GET /programs -> [programs]
  - GET /programs/:id -> program
  - PUT /programs/:id -> program
  - DELETE /programs/:id

- Messaging (real-time planned; fallback to polling REST)
  - POST /messages { from, to, text, media[] } -> { message }
  - GET /messages?threadId= or ?userId= -> [messages]

Edge cases and notes:
- Invite tokens should expire after a configurable period (e.g., 7 days).
- Emails sent via SendGrid; fall back to logging in dev.
- Media uploads should create short-lived signed upload URLs (pre-signed S3 or Firebase upload tokens).
- Consider using JWT for auth and refresh tokens for session management.

Next: implement exercises and workouts endpoints and a small seed script. Then add auth (JWT) and secure endpoints.
