const userModel = require("../model/user");

exports.create = async (info) => {
    try {
        return await userModel.create(info);
    } catch (error) {
        return { error: error.message };
    }
};

exports.findByEmail = async (email) => {
    try {
        return await userModel.findOne({ email });
    } catch (error) {
        return { error: error.message };
    }
};

exports.updateRefreshToken = async (userId, refreshToken) => {
    try {
        const user = await userModel.findById(userId);

        if (!user) {
            return { error: "Account does not exist" };
        }

        user.refreshToken = refreshToken;
        await user.save();

        return user;
    } catch (error) {
        return { error: error.message };
    }
};
exports.findByRefreshToken = async (refreshToken) => {
    try {
        return await userModel.findOne({ refreshToken });
    } catch (error) {
        return { error: error.message };
    }
};
exports.removeRefreshToken = async (userId) => {
    try {
        const user = await userModel.findById(userId);

        if (!user) {
            return { error: "Account does not exist" };
        }

        user.refreshToken = null;
        await user.save();

        return user;
    } catch (error) {
        return { error: error.message };
    }
};
exports.findById = async (userId) => {
    try {
        return await userModel.findById(userId);
    } catch (error) {
        return { error: error.message };
    }
};