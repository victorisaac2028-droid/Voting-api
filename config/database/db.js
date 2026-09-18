const {connect} = require('mongoose');
const { CONFIG } = require("../env");

const connectDB = async () => {
    try {
        console.log('COnnecting to Database...');
        await connect(CONFIG.DB_URL);
        console.log('Database connected successfully');
    } catch (error) {
        console.log('Error connecting to MongoDB', error);
        process.exit(1);
    }
};
module.exports = {connectDB}