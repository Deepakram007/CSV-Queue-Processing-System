const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Configure standard email transporter using a mock or real service
 * For production, you should use real SMTP credentials.
 * We are using Ethereal Email for demonstration, which is safe and easy.
 */
async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    console.log("No SMTP credentials found in environment. Generating a new Ethereal test account...");
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`Generated Ethereal Test Account: ${testAccount.user}`);
  }
  return transporter;
}

/**
 * Sends a completion notification email
 * @param {string} email - Destination email address
 * @param {number} totalRows - Number of rows processed
 */
async function sendCompletionEmail(email, totalRows) {
  try {
    const tp = await getTransporter();
    const info = await tp.sendMail({
      from: '"CSV Processing System" <noreply@csvsystem.com>',
      to: email,
      subject: "CSV Processing Completed ✅",
      text: `Your CSV file has been successfully processed.\nTotal rows processed: ${totalRows}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Processing Complete</h2>
          <p>Your uploaded CSV file has been successfully processed.</p>
          <p><strong>Total rows processed:</strong> ${totalRows}</p>
          <p>Thank you for using our system!</p>
        </div>
      `,
    });
    
    console.log(`Email sent successfully to ${email} [Message ID: ${info.messageId}]`);
    
    // Ethereal specific, log the URL to preview the email
    if (info.messageId && tp.options.host && tp.options.host.includes('ethereal')) {
       console.log(`Preview Email: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

module.exports = {
  sendCompletionEmail
};
