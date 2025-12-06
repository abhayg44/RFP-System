const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmailAsync = async (to, subject, html) => {
    try {
        await transporter.sendMail({ to, subject, html });
        console.log(`Email sent to ${to}`);
        return true;
    } catch (err) {
        console.error(`Error sending email to ${to}:`, err.message);
        return false;
    }
};

const sendEmail = async (req, res) => {
    const { clientEmail, body, subject } = req.body;
    try {
        await sendEmailAsync(clientEmail, subject, body);
        res.json({ message: "Email sent successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    sendEmail,
    sendEmailAsync
};
