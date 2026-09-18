const jwt = require("jsonwebtoken");
const { CONFIG } = require("../config/env");

const protect = (req, res, next) => {
    try {
        const token = req.cookies.accessToken;

        if (!token) {
            return res.status(401).json({
                message: "You are not logged in"
            });
        }

        const decoded = jwt.verify(
            token,
            CONFIG.ACCESS_TOKEN_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};
const adminOnly = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Admin access required"
        });
    }

    next();
};

module.exports = {
    protect,
    adminOnly
};