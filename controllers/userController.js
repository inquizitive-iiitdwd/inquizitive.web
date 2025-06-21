import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config.js";
import { sendVerificationEmail, sendresetpassword } from "../services/emailService.js";

const saltRounds = 10;
const sendError = (res, statusCode, message) => res.status(statusCode).json({ error: message });
const sendSuccess = (res, statusCode, data) => res.status(statusCode).json(data);

// --- User Registration ---
// This function is already compatible with your schema. No changes needed.
export const register = async (req, res) => {
    // ... (code from previous refactor is correct)
    const { email, phone_number, password, name } = req.body;
    if (!email || !password || !name) { return sendError(res, 400, "Name, email, and password are required."); }
    if (!email.endsWith("@iiitdwd.ac.in")) { return sendError(res, 400, "Please use your official college email address."); }
    try {
        const existingUser = await db.query("SELECT id FROM users WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) { return sendError(res, 409, "An account with this email already exists."); }
        const password_hash = await bcrypt.hash(password, saltRounds);
        const verification_token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
        await db.query(
            "INSERT INTO users (email, phone_number, password_hash, user_name, verification_token) VALUES ($1, $2, $3, $4, $5)",
            [email, phone_number, password_hash, name, verification_token]
        );
        const verification_link = `${process.env.FRONTEND_URL}/verify-email/${verification_token}`;
        await sendVerificationEmail(email, verification_link);
        return sendSuccess(res, 201, { message: "Registration successful. Please check your email to verify your account." });
    } catch (err) {
        console.error("Registration Error:", err);
        return sendError(res, 500, "An internal server error occurred during registration.");
    }
};

// --- Email Verification ---
// This function is already compatible with your schema. No changes needed.
export const verifyEmail = async (req, res) => {
    // ... (code from previous refactor is correct)
    const { token } = req.params;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { email } = decoded;
        const { rows } = await db.query("SELECT id, verified FROM users WHERE email = $1", [email]);
        if (rows.length === 0) { return res.status(404).send("<h1>Verification failed: User not found.</h1>"); }
        if (rows[0].verified) { return res.redirect(`${process.env.FRONTEND_URL}/Clientlogin?message=already-verified`); }
        await db.query("UPDATE users SET verified = TRUE, verification_token = NULL WHERE email = $1", [email]);
        return res.redirect(`${process.env.FRONTEND_URL}/Clientlogin?message=success`);
    } catch (error) {
        console.error("Email Verification Error:", error);
        return res.status(400).send("<h1>Verification link is invalid or has expired.</h1>");
    }
};

// --- User Login ---
// This function is already compatible with your schema. No changes needed.
export const login = async (req, res) => {
    // ... (code from previous refactor is correct)
    const { email, password } = req.body;
    if (!email || !password) { return sendError(res, 400, "Email and password are required."); }
    try {
        const userResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = userResult.rows[0];
        if (!user) { return sendError(res, 401, "Invalid credentials. Please check your email and password."); }
        if (!user.verified) { return sendError(res, 403, "Your account is not verified. Please check your email."); }
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) { return sendError(res, 401, "Invalid credentials. Please check your email and password."); }
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 3600000
        });
        await db.query("UPDATE users SET updated_at = NOW() WHERE id = $1", [user.id]);
        return sendSuccess(res, 200, { message: "Login successful" });
    } catch (err) {
        console.error("Login Error:", err);
        return sendError(res, 500, "An internal server error occurred during login.");
    }
};

// --- User Logout ---
export const logout = (req, res) => {
    // ... (code from previous refactor is correct)
    res.cookie("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: new Date(0)
    });
    return sendSuccess(res, 200, { message: "Logout successful." });
};

// --- Request Password Reset ---
// Replaces 'forgot_password1'. Already compatible with your schema.
export const requestPasswordReset = async (req, res) => {
    // ... (code from previous refactor is correct)
    const { email } = req.body;
    if (!email) { return sendError(res, 400, "Email address is required."); }
    try {
        const { rows } = await db.query("SELECT id, email FROM users WHERE email = $1", [email]);
        if (rows.length === 0) { return sendSuccess(res, 200, { message: "If an account with that email exists, a password reset link has been sent." }); }
        const user = rows[0];
        const resetToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "15m" });
        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        await sendresetpassword(email, resetLink);
        return sendSuccess(res, 200, { message: "If an account with that email exists, a password reset link has been sent." });
    } catch (err) {
        console.error("Request Password Reset Error:", err);
        return sendError(res, 500, "An internal server error occurred.");
    }
};

// --- Reset Password with Token ---
// Replaces 'reset_password'. Already compatible with your schema.
export const resetPassword = async (req, res) => {
    // ... (code from previous refactor is correct)
    const { token, password } = req.body;
    if (!token || !password) { return sendError(res, 400, "Token and new password are required."); }
    if (password.length < 6) { return sendError(res, 400, "Password must be at least 6 characters long."); }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { id } = decoded;
        const password_hash = await bcrypt.hash(password, saltRounds);
        await db.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [password_hash, id]);
        return sendSuccess(res, 200, { message: "Password has been reset successfully. You can now log in." });
    } catch (err) {
        console.error("Reset Password Error:", err);
        return sendError(res, 401, "Invalid or expired password reset token.");
    }
};

// --- Get User Profile ---
// This function is already compatible with your schema.
export const getProfile = async (req, res) => {
    // ... (code from previous refactor is correct)
    const userId = req.user.id;
    try {
        const { rows } = await db.query("SELECT id, user_name, email, phone_number, created_at FROM users WHERE id = $1", [userId]);
        const user = rows[0];
        if (!user) { return sendError(res, 404, "User not found."); }
        return sendSuccess(res, 200, user);
    } catch (err) {
        console.error("Get Profile Error:", err);
        return sendError(res, 500, "An internal server error occurred.");
    }
};

// --- Update User Profile ---
export const updateProfile = async (req, res) => {
  const userId = req.user.id;
  // **CRITICAL FIX**: Changed `name` to `user_name` to match the schema
  const { user_name, phone_number } = req.body;

  try {
    if (!user_name || !phone_number) {
      return sendError(res, 400, "User name and phone number are required.");
    }

    // This query now correctly uses the 'user_name' variable
    const { rows } = await db.query(
      "UPDATE users SET user_name = $1, phone_number = $2, updated_at = NOW() WHERE id = $3 RETURNING id, user_name, email, phone_number",
      [user_name, phone_number, userId]
    );

    if (rows.length === 0) {
      return sendError(res, 404, "User not found.");
    }

    return sendSuccess(res, 200, {
      message: "Profile updated successfully",
      user: rows[0],
    });
  } catch (err) {
    console.error("Update Profile Error:", err);
    return sendError(res, 500, "An internal server error occurred.");
  }
};

// Other functions...
export const readtoken = (req, res) => {
  // ... (code from previous refactor is correct)
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  } else {
    res.status(200).json({ success: true });
  }
};