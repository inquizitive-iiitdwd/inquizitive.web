import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import db from "../config.js";
import {
  sendVerificationEmail,
  sendresetpassword,
} from "../services/emailService.js";
//problem email already exit
// User Registration
const saltRounds = 10;
export const register = async (req, res) => {
  const { email, phone_number, password, name } = req.body.data;
  console.log(email, phone_number, password, name);
  if (!email.endsWith("@iiitdwd.ac.in")) {
    res.status(400).json("enter your college email");
  } else {
    try {
      // Validate input data
      if (!email || !password || !name) {
        return res.status(400).json({ error: "Invalid input data" });
      }

      // Check if the email or phone number already exists

      const existingUser = await db.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );
      console.log(existingUser.rows.length);
      if (existingUser.rows.length > 0) {
        res.status(409).json({ error: "Email already exists" });
      }

      // Hash the password
      else{
      const password_hash = await bcrypt.hash(password, saltRounds);
      const verification_token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      console.log(password_hash)
      // Create a new user record
      await db.query(
        "INSERT INTO users ( email, phone_number, password_hash, user_name, verification_token) VALUES ($1, $2, $3, $4, $5)",
        [email, phone_number, password_hash, name, verification_token]
      );
      
      console.log("This is good")
      // Trigger Notification Service to send verification email/SMS
      const verification_endpoint = `${process.env.BACKEND_URL}/users/verify/${verification_token}`;
      await sendVerificationEmail(email, verification_endpoint); //sending verification link of frontend abhi backend de rahe hai
      return res
        .status(201)
        .json({
          error: "User registered successfully",
          verification_endpoint,
        });
      }
    } catch (err) {
      res.status(500).json({ error: err });
    }
  }
};

export const verifyEmail = async (req, res) => {
  const token = req.params.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    const userResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    if (user.verified) {
      return res.status(400).json({ message: "Email is already verified" });
    }
    await db.query("UPDATE users SET verified = TRUE WHERE email = $1", [email]);
    return res.redirect(`${process.env.FRONTEND_URL}/Clientlogin`);
  } catch (error) {
    console.error("Error verifying email:", error);
    return res.status(400).json({ error: error.message });
  }
};


// User Login
export const login = async (req, res) => {
  const { email, password } = req.body.data;
  console.log(req.body);
  try {
    // Validate input data
    if (!email || !password) {
      return res.status(400).json({ error: "Invalid input data" });
    }

    // Query for user by email
    const userResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = userResult.rows[0];
    console.log(user);
    if (!user) {
      return res.status(403).json({ error: "Authentication failed" });
    } else if (userResult.verified === 'false') {
      res.status(403).json({ error: "Email not verified" });
    }

    // Compare passwords
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(403).json({ error: "Authentication failed" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.cookie("token", token);
    // Update last login timestamp
    await db.query("UPDATE users SET updated_at = NOW() WHERE id = $1", [
      user.id,
    ]);
    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("token", "", { httpOnly: true, sameSite: "Lax" });
    res.status(200).json("logout successful postman");
  } catch (error) {
    res.status(400).json("failed to logout");
  }
};

const forgot_password = async (email) => {
  const result = await db.query("SELECT * FROM users WHERE email = $1", [
    email
  ]);
  if (result.rows.length === 0) {
    return "User not found"; //not a good practices
  } else {
    const user = result.rows[0];
    const key = process.env.JWT_SECRET;
    const token = jwt.sign({ id: user.id, email: user.email }, key,{expiresIn: "1h"}); //add here timer for token expires
    //const link=`http://localhost:3000/users/reset_password/${user.id}/${token}`;
    const link = token;
    return link;
  }
};


export const forgot_password1 = async (req, res) => {
  const { email } = req.body.data;
  console.log("email->", req.body.data);
  const token = await forgot_password(email);
  //res.cookie("token", token);
  if (token === "User not found") {
    //not good practices
    console.log(token);
    res
      .status(200)
      .json({ message: `you entering the wrong gmail`, result: `false` });
  } else {
    try {
      //sending email to verify that he wants to update the pasword
      const link=`token for your reset_password is ${token}`
      const response = await sendVerificationEmail(email, link);
      console.log("response",response);
      res.status(200).json({ result: `TRUE` });
    } catch (error) {
      res.status(400).json({message: `something went wrong`, result: `false`});
    }
  }
};

const verify_token_reset_password = async (token, password) => {
  const Key = process.env.JWT_SECRET;
  const verification = await jwt.verify(token, Key);
  console.log('verification of token',verification);
  const userResult = await db.query("SELECT * FROM users WHERE id = $1", [
    verification.id
  ]);
  console.log('user',userResult.rows[0])
  try {
    if (verification) {
      const hash = await bcrypt.hash(password, saltRounds);
      await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
        hash,
        verification.id
      ]);
      console.log('hello')
      return true;
    }
  } catch (error) {
   return false;
  }
};


//send token and password
export const reset_password = async (req, res) => {
  const { password,token } = req.body.data;
  console.log('body',req.body.data);
  
  console.log('t1',token);
  try {
    const result=await verify_token_reset_password(token, password);
    console.log(result)
    req.cookie(token)
    res.status(200).json({message:`password updated/reset succcessfully`, result: `TRUE` });
  } catch (error) {
    res.status(200).json({message:`something went wrong`, result: `FALSE` });
  }
};

// Get User Profile
export const getProfile = async (req, res) => {
  const userId = req.user.id;
  try {
    // Fetch user profile data by ID
    const userResult = await db.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Exclude sensitive information
    delete user.password_hash;

    return res.json(user);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

// Update User Profile
export const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, phone_number } = req.body;
  try {
    // Validate input data
    if (!name || !phone_number) {
      return res.status(400).json({ error: "Invalid input data" });
    }

    // Update user document with new data
    await db.query(
      "UPDATE users SET user_name = $1, phone_number = $2, updated_at = NOW() WHERE id = $3",
      [name, phone_number, userId]
    );

    // Fetch updated user profile data
    const userResult = await db.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    const updatedUser = userResult.rows[0];

    // Exclude sensitive information
    delete updatedUser.password_hash;

    return res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
//how put is working


export const readtoken = (req, res) => {
  console.log("token")
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  } else {
    res.status(200).json({ success: true, token: token });
  }
};