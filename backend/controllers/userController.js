// backend/controllers/userController.js
import { sql } from "../config/db.js";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";

/* ========= Validation ========= */
export const validateRegistration = [
  body("username")
    .isLength({ min: 3, max: 30 }).withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-z0-9_]+$/).withMessage("Username can only contain lowercase letters, numbers, and underscores"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  body("firstName").notEmpty().withMessage("First name is required")
    .isLength({ min: 1, max: 50 }).withMessage("First name must be between 1 and 50 characters"),
  body("lastName").notEmpty().withMessage("Last name is required")
    .isLength({ min: 1, max: 50 }).withMessage("Last name must be between 1 and 50 characters"),
  body("country").notEmpty().withMessage("Country is required")
    .isLength({ min: 1, max: 100 }).withMessage("Country must be between 1 and 100 characters"),
  body("university").notEmpty().withMessage("University is required")
    .isLength({ min: 1, max: 200 }).withMessage("University must be between 1 and 200 characters"),
];

export const validateLogin = [
  body("username").notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

/* ========= Controllers ========= */

// Register
export const registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    const { username, password, firstName, lastName, country, university } = req.body;

    const existingUser = await sql`SELECT id FROM users WHERE username = ${username.toLowerCase()}`;
    if (existingUser.length > 0) {
      return res.status(409).json({ success: false, message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await sql`
      INSERT INTO users (username, password, first_name, last_name, country, university)
      VALUES (${username.toLowerCase()}, ${hashedPassword}, ${firstName}, ${lastName}, ${country}, ${university})
      RETURNING id, username, first_name, last_name, country, university, created_at
    `;

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser[0].id,
        username: newUser[0].username,
        firstName: newUser[0].first_name,
        lastName: newUser[0].last_name,
        country: newUser[0].country,
        university: newUser[0].university,
        createdAt: newUser[0].created_at,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ success: false, message: "Internal server error during registration" });
  }
};

// Me
export const me = (req, res) => {
  if (!req.session?.user) return res.json({ authenticated: false });
  return res.json({ authenticated: true, user: req.session.user });
};

// Logout
export const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ success: false, message: "Could not log out" });
    }
    res.clearCookie("sid");
    return res.json({ success: true, message: "Logged out" });
  });
};

// Login
export const loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    const { username, password } = req.body;

    const user = await sql`
      SELECT id, username, password, first_name, last_name, country, university, created_at
      FROM users
      WHERE username = ${username.toLowerCase()}
    `;
    if (user.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    // set session BEFORE responding
    req.session.user = { id: user[0].id, username: user[0].username };

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user[0].id,
        username: user[0].username,
        firstName: user[0].first_name,
        lastName: user[0].last_name,
        country: user[0].country,
        university: user[0].university,
        createdAt: user[0].created_at,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Internal server error during login" });
  }
};

// Single profile
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await sql`
      SELECT id, username, first_name, last_name, country, university, created_at
      FROM users
      WHERE id = ${userId}
    `;
    if (user.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user[0].id,
        username: user[0].username,
        firstName: user[0].first_name,
        LastName: user[0].last_name,
        country: user[0].country,
        university: user[0].university,
        createdAt: user[0].created_at,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// All users (filters + pagination)
export const getAllUsers = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit ?? 24, 10) || 24, 100);
    const offset = parseInt(req.query.offset ?? 0, 10) || 0;
    const q = req.query.q?.trim();
    const university = req.query.university?.trim();
    const country = req.query.country?.trim();

    // Get the current user's ID from session (if logged in)
    const currentUserId = req.session?.user?.id;

    const where = sql`
      1=1
      ${currentUserId ? sql`AND id != ${currentUserId}` : sql``}
      ${q ? sql`AND (username ILIKE ${'%' + q + '%'} OR first_name ILIKE ${'%' + q + '%'} OR last_name ILIKE ${'%' + q + '%'})` : sql``}
      ${university ? sql`AND university ILIKE ${'%' + university + '%'}` : sql``}
      ${country ? sql`AND country ILIKE ${'%' + country + '%'}` : sql``}
    `;

    const totalResult = await sql`SELECT COUNT(*)::int AS count FROM users WHERE ${where}`;
    const total = totalResult[0].count;

    const rows = await sql`
      SELECT id, username, first_name, last_name, country, university, created_at
      FROM users
      WHERE ${where}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const users = rows.map(u => ({
      id: u.id,
      username: u.username,
      firstName: u.first_name,
      lastName: u.last_name,
      country: u.country,
      university: u.university,
      createdAt: u.created_at,
    }));

    return res.json({ success: true, total, limit, offset, users });
  } catch (err) {
    console.error("getAllUsers error:", err);
    return res.status(500).json({ success: false, message: "Internal server error fetching users" });
  }
};