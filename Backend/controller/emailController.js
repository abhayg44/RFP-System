const { sendEmailAsync } = require("../services/emailService");

exports.sendRfpEmail = async (req, res) => {
    try {
        const { to, subject, html } = req.body;

        if (!to || !subject || !html) {
            return res.status(400).json({ 
                error: "Missing required fields: to, subject, html" 
            });
        }

        await sendEmailAsync(to, subject, html);

        return res.status(200).json({ 
            message: "Email sent successfully",
            recipient: to 
        });
    } catch (err) {
        return res.status(500).json({ 
            error: "Failed to send email",
            details: err.message 
        });
    }
};
