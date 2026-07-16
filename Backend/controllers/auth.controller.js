import { upsertStreamUser } from "../config/stream.js";
import User from "../model/User.model.js";
import generateToken from "../util/token.js";


export const signup=async(req, res)=>{
    const {email, password, name, gender}=req.body;

    if(!email || !password || !name || !gender){
        return res.status(400).json({message: "Please provide all required fields"});
    }

    if(password.length<6){  
        return res.status(400).json({message: "Password must be at least 6 characters long"});
    }

    const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(!emailRegex.test(email)){
        return res.status(400).json({message: "Please provide a valid email address"}); 
    }

    try {
        const isExitUser=await User.findOne({email});
        if(isExitUser){
            return res.status(400).json({message: "User already exists"});
        }


        const profilePic=`https://avatarapi.runflare.run/public/${gender}?username=${name}`;
        const newUser=new User({email, password, name, gender, profilePic});
        await newUser.save();

        const streamResponse=await upsertStreamUser(newUser);
        const token=generateToken(newUser);

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7*24*60*60*1000
        });

        return res.status(201).json({message: "User registered successfully"});
    } catch (error) {
        return res.status(500).json({message: "Internal server error"});    
    }
}


export const login=async(req, res)=>{
    const {email, password}=req.body;
    try {
        const user=await User.findOne({email});
        if(!user){
            return res.status(400).json({message: "Invalid credentials"});
        }

        const isMatch=await user.comparePassword(password);
        if(!isMatch){
            return res.status(400).json({message: "Invalid credentials"});
        }

        const token=generateToken(user);

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7*24*60*60*1000
        });

        return res.status(200).json({message: "Login successful"});

    } catch (error) {
        return res.status(500).json({message: "Internal server error"});
    }
}


export const logout=async(req, res)=>{
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "strict"
        });
        return res.status(200).json({message: "Logout successful"});
    } catch (error) {
        return res.status(500).json({message: "Internal server error"});
    }
}

export const onboard=async(req, res)=>{
    try {
        const userId=req.userId;

        const {fullName, bio, nativeLanguage, learningLanguage, location}=req.body;

        if(!fullName || !bio || !nativeLanguage || !learningLanguage || !location){
            return res.status(400).json({message:"All fields are required"});
        }

        const updatedUser=await User.findByIdAndUpdate(userId, {
            fullName, bio, nativeLanguage, learningLanguage, location, isOnboarded:true
        }, {returnDocument:"after"});

        if(!updatedUser){
            return res.status(400).json({message:"user not found"});
        }

        const streamResponse=await upsertStreamUser(updatedUser);
    } catch (error) {
        console.log("Onboarding Error", error.message);
        return res.status(500).json({message: "Internal server error"});
    }
}

export const getUser=async(req, res)=>{
    try {
        const userId=req.userId;

        const user=await User.findById(userId).select("-password");
        if(!user){
            return res.status(404).json({message:"User not found"});
        }


        return  res.status(200).json(user)
    } catch (error) {
         return res.status(500).json({message: "Internal server error"});
    }
}
