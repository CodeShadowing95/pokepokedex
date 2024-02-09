import mongoose from "mongoose";

let isConnected = false;

export const connectToDB = () => {
    mongoose.set('strictQuery', true);

    
}