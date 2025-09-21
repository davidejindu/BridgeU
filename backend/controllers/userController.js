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
    console.log("Getting profile for user ID:", userId);

    // First try with basic columns to see if user exists
    const user = await sql`
      SELECT id, username, first_name, last_name, country, university, connections, created_at
      FROM users
      WHERE id = ${userId}
    `;
    console.log("Query result:", user.length, "users found");
    
    if (user.length === 0) {
      console.log("User not found in database");
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user[0].id,
        username: user[0].username,
        firstName: user[0].first_name,
        lastName: user[0].last_name,
        country: user[0].country,
        university: user[0].university,
        biography: '',
        interests: [],
        academicYear: 'Student',
        major: 'Undeclared',
        languages: [],
        lookingFor: [],
        connections: user[0].connections || [],
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
    console.log("getAllUsers called with query:", req.query);

    const limit = Math.min(parseInt(req.query.limit ?? 24, 10) || 24, 100);
    const offset = parseInt(req.query.offset ?? 0, 10) || 0;
    const q = req.query.q?.trim();
    const university = req.query.university?.trim();
    const country = req.query.country?.trim();

    // Logged-in user (for personalization)
    const currentUserId = req.session?.user?.id || null;
    console.log("Current user ID:", currentUserId);

    // Pull current user's profile for scoring
    let currentProfile = {
      university: null,
      country: null,
      interests: [],
      lookingFor: [],
      major: null,
      languages: [], // [{ name, level }, ...]
    };

    if (currentUserId) {
      const me = await sql/*sql*/`
        SELECT university, country, interests, looking_for, major, languages
        FROM users
        WHERE id = ${currentUserId}
        LIMIT 1
      `;
      if (me.length) {
        currentProfile = {
          university: me[0].university || null,
          country: me[0].country || null,
          interests: Array.isArray(me[0].interests) ? me[0].interests : [],
          lookingFor: Array.isArray(me[0].looking_for) ? me[0].looking_for : [],
          major: me[0].major || null,
          languages: Array.isArray(me[0].languages) ? me[0].languages : [],
        };
      }
    }

    // Normalize arrays for overlap checks (lowercased)
    const myInterestsLower = (currentProfile.interests || []).map((s) =>
      String(s).toLowerCase()
    );
    const myLookingLower = (currentProfile.lookingFor || []).map((s) =>
      String(s).toLowerCase()
    );
    const myLangsLower = (currentProfile.languages || [])
      .map((l) =>
        (l?.name || l?.language || "").toString().trim().toLowerCase()
      )
      .filter(Boolean);

    // WHERE clause
    const where = sql/*sql*/`
      1=1
      ${currentUserId ? sql/*sql*/`AND id != ${currentUserId}` : sql``}
      ${
        q
          ? sql/*sql*/`AND (
              username ILIKE ${"%" + q + "%"} OR
              first_name ILIKE ${"%" + q + "%"} OR
              last_name  ILIKE ${"%" + q + "%"}
            )`
          : sql``
      }
      ${
        university
          ? sql/*sql*/`AND university ILIKE ${"%" + university + "%"}`
          : sql``
      }
      ${country ? sql/*sql*/`AND country ILIKE ${"%" + country + "%"}` : sql``}
    `;

    // Count
    const totalResult = await sql/*sql*/`
      SELECT COUNT(*)::int AS count
      FROM users
      WHERE ${where}
    `;
    const total = totalResult[0].count;

    // Weights (tweak as you like)
    const W = {
      uni: 10,
      country: 8,
      interestAny: 6,  // any overlap
      lookingAny: 4,   // any overlap
      major: 5,
      languageAny: 3,  // any overlap by language name
    };

    // Score parts
    const uniScore = currentProfile.university
      ? sql/*sql*/`(CASE WHEN university = ${currentProfile.university} THEN ${W.uni} ELSE 0 END)`
      : sql/*sql*/`0`;

    const countryScore = currentProfile.country
      ? sql/*sql*/`(CASE WHEN country = ${currentProfile.country} THEN ${W.country} ELSE 0 END)`
      : sql/*sql*/`0`;

    const majorScore = currentProfile.major
      ? sql/*sql*/`(CASE WHEN major = ${currentProfile.major} THEN ${W.major} ELSE 0 END)`
      : sql/*sql*/`0`;

    // interests & looking_for are TEXT[]; case-insensitive overlap using ANY($param)
    const interestsScore =
      myInterestsLower.length > 0
        ? sql/*sql*/`
          (
            CASE WHEN EXISTS (
              SELECT 1
              FROM UNNEST(COALESCE(interests, '{}')) AS i
              WHERE LOWER(i) = ANY(${myInterestsLower})
            ) THEN ${W.interestAny} ELSE 0 END
          )`
        : sql/*sql*/`0`;

    const lookingForScore =
      myLookingLower.length > 0
        ? sql/*sql*/`
          (
            CASE WHEN EXISTS (
              SELECT 1
              FROM UNNEST(COALESCE(looking_for, '{}')) AS lf
              WHERE LOWER(lf) = ANY(${myLookingLower})
            ) THEN ${W.lookingAny} ELSE 0 END
          )`
        : sql/*sql*/`0`;

    // languages is JSONB array of objects; compare by lowercased name
    const languagesScore =
      myLangsLower.length > 0
        ? sql/*sql*/`
          (
            CASE WHEN EXISTS (
              SELECT 1
              FROM JSONB_ARRAY_ELEMENTS(COALESCE(languages, '[]'::jsonb)) AS l
              WHERE LOWER(COALESCE(l->>'name', l->>'language', '')) = ANY(${myLangsLower})
            ) THEN ${W.languageAny} ELSE 0 END
          )`
        : sql/*sql*/`0`;

    console.log("Executing main query...");
    const rows = await sql/*sql*/`
      SELECT
        id,
        username,
        first_name,
        last_name,
        country,
        university,
        biography,
        interests,
        academic_year,
        major,
        looking_for,
        languages,
        created_at,

        ${uniScore}        AS uni_score,
        ${countryScore}    AS country_score,
        ${interestsScore}  AS interests_score,
        ${lookingForScore} AS looking_for_score,
        ${majorScore}      AS major_score,
        ${languagesScore}  AS languages_score,

        (
          ${uniScore}
        + ${countryScore}
        + ${interestsScore}
        + ${lookingForScore}
        + ${majorScore}
        + ${languagesScore}
        ) AS match_score

      FROM users
      WHERE ${where}
      ORDER BY match_score DESC, created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    console.log("Query executed successfully, found", rows.length, "users in page");

    // No filtering: return everyone in this page.
    // We'll just add a detailed breakdown for the top 3 in this page.
    const top3Ids = new Set(rows.slice(0, 3).map((r) => r.id));

    const users = rows.map((u) => {
      const base = {
        id: u.id,
        username: u.username,
        firstName: u.first_name,
        lastName: u.last_name,
        country: u.country,
        university: u.university,
        biography: u.biography || "",
        interests: Array.isArray(u.interests) ? u.interests : [],
        academicYear: u.academic_year || "Freshman",
        major: u.major || "Undeclared",
        lookingFor: Array.isArray(u.looking_for) ? u.looking_for : [],
        languages: Array.isArray(u.languages) ? u.languages : [],
        createdAt: u.created_at,
        matchScore: Number(u.match_score) || 0,
      };

      if (currentUserId && top3Ids.has(u.id)) {
        return {
          ...base,
          scoreBreakdown: {
            university: Number(u.uni_score) || 0,
            country: Number(u.country_score) || 0,
            interests: Number(u.interests_score) || 0,
            lookingFor: Number(u.looking_for_score) || 0,
            major: Number(u.major_score) || 0,
            languages: Number(u.languages_score) || 0,
          },
        };
      }
      return base;
    });

    return res.json({ success: true, total, limit, offset, users });
  } catch (err) {
    console.error("getAllUsers error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error fetching users" });
  }
};



// Debug endpoint to list all user IDs
export const debugUserIds = async (req, res) => {
  try {
    const users = await sql`SELECT id, username, first_name, last_name FROM users ORDER BY created_at DESC`;
    console.log("All users in database:", users);
    return res.status(200).json({
      success: true,
      users: users.map(u => ({ id: u.id, username: u.username, name: `${u.first_name} ${u.last_name}` }))
    });
  } catch (error) {
    console.error("Debug user IDs error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};