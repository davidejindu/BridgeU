import { sql } from "../config/db.js";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";

// Validation rules for user registration
export const validateRegistration = [
    body('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-z0-9_]+$/)
        .withMessage('Username can only contain lowercase letters, numbers, and underscores'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('firstName')
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters'),
    ,
    body('country')
        .notEmpty()
        .withMessage('Country is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Country must be between 1 and 100 characters'),
    body('university')
        .notEmpty()
        .withMessage('University is required')
        .isLength({ min: 1, max: 200 })
        .withMessage('University must be between 1 and 200 characters')
];

// Validation rules for user login
export const validateLogin = [
    body('username')
        .notEmpty()
        .withMessage('Username is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// User registration controller
export const registerUser = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { username, password, firstName, lastName, country, university } = req.body;

        // Check if user already exists
        const existingUser = await sql`
            SELECT id FROM users WHERE username = ${username.toLowerCase()}
        `;

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Hash the password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user into database
        const newUser = await sql`
            INSERT INTO users (username, password, first_name, last_name, country, university)
            VALUES (${username.toLowerCase()}, ${hashedPassword}, ${firstName}, ${lastName}, ${country}, ${university})
            RETURNING id, username, first_name, last_name, country, university, created_at
        `;

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: newUser[0].id,
                username: newUser[0].username,
                firstName: newUser[0].first_name,
                lastName: newUser[0].last_name,
                country: newUser[0].country,
                university: newUser[0].university,
                createdAt: newUser[0].created_at
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration'
        });
    }
};

// Get current logged-in user
export const me = (req, res) => {
    if (!req.session?.user) {
      return res.json({ authenticated: false });
    }
    res.json({ authenticated: true, user: req.session.user });
  };
  
  // Logout and clear session
  export const logoutUser = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ success: false, message: "Could not log out" });
      }
      res.clearCookie("sid"); // must match the cookie name in session config
      res.json({ success: true, message: "Logged out" });
    });
  };
  

// User login controller
export const loginUser = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { username, password } = req.body;

        // Find user by username
        const user = await sql`
            SELECT id, username, password, first_name, last_name, country, university, created_at
            FROM users 
            WHERE username = ${username.toLowerCase()}
        `;

        if (user.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user[0].password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Return user data (excluding password)
        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                id: user[0].id,
                username: user[0].username,
                firstName: user[0].first_name,
                lastName: user[0].last_name,
                country: user[0].country,
                university: user[0].university,
                createdAt: user[0].created_at
            }
        });
        
        req.session.user = { id: user[0].id, username: user[0].username };


    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login'
        });
    }
};

// Get user profile (optional - for future use)
export const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await sql`
            SELECT id, username, first_name, last_name, country, university, created_at
            FROM users 
            WHERE id = ${userId}
        `;

        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user[0].id,
                username: user[0].username,
                firstName: user[0].first_name,
                lastName: user[0].last_name,
                country: user[0].country,
                university: user[0].university,
                createdAt: user[0].created_at
            }
        });
        

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};