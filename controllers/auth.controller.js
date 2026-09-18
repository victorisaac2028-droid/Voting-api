const fs = require("fs");
const crypto = require("crypto");
const { sendOTP } = require("../services/email.services");
const userModel = require("../model/user");
const bcrypt = require("bcrypt");
const { buildRes } = require("../utils/builder");
const jwt = require("jsonwebtoken");
const { CONFIG } = require("../config/env");

const {
  create,
  findById,
  findByRefreshToken,
  updateRefreshToken,
  removeRefreshToken,
  findByEmail,
} = require("../services/accounts.services");


const register = async (req, res) => {
  try {
    const { email, firstname, lastname, password } = req.body;

    if (!email) throw new Error("Email is required");
    if (!firstname) throw new Error("Firstname is required");
    if (!lastname) throw new Error("Lastname is required");
    if (!password) throw new Error("Password is required");

    if (!email.includes("@")) {
      throw new Error("Email is invalid");
    }

    if (!isNaN(firstname)) {
      throw new Error("Firstname should contain characters");
    }

    if (firstname.length < 3) {
      throw new Error("Firstname must be at least 3 characters");
    }

    if (firstname.length > 30) {
      throw new Error("Firstname cannot exceed 30 characters");
    }

    if (!isNaN(lastname)) {
      throw new Error("Lastname should contain characters");
    }

    if (lastname.length < 3) {
      throw new Error("Lastname must be at least 3 characters");
    }

    if (lastname.length > 30) {
      throw new Error("Lastname cannot exceed 30 characters");
    }

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    if (password.length > 15) {
      throw new Error("Password cannot exceed 15 characters");
    }

    const emailExist = await findByEmail(email);

    if (emailExist) {
      throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await create({
      email: email.toLowerCase(),
      firstname,
      lastname,
      password: hashedPassword,
    });

    if (user?.error) {
      throw new Error(user.error);
    }

    res.status(201).json({
      msg: "Registration successful",
    });

  } catch (error) {
    res.status(400).json({
      error: error.message || "An error occurred",
    });
  }
};


const readFile = (filePath) => {
  let data;

  if (fs.existsSync(filePath)) {
    data = fs.readFileSync(filePath, "utf-8");
    data = JSON.parse(data);

    if (data.length === 0) {
      throw new Error("No record found");
    }
  }

  return data;
};


// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      throw new Error("Email is required");
    }

    if (!password) {
      throw new Error("Password is required");
    }

    const user = await findByEmail(email);

    if (!user) {
      throw new Error("Account does not exist");
    }

    const passwordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordCorrect) {

      user.failedLoginAttempts =
        (user.failedLoginAttempts || 0) + 1;

      await user.save();

      throw new Error("Incorrect password");
    }

    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(
      payload,
      CONFIG.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "1m",
      }
    );

    const refreshToken = jwt.sign(
      payload,
      CONFIG.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "2m",
      }
    );

    const updatedUser = await updateRefreshToken(
      user._id,
      refreshToken
    );

    if (updatedUser?.error) {
      throw new Error(updatedUser.error);
    }

    // Successful login resets failed attempts
    user.failedLoginAttempts = 0;
    await user.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 2 * 60 * 1000,
    });

    res.status(200).json({
      msg: "Login successful",
      data: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    res.status(400).json({
      error: error.message || "An error occurred",
    });
  }
};


// CHECK AUTHENTICATION
const check = async (req, res) => {
  try {
    const user = await findById(req.user.id);

    if (!user) {
      return res.status(401).json({
        message: "Account does not exist",
      });
    }

    return res.status(200).json({
      message: "User is authenticated",
      data: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired access token",
    });
  }
};


