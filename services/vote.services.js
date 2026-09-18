const voteModel = require("../model/vote");

exports.createVote = async (info) => {
    try {
        return await voteModel.create(info);
    } catch (error) {
        return { error: error.message };
    }
};

exports.findVoteByVoter = async (voterId) => {
    try {
        return await voteModel.findOne({ voter: voterId });
    } catch (error) {
        return { error: error.message };
    }
};