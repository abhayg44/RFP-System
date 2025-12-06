const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    host:'smtp.gmail.com',
    port: 565,  
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

const sendMail=(to,sub,msg)=>{
transporter.sendMail({
    to:to,
    subject:sub,
    html:msg   
});
}

module.exports = transporter;
