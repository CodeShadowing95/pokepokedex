import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    count: { type: Number, default: 0 },
})

const Like = mongoose.model('Like', likeSchema);

export default Like;