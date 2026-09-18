const candidateModel = require("../model/candidate");

exports.createCandidate = async (info) => {
    try {
        return await candidateModel.create(info);
    } catch (error) {
        return { error: error.message };
    }
};

exports.getCandidates = async () => {
    try {
        return await candidateModel.find();
    } catch (error) {
        return { error: error.message };
    }
};