import express from "express";
import { protect } from "../middlewares/auth.js";
import { makeRevision, rollbackToVersion, deleteProject, getProjectCodeForPreview, getPublishedProjects, getSingleProjectById, saveProjectCode } from "../controllers/projectController.js";

const projectRouter = express.Router();

projectRouter.post("/revision/:projectId", protect, makeRevision);
projectRouter.post("/rollback/:projectId/:versionId", protect, rollbackToVersion);
projectRouter.delete("/:projectId", protect, deleteProject);
projectRouter.get("/preview/:projectId", protect, getProjectCodeForPreview);
projectRouter.get("/published", getPublishedProjects);
projectRouter.get("/published/:projectId", getSingleProjectById);
projectRouter.post("/save/:projectId", protect, saveProjectCode);

export default projectRouter;