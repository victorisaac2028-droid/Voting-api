const { config, configDotenv } = require("dotenv");



configDotenv();

exports.CONFIG = {
    PORT: process.env.PORT,
    ACCESS_TOKEN_SECRET: process,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET
}

exports.WHITE_LIST = ["http://127.0.0.1:5500", "http://localhost:3000"]