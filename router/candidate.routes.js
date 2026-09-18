const express = require("express");

const {
    addCandidate,
    listCandidate
} = require("../controllers/candidate.controller");

const { vote } = require("../controllers/vote.controller");

const { protect } = require("../middleware/auth.middleware");

const candidateRouter = express.Router();

candidateRouter.post("/addcandidate", protect, addCandidate);

candidateRouter.get("/listcandidate", protect, listCandidate);

candidateRouter.post("/vote", protect, vote);

module.exports = candidateRouter;