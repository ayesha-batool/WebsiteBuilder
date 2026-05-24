import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import { Request, Response, NextFunction } from "express";


export const protect = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });
        if (!session?.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        req.userId = session.user.id;
        next();
    } catch (error: unknown) {
        return res.status(401).json({
            message: error instanceof Error ? error.message : "Unauthorized",
        });
    }
}