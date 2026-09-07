const express = require("express");
const {
    register,
    login,
    forgotPassword,
    getAccounts,
    removeAccount,
    logOut,
    refreshToken,
    check
} = require("../controller/auth.controller");

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/forgotPassword", forgotPassword);
authRouter.get("/accounts", getAccounts);
authRouter.delete("/account/:email", removeAccount);
authRouter.delete("/account", removeAccount);
authRouter.post("/logOut", logOut);
authRouter.post("/refreshToken", refreshToken);
authRouter.post("/check", check);

module.exports = authRouter;