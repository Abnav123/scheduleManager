import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Drop old unique indexes that conflict with multiuser scopes
    try {
      await conn.connection.collections['achievements'].dropIndex('name_1');
      console.log('Dropped old global unique index "name_1" on achievements.');
    } catch (err) {
      // index does not exist, ignore
    }

    try {
      await conn.connection.collections['dailydiaries'].dropIndex('date_1');
      console.log('Dropped old global unique index "date_1" on dailydiaries.');
    } catch (err) {
      // index does not exist, ignore
    }

    try {
      await conn.connection.collections['dailyreflections'].dropIndex('date_1');
      console.log('Dropped old global unique index "date_1" on dailyreflections.');
    } catch (err) {
      // index does not exist, ignore
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
