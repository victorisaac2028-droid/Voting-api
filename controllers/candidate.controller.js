const { createCandidate, getCandidates } = require("../services/candidate.services");

const addCandidate = async (req, res) => {
    try {
        const { name, position, party } = req.body;

        if (!name || !position || !party) {
            return res.status(400).json({
                error: "Name, position and party are required"
            });
        }

        const candidate = await createCandidate({
            name,
            position,
            party
        });

        if (candidate.error) {
            return res.status(500).json({
                error: candidate.error
            });
        }

        return res.status(201).json({
            message: "Candidate created successfully",
            data: candidate
        });
    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
};

const listCandidate = async (req, res) => {
    try {
        const candidates = await getCandidates();

        if (candidates.error) {
            return res.status(500).json({
                error: candidates.error
            });
        }

        return res.status(200).json({
            message: "Candidates fetched successfully",
            data: candidates
        });
    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
};

module.exports = {
    addCandidate,
    listCandidate
};