// FORGOT PASSWORD
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await findByEmail(email);

    if (!user) {
      return res.status(200).json({
        message:
          "If an account exists with this email, an OTP has been sent",
      });
    }

    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    const otpExpires = new Date(
      Date.now() + 10 * 60 * 1000
    );

    user.resetOTP = otp;
    user.resetOTPExpires = otpExpires;
    user.resetOTPAttempts = 0;

    await user.save();

    const emailResult = await sendOTP(email, otp);

    if (emailResult.error) {
      return res.status(500).json({
        message: "Failed to send OTP",
      });
    }

    return res.status(200).json({
      message:
        "If an account exists with this email, an OTP has been sent",
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


// VERIFY OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    if (!otp) {
      return res.status(400).json({
        message: "OTP is required",
      });
    }

    const user = await findByEmail(email);

    if (!user) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    if (!user.resetOTP) {
      return res.status(400).json({
        message: "No OTP was requested",
      });
    }

    if (new Date() > user.resetOTPExpires) {
      return res.status(400).json({
        message: "OTP has expired",
      });
    }

    if (otp !== user.resetOTP) {

      user.resetOTPAttempts =
        (user.resetOTPAttempts || 0) + 1;

      if (user.resetOTPAttempts >= 5) {

        user.resetOTP = null;
        user.resetOTPExpires = null;
        user.resetOTPAttempts = 0;

        await user.save();

        return res.status(400).json({
          message:
            "Too many incorrect attempts. Please request a new OTP.",
        });
      }

      await user.save();

      return res.status(400).json({
        message:
          `Invalid OTP. Attempt ${user.resetOTPAttempts} of 5.`,
      });
    }

    user.resetOTPAttempts = 0;

    await user.save();

    return res.status(200).json({
      message: "OTP verified successfully",
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


// GET ACCOUNTS
const getAccounts = async (req, res) => {
  try {
    const users = await userModel
      .find()
      .select(
        "-password -refreshToken -resetOTP -resetOTPExpires"
      );

    return res.status(200).json({
      message: "Accounts fetched successfully",
      data: users,
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};


// REMOVE ACCOUNT
const removeAccount = async (req, res) => {
  try {
    const { email } = req.params;

    if (req.user.email === email.toLowerCase()) {
      return res.status(400).json({
        error: "You cannot delete your own admin account",
      });
    }

    const user = await userModel.findOneAndDelete({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        error: "Account does not exist",
      });
    }

    return res.status(200).json({
      message: "Account deleted successfully",
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};


// LOGOUT
const logOut = async (req, res) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (accessToken) {
      try {
        const decoded = jwt.verify(
          accessToken,
          CONFIG.ACCESS_TOKEN_SECRET
        );

        await removeRefreshToken(decoded.id);

      } catch (error) {
        // Access token invalid or expired.
      }
    }

    if (refreshToken) {
      const user = await findByRefreshToken(refreshToken);

      if (user) {
        await removeRefreshToken(user._id);
      }
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json({
      message: "Logout successful",
    });

  } catch (error) {

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json({
      message: "Logout successful",
    });
  }
};


// REFRESH TOKEN
const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token is required",
      });
    }

    const user = await findByRefreshToken(refreshToken);

    if (!user) {
      return res.status(401).json({
        error:
          "Invalid or revoked refresh token. Please login again.",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        refreshToken,
        CONFIG.REFRESH_TOKEN_SECRET
      );

    } catch (error) {

      await removeRefreshToken(user._id);

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      return res.status(401).json({
        error:
          "Refresh token expired. Please login again.",
      });
    }

    if (decoded.id !== user._id.toString()) {

      await removeRefreshToken(user._id);

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      return res.status(401).json({
        error: "Invalid refresh token",
      });
    }

    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const newAccessToken = jwt.sign(
      payload,
      CONFIG.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "1m",
      }
    );

    const newRefreshToken = jwt.sign(
      payload,
      CONFIG.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "2m",
      }
    );

    await updateRefreshToken(
      user._id,
      newRefreshToken
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 2 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Tokens refreshed successfully",
    });

  } catch (error) {
    return res.status(400).json({
      error: error.message || "An error occurred",
    });
  }
};


// UPDATE PASSWORD
const updatePassword = async (req, res) => {
  try {
    const oldPassword = req.body.oldPassword;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (!oldPassword) {
      return res.status(400).json({
        message: "Input old password",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "Input your new password",
      });
    }

    if (!confirmPassword) {
      return res.status(400).json({
        message: "Confirm your new password",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Password does not match",
      });
    }

    if (oldPassword === password) {
      return res.status(400).json({
        message: "Passwords are the same",
      });
    }

    if (password.length < 8 || password.length > 15) {
      return res.status(400).json({
        message:
          "New password must be between 8 and 15 characters",
      });
    }

    // protect middleware already verified the access token
    const user = await findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Account does not exist",
      });
    }

    const passwordCorrect = await bcrypt.compare(
      oldPassword,
      user.password
    );

    if (!passwordCorrect) {
      return res.status(401).json({
        message: "Old password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    user.password = hashedPassword;

    // Force the user to log in again
    user.refreshToken = null;

    await user.save();

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json({
      message:
        "Password updated successfully. Please login again.",
    });

  } catch (error) {
    return res.status(401).json({
      message: error.message,
    });
  }
};


// RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    const {
      email,
      otp,
      newPassword,
      confirmPassword,
    } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    if (!otp) {
      return res.status(400).json({
        message: "OTP is required",
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        message: "New password is required",
      });
    }

    if (!confirmPassword) {
      return res.status(400).json({
        message: "Confirm password is required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    if (
      newPassword.length < 8 ||
      newPassword.length > 15
    ) {
      return res.status(400).json({
        message:
          "New password must be between 8 and 15 characters",
      });
    }

    const user = await findByEmail(email);

    if (!user) {
      return res.status(404).json({
        message: "Account does not exist",
      });
    }

    if (!user.resetOTP) {
      return res.status(400).json({
        message: "No OTP was requested",
      });
    }

    if (new Date() > user.resetOTPExpires) {
      return res.status(400).json({
        message: "OTP has expired",
      });
    }

    if (otp !== user.resetOTP) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    user.password = hashedPassword;

    user.resetOTP = null;
    user.resetOTPExpires = null;
    user.resetOTPAttempts = 0;

    // Revoke existing sessions
    user.refreshToken = null;

    await user.save();

    return res.status(200).json({
      message: "Password reset successful",
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


module.exports = {
  register,
  login,
  forgotPassword,
  getAccounts,
  logOut,
  removeAccount,
  refreshToken,
  check,
  updatePassword,
  verifyOTP,
  resetPassword,
};