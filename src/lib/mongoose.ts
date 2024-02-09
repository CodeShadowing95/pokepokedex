import mongoose from "mongoose";
import express from "express";

import { environment } from "../environments/environment.prod";

let isConnected = false;

export const connectToDB = async () => {
    mongoose.set('strictQuery', true);

    if(!environment.MONGO_DB_URI) return console.log('MONGODB_URI is not defined');

    if(isConnected) return console.log('=> using existing database connection');

    try {
        await mongoose.connect(environment.MONGO_DB_URI);

        isConnected = true;

        console.log('MongoDB connected!');
    } catch (error) {
        console.log(error);
    }
}