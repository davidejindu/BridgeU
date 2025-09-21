import express from "express";
import { createServer } from "http";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the main project directory (one level up from backend)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";

import authRoutes from "./routes/auth.js";
import profileAuthRoutes from "./routes/profileauth.js";
import learningRoutes from "./routes/learning.js";
import messagingRoutes from "./routes/messagingRoute.js";
import connectionRoutes from "./routes/connections.js";
import { sql } from "./config/db.js";
import { initializeSocketIO } from "./socketio.js";

const app = express();
const PORT = process.env.PORT || 8000;

// If behind a proxy (Render/Heroku/Fly/etc.), enable this so secure cookies work
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// JSON, security, logs
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

// CORS: allow cookies
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow localhost on any port for development
      if (origin.match(/^http:\/\/localhost:\d+$/)) {
        return callback(null, true);
      }
      
      // Allow specific production domains if needed
      const allowedOrigins = [
        "http://localhost:3000", 
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:5175",
        "https://steelhacks-git-main-david-ejindus-projects.vercel.app"
      ];
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// ----- Sessions (Postgres store) -----
const { Pool } = pg;
const {PGHOST, PGDATABASE, PGUSER, PGPASSWORD} = process.env;
const pool = new Pool({
  connectionString: `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require&channel_binding=require`,
  ssl: { require: true, rejectUnauthorized: false }
});

const PgStore = connectPgSimple(session);

app.use(
  session({
    store: new PgStore({ pool, tableName: "session" }),
    name: "sid",
    secret: process.env.SESSION_SECRET || "change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax", // Use 'lax' for same-origin requests
      secure: false, // Set to false for localhost development
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      domain: "localhost", // Explicitly set domain
    },
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profileauth", profileAuthRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/messages", messagingRoutes);
app.use("/api/connections", connectionRoutes);

// ----- DB init -----
// ----- DB init -----
async function initializeDB() {
    try {
      await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username   TEXT NOT NULL UNIQUE,
          first_name TEXT NOT NULL,
          last_name  TEXT NOT NULL,
          country    TEXT NOT NULL,
          university TEXT NOT NULL,
          password   TEXT NOT NULL,
          biography  TEXT,
          interests  TEXT[] DEFAULT '{}',
          academic_year TEXT DEFAULT 'Freshman',
          major      TEXT DEFAULT 'Undeclared',
          languages  JSONB DEFAULT '[]',
          looking_for TEXT[] DEFAULT '{}',
          connections UUID[] DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ
        )
      `;
  
      // Ensure columns exist if table predated this change
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS biography TEXT`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}'`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT 'Freshman'`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS major TEXT DEFAULT 'Undeclared'`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS looking_for TEXT[] DEFAULT '{}'`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS connections UUID[] DEFAULT '{}'`;
      
      // Update existing users to have default values for new columns
      await sql`UPDATE users SET major = 'Undeclared' WHERE major IS NULL`;
      await sql`UPDATE users SET academic_year = 'Freshman' WHERE academic_year IS NULL`;
      await sql`UPDATE users SET interests = '{}' WHERE interests IS NULL`;
      await sql`UPDATE users SET languages = '[]' WHERE languages IS NULL`;
      await sql`UPDATE users SET looking_for = '{}' WHERE looking_for IS NULL`;
      await sql`UPDATE users SET connections = '{}' WHERE connections IS NULL`;
  
      await sql`
        CREATE TABLE IF NOT EXISTS "session" (
          "sid"    varchar NOT NULL,
          "sess"   json NOT NULL,
          "expire" timestamp(6) NOT NULL,
          PRIMARY KEY ("sid")
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")`;
  

       // Conversations table
       await sql`
       CREATE TABLE IF NOT EXISTS "conversations" (
         "conversation_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         "member_ids" UUID[] NOT NULL,
         "last_message" TEXT NOT NULL,
         "last_message_time" TIMESTAMP NOT NULL DEFAULT NOW(),
         "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
       )
     `;

     // Messages table
     await sql`
       CREATE TABLE IF NOT EXISTS "messages" (
         "message_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         "conversation_id" UUID NOT NULL,
         "sender_id" UUID NOT NULL,
         "message" TEXT NOT NULL,
         "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
       )
     `;

    // Message notifications table
    await sql`
      CREATE TABLE IF NOT EXISTS "message_notifications" (
        "id" SERIAL PRIMARY KEY,
        "user_id" UUID NOT NULL UNIQUE,
        "message_ids" UUID[] NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Learning content table
    await sql`
      CREATE TABLE IF NOT EXISTS "learning_content" (
        "content_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "subcategory_id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "difficulty" TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
        "user_id" UUID REFERENCES users(id) ON DELETE CASCADE,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Add user_id column if it doesn't exist (for existing databases)
    await sql`
      ALTER TABLE "learning_content" 
      ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES users(id) ON DELETE CASCADE
    `;

     // Quiz questions table
     await sql`
       CREATE TABLE IF NOT EXISTS "quiz_questions" (
         "question_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         "subcategory_id" TEXT NOT NULL,
         "content_id" UUID REFERENCES learning_content(content_id) ON DELETE CASCADE,
         "question" TEXT NOT NULL,
         "options" JSONB NOT NULL,
         "correct_answer" TEXT NOT NULL,
         "explanation" TEXT,
         "difficulty" TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
         "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
       )
     `;

     // User learning progress table
     await sql`
       CREATE TABLE IF NOT EXISTS "user_learning_progress" (
         "progress_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         "user_id" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
         "subcategory_id" TEXT NOT NULL,
         "content_id" UUID REFERENCES learning_content(content_id) ON DELETE CASCADE,
         "completed_at" TIMESTAMP NOT NULL DEFAULT NOW(),
         "time_spent" INTEGER DEFAULT 0,
         UNIQUE(user_id, content_id)
       )
     `;

     // User quiz attempts table
     await sql`
       CREATE TABLE IF NOT EXISTS "user_quiz_attempts" (
         "attempt_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         "user_id" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
         "subcategory_id" TEXT NOT NULL,
         "score" INTEGER NOT NULL,
         "total_questions" INTEGER NOT NULL,
         "answers" JSONB NOT NULL,
         "completed_at" TIMESTAMP NOT NULL DEFAULT NOW()
       )
     `;

     // Connection requests table
     await sql`
       CREATE TABLE IF NOT EXISTS "connection_requests" (
         "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         "requester_id" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
         "target_id" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
         "status" TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
         "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
         "updated_at" TIMESTAMP DEFAULT NOW(),
         UNIQUE(requester_id, target_id)
       )
     `;

     
      console.log("DB initialized successfully");
    } catch (error) {
      console.error("Error initializing DB", error);
    }
  };
  

  initializeDB().then(() => {
    // Create HTTP server
    const server = createServer(app);
    
    // Initialize Socket.IO
    const { io } = initializeSocketIO(server);
    
    // Make io available to routes/controllers
    app.set('io', io);
    
    server.listen(PORT, () => {
      console.log("server is running on port " + PORT);
    });
});
