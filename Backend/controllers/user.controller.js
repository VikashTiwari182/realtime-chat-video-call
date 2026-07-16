import FriendRequest from "../model/FriendRequest.model.js";
import User from "../model/User.model.js";

export const getRecommendedUsers = async (req, res) => {
    try {
        const userId = req.userId;

        const limit = parseInt(req.query.limit) || 10;
        const cursor = req.query.cursor;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const excludedUserIds = [userId, ...user.friends];
        const query = { _id: { $nin: excludedUserIds } };

        if (cursor) {
            
            query._id={...query._id, $gt: cursor};
        }

        query.isOnboarded = true;

        const recommendedUsers = await User.find(query).sort({ _id: 1 }).limit(limit + 1).select("-password");

        const hasNextPage = recommendedUsers.length > limit;

        if (hasNextPage) {
            recommendedUsers.pop();
        }

        const nextCursor = hasNextPage ? recommendedUsers[recommendedUsers.length - 1]._id : null;

        res.json({
            recommendedUsers,
            hasNextPage,
            nextCursor
        });

    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}


export const getFriends = async (req, res) => {
    try {
        const userId = req.userId;

        const limit = parseInt(req.query.limit) || 10;
        const cursor = req.query.cursor;

        const userFriends = await User.findById(userId).populate({
            path: "friends",
            select: "-password",
            match: cursor ? { _id: { $gt: cursor } } : {},
            options: {
                sort: { _id: 1 },
                limit: limit + 1
            }
        })

        if (!userFriends) {
            return res.status(404).json({ message: "User not found" });
        }

        const friends = userFriends.friends;
        const hasNextPage = friends.length > limit;

        if (hasNextPage) {
            friends.pop();
        }

        const nextCursor = hasNextPage ? friends[friends.length - 1]._id : null;

        res.json({
            friends,
            hasNextPage,
            nextCursor
        });

    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}


export const sendFriendRequest = async (req, res) => {
    try {
        const userId = req.userId;
        const { friendId } = req.params;

        const user = await User.findById(userId);
        const friend = await User.findById(friendId);

        if (!user || !friend) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.friends.includes(friendId)) {
            return res.status(400).json({ message: "User is already a friend" });
        }

        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: userId, recipient: friendId },
                { sender: friendId, recipient: userId }
            ]
        });

        if (existingRequest) {
            return res.status(400).json({ message: "Friend request already exists" });
        }

        const friendRequest = new FriendRequest({
            sender: userId,
            recipient: friendId
        });
        await friendRequest.save();

        res.json({ message: "Friend request sent" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}


export const acceptFriendRequest = async (req, res) => {
    try {
        const userId = req.userId;
        const { requestId } = req.params;

        const friendRequest=await FriendRequest.findById(requestId);
        if (!friendRequest) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        if (friendRequest.recipient.toString() !== userId) {
            return res.status(403).json({ message: "You are not authorized to accept this friend request" });
        }

        const senderId = friendRequest.sender;

        const sender=await User.findById(senderId);
        const recipient=await User.findById(userId);

        friendRequest.status = "accepted";
        await friendRequest.save();

        sender.friends.push(userId);
        recipient.friends.push(senderId);
        await sender.save();
        await recipient.save();
        res.json({ message: "Friend request accepted" });
    }catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

export const rejectFriendRequest = async (req, res) => {
    try {
        const userId = req.userId;
        const { requestId } = req.params;
        
        const friendRequest=await FriendRequest.findById(requestId);
        if (!friendRequest) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        if (friendRequest.recipient.toString() !== userId) {
            return res.status(403).json({ message: "You are not authorized to reject this friend request" });
        }

        friendRequest.status = "rejected";
        await friendRequest.save();

        res.json({ message: "Friend request rejected" });
    }catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}


export const getFriendRequests = async (req, res) => {
    try {
        const userId = req.userId;
        const friendRequests = await FriendRequest.find({ recipient: userId, status: "pending" }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");
        const acceptedRequests = await FriendRequest.find({ recipient: userId, status: "accepted" }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");
        res.json({ friendRequests, acceptedRequests });
    }catch(error){
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getSentFriendRequests = async (req, res) => {
    try {
        const userId = req.userId;
        const sentFriendRequests = await FriendRequest.find({ sender: userId, status: "pending" }).populate("recipient", "fullName profilePic nativeLanguage learningLanguage");
        res.json({ sentFriendRequests });
    }catch(error){
        res.status(500).json({ message: "Internal server error" });
    }
}
