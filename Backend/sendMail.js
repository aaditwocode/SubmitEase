import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    secure: true,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

function sendMail(to, sub, msg) {
    transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: to,
        subject: sub,
        html: msg
    }, function(error, info) {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent successfully:', info.response);
        }
    });
}

// Example usage
sendMail(
    "arpitvarshney5@gmail.com", 
    "This is SUBJECT", 
    "<h1>Hello from Node.js!</h1><p>This is a test email sent using Nodemailer.</p>"
);

// // You can also send to multiple recipients
// sendMail(
//     "recipient1@gmail.com, recipient2@gmail.com", 
//     "Test Email to Multiple", 
//     "<h1>Multiple Recipients Test</h1>"
// );