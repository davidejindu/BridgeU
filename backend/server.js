import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";

import authRoutes from "./routes/auth.js";
import profileAuthRoutes from "./routes/profileauth.js";
import { sql } from "./config/db.js";

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
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5175"], // add your frontend URL(s)
    credentials: true,
  })
);

// ----- Sessions (Postgres store) -----
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,     // must include ?sslmode=require
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
      sameSite: "lax", // if frontend is on a different domain, use 'none' and set secure: true
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profileauth", profileAuthRoutes);

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
          biography  TEXT,                          -- <-- NEW (nullable)
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ
        )
      `;
  
      // Ensure columns exist if table predated this change
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS biography TEXT`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}'`;
  
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
     
      console.log("DB initialized successfully");
    } catch (error) {
      console.error("Error initializing DB", error);
    }
  };
  

initializeDB().then(() => {
  app.listen(PORT, () => {
    console.log("server is running on port " + PORT);
  });
});
