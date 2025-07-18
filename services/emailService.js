import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter configuration error:", error);
  } else {
    console.log("Email transporter is ready");
  }
});

export const sendVerificationEmail = async (email, verificationLink) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email credentials are missing in .env");
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verification Link for Email ✔",
    text: `To complete your verification, please click the link below:\n\n${verificationLink}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    console.log("Sending email to:", email);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send verification email");
  }
};

export const sendresetpassword = async (email, link) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email credentials are missing in .env");
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verification OTP ✔",
    text: `Click the link to verify: ${link}. You can get a new code after 5 minutes.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent: " + info.response);
    return info;
  } catch (error) {
    console.error("Error sending reset email:", error);
    throw new Error("Failed to send reset email");
  }
};

export const sendNotificationEmail = async (email, subject, content) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email credentials are missing in .env");
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    text: content,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Notification email sent: " + info.response);
    return info;
  } catch (error) {
    console.error("Error sending notification email:", error);
    throw new Error("Failed to send notification email");
  }
};
