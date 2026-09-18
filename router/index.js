const express = require("express");

const authRouter = require("./auth.routes");
const votingRouter = require("./candidate.routes");
const candidateRouter = require("./candidate.routes");

const appRouter = express.Router();

appRouter.use("/auth", authRouter);
appRouter.use("/voting", candidateRouter);

module.exports = appRouter;