import {neon} from "@neondatabase/serverless";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the main project directory (two levels up from config)
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const {PGHOST, PGDATABASE, PGUSER, PGPASSWORD} = process.env;

export const sql = neon(
    `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require&channel_binding=require`
  );