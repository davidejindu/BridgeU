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
    origin: ["http://localhost:3000"], // add your frontend URL(s)
    credentials: true,
  })
);

// ----- Sessions (Postgres store) -----
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false }, // uncomment if your PG requires SSL
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

// ----- DB init -----
async function initializeDB() {
    try {
      // 1) extension
      await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  
      // 2) users table
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username TEXT NOT NULL UNIQUE,
          first_name TEXT NOT NULL,
          last_name  TEXT NOT NULL,
          country TEXT NOT NULL,
          university TEXT NOT NULL,
          password TEXT NOT NULL, -- storing bcrypt hash
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ
        )
      `;
  
      // 3) session table + index
      await sql`
        CREATE TABLE IF NOT EXISTS "session" (
          "sid"    varchar NOT NULL,
          "sess"   json NOT NULL,
          "expire" timestamp(6) NOT NULL,
          PRIMARY KEY ("sid")
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")`;
  
      console.log("DB initialized successfully");
    } catch (error) {
      console.error("Error initializing DB", error);
    }
  }
  

initializeDB().then(() => {
  app.listen(PORT, () => {
    console.log("server is running on port " + PORT);
  });
});
