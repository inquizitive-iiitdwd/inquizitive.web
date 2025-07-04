import express from "express";
// **CHANGED**: Updated imports to match refactored controller functions
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  verifyEmail,
  requestPasswordReset, // Renamed for clarity
  resetPassword, // Renamed for clarity
  readtoken,
} from "../controllers/userController.js";
import { authenticate_user } from "../middlewares/authMiddleware.js";

const router = express.Router();

// --- Authentication Routes ---
// RENAMED: /signin is more commonly /register for creating an account
router.post("/register", register);
router.get("/verify-email/:token", verifyEmail);
router.post("/login", login);
// CHANGED: Logout should be a POST request as it changes server state (deletes the session/cookie)
router.post("/logout", logout);

// --- Password Reset Flow ---
// RENAMED: More descriptive route and uses the new controller function
router.post("/request-password-reset", requestPasswordReset);
// RENAMED: Uses the new controller function
router.post("/reset-password", resetPassword);

// --- User Profile Routes (Protected) ---
router.get("/profile", authenticate_user, getProfile);
router.put("/profile", authenticate_user, updateProfile);

// --- Debugging Route (Consider removing in production) ---
router.get("/readtoken", readtoken);

export default router;
