import express from "express";
import { protect } from "../middlewares/auth.js";
import { getUserCredits, createNewProject, getSingleUserProject, getAllUserProjects, toggleProjectPublication, purchaseCredits } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/credits", protect, getUserCredits);
userRouter.post("/project", protect, createNewProject);
userRouter.get("/project/:projectId", protect, getSingleUserProject);
userRouter.get("/projects", protect, getAllUserProjects);
userRouter.get("/publish-toggle/:projectId", protect, toggleProjectPublication);
userRouter.post("/purchase-credits", protect, purchaseCredits);

export default userRouter;