const { createVote, findVoteByVoter } = require("../services/vote.services");
const candidateModel = require("../model/candidate");

const vote = async (req, res) => {
    try {
        const voterId = req.user.id;
        const { candidateId } = req.body;

        if (!candidateId) {
            return res.status(400).json({
                error: "Candidate ID is required"
            });
        }

        const existingVote = await findVoteByVoter(voterId);

        if (existingVote) {
            return res.status(400).json({
                error: "You have already voted"
            });
        }

        const candidate = await candidateModel.findById(candidateId);

        if (!candidate) {
            return res.status(404).json({
                error: "Candidate not found"
            });
        }

        const newVote = await createVote({
            voter: voterId,
            candidate: candidateId
        });

        if (newVote.error) {
            return res.status(500).json({
                error: newVote.error
            });
        }

        candidate.votes += 1;
        await candidate.save();

        return res.status(201).json({
            message: "Vote cast successfully",
            data: newVote
        });

    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
};

module.exports = {
    vote
};