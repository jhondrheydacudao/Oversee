const nodemailer = require('nodemailer');

// Replace these with your actual Gmail credentials
const EMAIL_USER = "jhondrheydacudao0@gmail.com";
const EMAIL_PASS = "quff tzpu yjqd mpwl";
const FROM_NAME = "by jhondrhey";
const APP_NAME = "Executorx Hosting Panel";
const BASE_URI = "url";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use `true` for port 465 (SSL)
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Change to `true` for strict security
  },
});

/**
 * Send a welcome email
 */
async function sendWelcomeEmail(email, username, password) {
  try {
    const mailOptions = {
      from: `"${FROM_NAME}" <${EMAIL_USER}>`,
      to: email,
      subject: `Welcome to ${APP_NAME}`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif;">
            <h2>Welcome to ${APP_NAME}!</h2>
            <p>Hello ${username},</p>
            <p>Thank you for signing up. Here are your account details:</p>
            <ul>
              <li><strong>Username:</strong> ${username}</li>
              <li><strong>Password:</strong> ${password}</li>
            </ul>
            <p>Enjoy using ${APP_NAME}!</p>
          </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
}

/**
 * Send a verification email
 */
async function sendVerificationEmail(email, token) {
  try {
    const mailOptions = {
      from: `"${FROM_NAME}" <${EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email Address",
      html: `
        <p>Hello,</p>
        <p>Click the link below to verify your email address:</p>
        <p><a href="${BASE_URI}/verify/${token}">${BASE_URI}/verify/${token}</a></p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
}

/**
 * Send a password reset email
 */
async function sendPasswordResetEmail(email, token) {
  try {
    const mailOptions = {
      from: `"${FROM_NAME}" <${EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>Hello,</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${BASE_URI}/auth/reset/${token}">${BASE_URI}/auth/reset/${token}</a></p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
}

/**
 * Send a test email
 */
async function sendTestEmail(recipientEmail) {
  try {
    const mailOptions = {
      from: `"${FROM_NAME}" <${EMAIL_USER}>`,
      to: recipientEmail,
      subject: "Test Email",
      text: "This is a test email from your application.",
    };

    await transporter.sendMail(mailOptions);
    console.log(`Test email sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Error sending test email:", error);
  }
}

module.exports = {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendTestEmail,
};
