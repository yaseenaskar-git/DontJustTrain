# DontJustTrain

A responsive web application connecting betwen me (a personal trainer) and my clients, mainly for assigning workouts and tracking progress. 

### Technologies Used:

1- JavaScript:  Main programming language used for both backend (server logic) and frontend (website functionality).

2- Node.js: Runtime environment, allowing JS to run outside of the browser

3- Next.js: Building the frontend of the website

4- npm (Node Package Manager): Manages project dependencies (external libraries and frameworks)

5- JSON (JavaScript Object Notation): Used in package.json to define scripts, dependencies, and project configuration

6- Socket.IO: Library for real-time communication between users and the backend (e.g., live chat feature)

7- Multer: Middleware for handling file uploads (e.g., images, documents) through the backend

8- Auth & invites: draft flow using email invites (SendGrid recommended)

9- Video hosting: YouTube/Vimeo embeds for quick start; optional cloud storage for uploads

### Quick start (Windows PowerShell):

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

What I implemented now:
- Monorepo scaffold with `packages/backend` and `packages/web` starters (mobile removed)
- Basic Express backend with a health route
- Next.js web starter page
- Expo mobile starter app


