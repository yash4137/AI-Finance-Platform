# AI Finance Platform

AI Finance Platform is a full-stack personal finance web app for tracking transactions, analyzing spending, and generating smart reports with AI-powered insights.

## Features

- Secure authentication with email/password and Google OAuth
- Transaction management (create, update, duplicate, delete, bulk import)
- Receipt scanning with OCR and AI-assisted extraction
- Dashboard analytics with charts and category breakdown
- Report generation with AI-generated financial insights
- Scheduled reporting support via cron jobs
- User profile management with Cloudinary image upload
- Protected routes and token-based API authorization

## Tech Stack

### Frontend

- React 19 + Vite
- Redux Toolkit + RTK Query
- React Router
- Tailwind CSS 4 + Radix UI
- Recharts

### Backend

- Node.js + Express
- MongoDB + Mongoose
- Passport JWT + Google OAuth
- Zod validation
- Tesseract OCR + Google GenAI (Gemini)
- Resend (email) + Cloudinary (media)
- Node-cron

## Project Structure
.
|- frontend/ # React app
|- backend/ # Express API
|- README.md

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd AI-Finance-Platform
```

### 2. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Environment Variables

Create a .env file in backend/:

```env
NODE_ENV=development
PORT=8000
BASE_PATH=/api
MONGO_URI=mongodb://localhost:27017/ai-finance

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

GEMINI_API_KEY=your_gemini_api_key

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

RESEND_API_KEY=your_resend_api_key
RESEND_MAILER_SENDER=no-reply@yourdomain.com

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

FRONTEND_ORIGIN=http://localhost:5173
```

Create a .env file in frontend/:

```env
VITE_API_URL=http://localhost:8000/api
VITE_REDUX_PERSIST_SECRET_KEY=your_redux_persist_secret
```

## Run the App

Start backend:

```bash
cd backend
npm run dev
```

Start frontend in a new terminal:

```bash
cd frontend
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:8000

## API Modules

Base path: /api

- /auth: register, login, Google OAuth
- /user: current user and profile update
- /transaction: CRUD, bulk upload/delete, receipt scan
- /report: generate report, report history, schedule settings
- /analytics: summary, trend charts, expense breakdown

## Notes

- Most API routes are protected with JWT authentication.
- Cron jobs are initialized in development mode on server startup.
- Receipt scanning uses OCR with AI parsing and fallback extraction logic.

## License

This project is licensed under the ISC License.
