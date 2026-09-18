const { configDotenv } = require("dotenv");

configDotenv();

exports.CONFIG = {
  PORT: process.env.PORT,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  DB_URL: process.env.DB_URL,

  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
};

exports.WHITE_LIST = [
  "http://127.0.0.1:5500",
  "http://localhost:3000"
];