import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import userRouter from "./routes/userRoutes.js";
import projectRouter from "./routes/projectRoutes.js";

const app = express();
const corsOptions = {
    origin: process.env.TRUSTED_ORIGINS?.split(",").filter(Boolean) || ["http://localhost:5173"],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.all("/api/auth/{*any}", toNodeHandler(auth));

app.get("/", (_req: Request, res: Response) => {
    res.send("Server is Live!");
});
app.use("/api/user", userRouter);
app.use("/api/project", projectRouter);

export default app;
