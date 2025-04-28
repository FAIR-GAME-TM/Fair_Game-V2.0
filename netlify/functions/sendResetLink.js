const connectDB = require("./db");
const jwt       = require("jsonwebtoken");
const nodemailer= require("nodemailer");
require("dotenv").config();

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let { email } = JSON.parse(event.body || "{}");
  if (!email) {
    return { statusCode: 400, body: "Email is required" };
  }

  // 1) Find the user
  const db = await connectDB();
  const user = await db.collection("users").findOne({ email });
  if (!user) {
    // You might still return 200 here so as not to leak registered emails
    return { statusCode: 404, body: "No account for that email" };
  }

  // 2) Generate a reset token (expires in 1h)
  const token = jwt.sign(
    { email: user.email },
    process.env.JWT_RESET_SECRET,
    { expiresIn: "1h" }
  );

  // 3) Send the email
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    }
  });

  const resetLink =
    `${process.env.PUBLIC_URL}/reset-password.html?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to:   user.email,
    subject: "Your password reset link",
    text: `
      You requested a password reset.
      Click here to reset your password:

      ${resetLink}

      (Link expires in 1 hour.)
    `
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Reset link sent" })
  };
};
