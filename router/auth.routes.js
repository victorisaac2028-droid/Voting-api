const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { register,
     getAccounts,
      removeAccount,
       login,
        refreshToken,
         check,
          logOut,
          updatePassword,
          forgotPassword, 
          verifyOTP,
          resetPassword
        } = require("../controllers/auth.controller");
const authRouter = express.Router(); //Create a route
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logOut", logOut);
authRouter.post("/refreshToken", refreshToken);
authRouter.post("/forgotPassword", forgotPassword);
authRouter.patch("/updatePassword", updatePassword);
authRouter.get("/accounts", getAccounts);
authRouter.get("/check", protect, check);
authRouter.delete("/account/:email", removeAccount);
authRouter.post("/verifyOtp", verifyOTP);
authRouter.post("/resetPassword", resetPassword);



module.exports = authRouter