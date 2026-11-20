# YouTube-style MERN clone

A full-stack, dark-mode video-sharing application built with MongoDB, Express, React and Node.js. The UI is modeled on YouTube's desktop/mobile layout and common interaction patterns; it is an independent implementation, not Google's source code or a pixel-perfect copy of every YouTube feature.

## Implemented

- Dark YouTube-style shell: top search bar, collapsible sidebar, category chips, responsive video grid.
- Home feed, search results, Shorts-style feed, subscriptions feed, channel pages and watch page.
- Email/password registration and login with bcrypt password hashing and JWT sessions.
- Video uploads with optional thumbnail, category, tags and public/unlisted/private visibility.
- Video playback through the browser's native HTML5 player; static file serving supports range requests for seeking.
- Views and watch history, likes/dislikes, comments, channel subscriptions.
- Playlists, Watch later and liked videos.
- Creator Studio with upload counts/views, video list, title editing and deletion.
- API error handling, CORS configuration and basic API rate limiting.

## Requirements

- Node.js 20 or newer (Node 22 LTS recommended).
- MongoDB running locally, or a MongoDB Atlas connection string.
- npm.

## Run locally (Windows PowerShell)

1. Open a terminal in this project folder.
2. Install dependencies:

   ```powershell
   npm install
   npm install --prefix server
   npm install --prefix client
   ```

3. Create the server environment file:

   ```powershell
   Copy-Item server/.env.example server/.env
   ```

   Open `server/.env` and set `MONGO_URI` and a long random `JWT_SECRET`. The default local MongoDB URI works only when MongoDB is installed and running on your computer.

4. (Optional) Create the frontend environment file if you want to change the API URL:

   ```powershell
   Copy-Item client/.env.example client/.env
   ```

5. Start both applications from the project root:

   ```powershell
   npm run dev
   ```

6. Open **http://localhost:5173**. The Express API runs at **http://localhost:5000**.

To run them separately, use `npm run dev --prefix server` and `npm run dev --prefix client` in two terminals.

## First use

1. Create an account from **Sign in → Create account**.
2. Open **Create** or **Studio → Upload video**.
3. Choose an MP4/WebM/MOV/MKV video, add a title, and publish.
4. Open the video to test playback, comments, likes, subscriptions and Watch later.

A newly installed database is empty. The home page will remain empty until you upload videos or add your own seed data.

## Environment variables

### `server/.env`

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | Express port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/youtube_clone` |
| `JWT_SECRET` | JWT signing secret | Required |
| `CLIENT_URL` | Allowed frontend origin(s), comma-separated | `http://localhost:5173` |
| `MAX_UPLOAD_MB` | Maximum size per uploaded file | `512` |

### `client/.env`

`VITE_API_URL` sets the API base URL. Default: `http://localhost:5000/api`.

## API overview

| Method | Endpoint | Auth | Purpose |
|---|---|---:|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Sign in |
| GET | `/api/auth/me` | Yes | Current user |
| GET | `/api/videos` | Optional | Public feed/search |
| GET | `/api/videos/mine` | Yes | Current creator's videos |
| GET | `/api/videos/feed/subscriptions` | Yes | Subscriptions feed |
| GET | `/api/videos/:id` | Optional | Video detail |
| POST | `/api/videos/upload` | Yes | Upload video + thumbnail |
| POST | `/api/videos/:id/view` | Optional | Increment views / record history |
| POST | `/api/videos/:id/reaction` | Yes | Like or dislike |
| GET/POST | `/api/videos/:videoId/comments` | Optional/Yes | Read/create comments |
| GET | `/api/users/:handle` | Optional | Public channel |
| POST | `/api/users/:id/subscribe` | Yes | Subscribe/unsubscribe |
| GET | `/api/users/history` | Yes | Watch history |
| GET | `/api/users/watch-later` | Yes | Get Watch later videos |
| POST | `/api/users/watch-later/:videoId` | Yes | Toggle a video in Watch later |
| GET | `/api/users/liked` | Yes | Liked videos |
| GET/POST | `/api/playlists` | Yes | List/create playlists |
| POST | `/api/playlists/:id/videos` | Yes | Add video to playlist |
| DELETE | `/api/playlists/:id/videos/:videoId` | Yes | Remove playlist video |

## Project structure

```text
youtube-clone/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── components/     # Header, sidebar, cards, app shell
│       ├── context/        # Authentication context
│       ├── lib/            # API client and display helpers
│       └── pages/          # Home, watch, search, channel, Studio, etc.
└── server/                 # Express API
    ├── src/
    │   ├── config/         # MongoDB connection
    │   ├── middleware/     # JWT auth and Multer uploads
    │   ├── models/         # User, Video, Comment, Playlist
    │   └── routes/         # REST API endpoints
    └── uploads/            # Local development media storage
```

## Important production work before public launch

This is a functional portfolio starter, not a production-scale YouTube replacement. Before exposing it to the public:

- Move video files from `server/uploads` to durable object storage (S3, Cloudinary, or equivalent). Local disk can be ephemeral on many hosting platforms and is not shared across multiple server instances.
- Add background transcoding, adaptive bitrate streaming (HLS/DASH), thumbnails, moderation and upload scanning. Current playback serves the uploaded source file directly.
- Add refresh-token/session revocation, email verification, password reset, stronger abuse prevention and authorization tests.
- Add pagination/infinite scrolling, recommendation ranking, notifications, playlists UI controls, richer channel editing and complete mobile QA.
- Configure HTTPS, secure production CORS origins, backups, monitoring and CDN delivery.
- Review copyright, privacy, community guidelines and applicable legal requirements before accepting public uploads.

The name and branding are placeholders. Do not use Google's logos or claim that this is an official YouTube product.
