import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

//I have to change it when I got frontend. means the mails will send to open frontend page where there will button for verify which will call this verification link(api endpoint)
export const sendVerificationEmail = async (email, verificationLink) => {
  // console.log("email is sending", email);
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "verification link for email ✔",
    text: `To complete your verification, please click the link below:\n\n${verificationLink}`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log("Error sending email", error);
      throw new Error("error");
    } else {
      console.log("Email sent: " + info.response);
      console.log("Sending email to:", email);
    }
  });
};

export const sendresetpassword = async (email, link) => {
  async function main() {
    const info = transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email, // list of receivers
      subject: "verification otp ✔", // Subject line
      text: `click link to cverify ${link}. You can get a new code after 5 minutes.`, // link will open the frontend part and at there one button will be there to post req with id ,token and password
    });
  }
  main();
};

export const sendNotificationEmail = async (email, subject, content) => {
  async function main() {
    const info = transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email, // list of receivers
      subject: subject,
      text: content,
    });
  }
  main();
};
