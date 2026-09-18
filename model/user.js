const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    firstname: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 30,
      trim: true,
    },

    lastname: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 30,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    refreshToken: {
      type: String,
      index: true,
      default: null
    },

    resetOTP: {
      type: String,
      default: null
    },

    resetOTPExpires: {
      type: Date,
      default: null
    }
  }
);

const userModel = model("user", userSchema);

module.exports = userModel;