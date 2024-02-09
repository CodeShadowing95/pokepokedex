import { connectToDB } from "../mongoose";
import Like from "../models/like.model";

// export async function getLikes(): Promise<any> {
//     try {
//         connectToDB();

//         const likes = await Like.find();

//         return likes;
//     } catch (error) {
//         console.log(error);
//     }
// }

export async function addNewLike() {
    try {
        connectToDB();

        const like = await Like.findOne();

        if(like) {
            like.count += 1;
            await like.save();
        } else {
            await Like.create({ count: 1 });
        }
    } catch (error) {
        console.error("Error incrementing the likes: " + error);
        throw error;
        
    }
}