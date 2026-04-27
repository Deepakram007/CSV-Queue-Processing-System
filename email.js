const nodemailer = require('nodemailer');

/**
 * Configure standard email transporter using a mock or real service
 * For production, you should use real SMTP credentials.
 * We are using Ethereal Email for demonstration, which is safe and easy.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
      user: process.env.SMTP_USER || 'mylene.littel47@ethereal.email',
      pass: process.env.SMTP_PASS || 'Qx5wF1P1YkX3P2B1kE'
  }
});

/**
 * Sends a completion notification email
 * @param {string} email - Destination email address
 * @param {number} totalRows - Number of rows processed
 */
async function sendCompletionEmail(email, totalRows) {
  try {
    const info = await transporter.sendMail({
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
    if (info.messageId && transporter.options.host.includes('ethereal')) {
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
