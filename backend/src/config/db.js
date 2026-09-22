const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

let isReplicaSet = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    try {
      const hello = await conn.connection.db.command({ hello: 1 });
      if (hello && hello.setName) {
        isReplicaSet = true;
        console.log(`MongoDB Replica Set detected (${hello.setName}): Native multi-document transactions enabled.`);
      } else {
        isReplicaSet = false;
        console.log('MongoDB running in Standalone mode: Safe atomic operations enabled.');
      }
    } catch (e) {
      isReplicaSet = false;
      console.log('MongoDB running in Standalone mode: Safe atomic operations enabled.');
    }

    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const supportsTransactions = () => isReplicaSet;

module.exports = { connectDB, supportsTransactions };
