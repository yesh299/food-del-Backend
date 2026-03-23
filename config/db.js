import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  await mongoose
    .connect(process.env.mongo_DB)
    .then(() => console.log("✅ DB CONNECT HO GYA YESH ✅"));
};
