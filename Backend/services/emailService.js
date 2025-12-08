const nodemailer = require("nodemailer");

// Create transporter only when SMTP credentials are configured
const SMTP_USER = process.env.EMAIL_USER;
const SMTP_PASS = process.env.EMAIL_PASSWORD;

let transporter = null;
if (!SMTP_USER || !SMTP_PASS) {
    console.warn('SMTP credentials not configured. Set EMAIL and EMAIL_PASS in environment. Email sending will be disabled.');
} else {
    transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    // Verify transporter connectivity at startup (helpful for debugging SMTP issues)
    transporter.verify().then(() => {
        console.log('Email transporter verified');
    }).catch((err) => {
        console.warn('Email transporter verification failed:', err && err.message ? err.message : err);
    });
}


const sendEmailAsync = async (to, subject, body, from) => {
    const fromAddress = from || process.env.EMAIL || 'no-reply@example.com';
    
    // Determine if body is plain text (contains newlines/formatting) or HTML
    const isPlainText = body && typeof body === 'string' && (body.includes('\n') && !/<[^>]+>/g.test(body));
    
    const mailOptions = {
        from: fromAddress,
        to,
        subject
    };
    
    // If plain text (formatted with newlines), send as text; otherwise treat as HTML with plain-text fallback
    if (isPlainText) {
        mailOptions.text = body;
    } else {
        mailOptions.html = body;
        mailOptions.text = body ? body.replace(/<[^>]+>/g, '') : undefined;
    }

    if (!transporter) {
        const err = new Error('SMTP transporter not configured (missing EMAIL_USER or EMAIL_PASSWORD)');
        console.error(`Error sending email to ${to}:`, err.message);
        return { ok: false, error: err };
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}. MessageId: ${info.messageId}`);
        return { ok: true, info };
    } catch (err) {
        console.error(`Error sending email to ${to}:`, err && err.stack ? err.stack : err);
        return { ok: false, error: err };
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
