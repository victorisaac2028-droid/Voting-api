const express = require("express");
const authRouter = require("../auth.route");

const appRouter = express.Router();

appRouter.use("/auth", authRouter);

module.exports = appRouter;