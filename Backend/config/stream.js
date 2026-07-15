import { StreamChat } from "stream-chat";

const apiKey=process.env.StREAM_API_KEY;
const apiSecret=process.env.STREAM_API_SECRET;

const serverClient = StreamChat.getInstance(apiKey, apiSecret);

export const upsertStreamUser = async (user) => {
    try {
        await serverClient.upsertUser({
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            profilePic: user.profilePic ||"",
        });

        return { success: true, message: "Stream user upserted successfully" };
    } catch (error) {
        console.error("Error upserting Stream user:", error);
        return { success: false, message: "Error upserting Stream user" };
    }
}


export const generateStreamToken = (userId) => {
    try {
        const token = serverClient.createToken(userId);
        return { success: true, token };
    } catch (error) {
        console.error("Error generating Stream token:", error);
        return { success: false, message: "Error generating Stream token" };
    }
}