import express from "express";
import { login, logout, onboard, signup, getUser } from "../controllers/auth.controller.js";
import userAuth from "../middleware/userAuth.js";

const router=express.Router();

router.post("/register", signup);
router.post("/login", login);
router.post("/logout", logout);

router.post("/onboarding", userAuth, onboard);

router.get("/me", userAuth, getUser);


export default router;