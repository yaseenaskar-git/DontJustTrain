DontJustTrain - Backend

Environment:
- Optionally set SENDGRID_API_KEY to enable real emails.
 - To use Postgres, set DATABASE_URL (e.g. postgres://user:pass@host:5432/dbname). Run `npm run migrate` to create tables.
 - Messaging & uploads:
	 - Socket.io is available on the same server. Clients should connect and `join` room `user:<id>` to receive messages.
	 - Uploads are saved to disk under `packages/backend/data/uploads` in development. POST a form-data `file` to `/uploads` to receive a `{ url }` usable in messages or exercise media.
	 - For production, replace disk uploads with S3: provide S3 bucket + credentials, upload files to S3 and return the S3 URL instead. (I can add S3 integration next.)
	- Socket authentication: sockets must now include a valid JWT in the connect `auth` payload: `io(url, { auth: { token: '<jwt>' } })`. The server will validate the token and attach the user to the socket.
	- S3 integration: to enable S3 uploads set the following env vars before starting the backend:
		- AWS_REGION (e.g. us-east-1)
		- S3_BUCKET (your bucket name)
		- AWS_ACCESS_KEY_ID
		- AWS_SECRET_ACCESS_KEY
		- When these are present, uploads will be sent to S3 and the local file removed. Returned URL will be the S3 public URL.
		- New endpoints:
			- GET /auth/me
				- Requires Authorization: Bearer <token>
				- Returns { ok: true, user: { id, name, email } }
				- Useful for the client to resolve the current user's id and auto-join socket rooms.
			- POST /uploads/presign
				- Requires body { name, contentType }
				- Returns { ok: true, url, key } where `url` is a presigned PUT URL the client can use to upload directly to S3.
				- If S3 env vars are not configured this endpoint will not be available (server returns 400).

Quick start:

```powershell
cd packages/backend
npm install
npm run dev
```

Endpoints:
- POST /invites { email } - create invite and send email (or log link)
- GET /invites/accept?token= - check invite token
- POST /users/signup { token, name, password } - complete signup using invite

Auth & exercises:
- POST /auth/login { email, password } -> { token }
- Use Authorization: Bearer <token> header to access protected endpoints

- Exercises endpoints:
	- GET /exercises -> list
	- POST /exercises { title, description, videoUrl, tags } -> create (protected)
	- PUT /exercises/:id -> update (protected)
	- DELETE /exercises/:id -> delete (protected)
	- POST /exercises/seed -> create sample exercises (dev only)

Data store:
- Simple JSON files stored in `packages/backend/data` (invites.json, users.json). Designed for development only.
