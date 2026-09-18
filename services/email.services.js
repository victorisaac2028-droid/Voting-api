const nodemailer = require("nodemailer");
const { CONFIG } = require("../config/env");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: CONFIG.EMAIL_USER,
        pass: CONFIG.EMAIL_PASSWORD
    }
});


const sendOTP = async (email, otp) => {
    try {
        await transporter.sendMail({
            from: CONFIG.EMAIL_USER,
            to: email,
            subject: "Voting API - Password Reset OTP",
            text: `Your password reset OTP is: ${otp}. This OTP will expire in 10 minutes.`
        });

        return { success: true };
    } catch (error) {
        return { error: error.message };
    }
};

module.exports = {
    sendOTP
};
