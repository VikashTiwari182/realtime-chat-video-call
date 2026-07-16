import express from "express";
import userAuth from "../middleware/userAuth";
import { getFriends, getRecommendedUsers } from "../controllers/user.controller";

const router=express.Router();

router.use(userAuth);
router.get("/", getRecommendedUsers);
router.get("/friends", getFriends);

export default router;