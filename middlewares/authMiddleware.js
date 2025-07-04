import jwt from "jsonwebtoken";

export const authenticate_user = (req, res, next) => {
  // Read the token from the httpOnly cookie set during login
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    // Verify the token from the cookie
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains { id: user.id, email: user.email }
    next();
  } catch (error) {
    res.status(400).json({ error: "Invalid token." });
  }
};
