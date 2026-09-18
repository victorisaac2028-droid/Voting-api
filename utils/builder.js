const buildRes = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({
        msg: message,
        data
    });
};

module.exports = {
    buildRes
};