// controller function to make revision
import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import openai, { AI_MAX_TOKENS, AI_MODEL } from "../configs/openai.js";

function paramString(value: string | string[] | undefined): string | undefined {
    return typeof value === "string" ? value : value?.[0];
}

export const makeRevision = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const projectId = paramString(req.params.projectId);
        const { message } = req.body;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!projectId) {
            return res.status(400).json({ message: "Invalid project ID" });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (user.credits < 5) {
            return res.status(402).json({ message: "Insufficient credits. You need at least 5 credits to make a revision." });
        }
        if (!message || message.trim() === '') {
            return res.status(400).json({ message: "Message is required" });
        }
        const project = await prisma.websiteProject.findUnique({
            where: { id: projectId, userId: userId },
            include: { versions: true },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        await prisma.conversation.create({
            data: {
                role: "user",
                content: message,
                projectId,
            },
        });
        await prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: 5 } },
        });
        const revisionResponse = await openai.chat.completions.create({
            model: AI_MODEL,
            max_tokens: AI_MAX_TOKENS,
            messages: [{ role: "system", content: `you are an expert web developer. You are given a project and a message. You need to make a revision to the project based on the message. Return ONLY the complete updated HTML code with the requested changes. Use Tailwind CSS for ALL styling (NO custom CSS). Use Tailwind utility classes for all styling changes. Include all JavaScript in <script> tags before closing </body>. Make sure it's a complete, standalone HTML document with Tailwind CSS. Return the HTML Code Only, nothing else. Apply the requested changes while maintaining the Tailwind CSS styling approach.` },
            { role: "user", content: message },
            ],
        });
        const revision = revisionResponse.choices[0].message.content || '';

        await prisma.conversation.create({
            data: {
                role: "assistant",
                content: `I've made the revision`,
                projectId: projectId,
            },
        });
        await prisma.conversation.create({
            data: {
                role: "assistant",
                content: `Now making changes to your website...`,
                projectId: projectId,
            },
        });
        const codeGenerationResponse = await openai.chat.completions.create({
            model: AI_MODEL,
            max_tokens: AI_MAX_TOKENS,
            messages: [{ role: "system", content: `you are an expert web developer. You are given a project and a message. You need to make a revision to the project based on the message. Return ONLY the complete updated HTML code with the requested changes. Use Tailwind CSS for ALL styling (NO custom CSS). Use Tailwind utility classes for all styling changes. Include all JavaScript in <script> tags before closing </body>. Make sure it's a complete, standalone HTML document with Tailwind CSS. Return the HTML Code Only, nothing else. Apply the requested changes while maintaining the Tailwind CSS styling approach.` },
            { role: "user", content: `Here is the current website code ${project.current_code}. The user has requested the following changes: ${revision}. Return ONLY the complete updated HTML code with the requested changes. Use Tailwind CSS for ALL styling (NO custom CSS). Use Tailwind utility classes for all styling changes. Include all JavaScript in <script> tags before closing </body>. Make sure it's a complete, standalone HTML document with Tailwind CSS. Return the HTML Code Only, nothing else. Apply the requested changes while maintaining the Tailwind CSS styling approach.` },
            ],
        });
        const code = codeGenerationResponse.choices[0].message.content || '';
        if (!code || code.trim() === '') {
            await prisma.conversation.create({
                data: {
                    role: "assistant",
                    content: `Unable to make the revision. Please try again.`,
                    projectId: projectId,
                },
            });
            await prisma.user.update({
                where: { id: userId },
                data: { credits: { increment: 5 } },
            });
            return res.status(500).json({ message: "Failed to generate revision code" });
        }
        const newVersion = await prisma.version.create({
            data: {
                code: code.replace(/```[a-z]*n?/gi, '').replace(/```$/g, '').trim(),
                description: `Version ${project.current_version_index + 1}`,
                projectId: projectId,
            },
        });
        await prisma.conversation.create({
            data: {
                role: "assistant",
                content: `I've updated your website. You can preview it and request any changes.`,
                projectId: projectId,
            },
        });
        await prisma.websiteProject.update({
            where: { id: projectId },
            data: { current_code: code.replace(/```[a-z]*n?/gi, '').replace(/```$/g, '').trim(), current_version_index: newVersion.id },
        });
        res.json({ message: "Revision made successfully", credits: user.credits });
    }
    catch (error: unknown) {
        const uid = req.userId;
        if (uid) {
            await prisma.user.update({
                where: { id: uid },
                data: { credits: { increment: 5 } },
            });
        }
        return res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
}

// controller fun to rollback to a specific version
export const rollbackToVersion = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const projectId = paramString(req.params.projectId);
        const versionId = paramString(req.params.versionId);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!projectId || !versionId) {
            return res.status(400).json({ message: "Invalid project ID or version ID" });
        }
        const project = await prisma.websiteProject.findUnique({
            where: { id: projectId, userId: userId },
            include: { versions: true },
        });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        const versions = (project as typeof project & { versions: Array<{ id: string; code: string; description: string }> }).versions;
        const version = versions.find((v) => v.id === versionId);
        if (!version) {
            return res.status(404).json({ message: "Version not found" });
        }
        await prisma.websiteProject.update({
            where: { id: projectId },
            data: { current_code: version.code, current_version_index: version.id },
        });
        await prisma.conversation.create({
            data: {
                role: "assistant",
                content: `I've rolled back to version ${version.description}`,
                projectId,
            },
        });
        res.json({ message: "Rolled back to version successfully" });
    }
    catch (error: unknown) {
        return res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
}

// controller fun to delete a project
export const deleteProject = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const projectId = paramString(req.params.projectId);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!projectId) {
            return res.status(400).json({ message: "Invalid project ID" });
        }
        await prisma.websiteProject.delete({
            where: { id: projectId, userId: userId },
        });
        res.json({ message: "Project deleted successfully" });
    }
    catch (error: unknown) {
        return res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
}

// controller fun for getting project code for preview
export const getProjectCodeForPreview = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const projectId = paramString(req.params.projectId);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!projectId) {
            return res.status(400).json({ message: "Invalid project ID" });
        }
        const project = await prisma.websiteProject.findFirst({
            where: { id: projectId, userId: userId },
            include: { versions: true },
        });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        const versionId = paramString(req.query.versionId as string | string[] | undefined);
        const code = versionId
            ? (project as typeof project & { versions: Array<{ id: string; code: string }> }).versions?.find((v) => v.id === versionId)?.code
            : project.current_code;
        return res.json({
            code: code ?? project.current_code,
            versions: (project as typeof project & { versions: Array<{ id: string; code: string }> }).versions ?? [],
        });
    }
    catch (error: unknown) {
        return res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
}

// get published projects
export const getPublishedProjects = async (req: Request, res: Response) => {
    try {
        const projects = await prisma.websiteProject.findMany({
            where: { isPublished: true },
            include: { user: true },
        });
        res.json({ projects });
    }
    catch (error: unknown) {
        return res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
}

// get single project by id
export const getSingleProjectById = async (req: Request, res: Response) => {
    try {
        const projectId = paramString(req.params.projectId);
        if (!projectId) {
            return res.status(400).json({ message: "Project ID is required" });
        }
        const project = await prisma.websiteProject.findFirst({
            where: { id: projectId },
        });
        if (!project || !project.isPublished || !project?.current_code) {
            return res.status(404).json({ message: "Project not found" });
        }
        res.json({ code: project.current_code });
    }
    catch (error: unknown) {
        return res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
}

// controller to save project code
export const saveProjectCode = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const projectId = paramString(req.params.projectId);
        const { code } = req.body;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!projectId) {
            return res.status(400).json({ message: "Invalid project ID" });
        }
        if (!code || code.trim() === '') {
            return res.status(400).json({ message: "Code is required" });
        }
        const project = await prisma.websiteProject.findUnique({
            where: { id: projectId, userId: userId },
        });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        await prisma.websiteProject.update({
            where: { id: projectId },
            data: { current_code: code, current_version_index: "" },
        });
        res.json({ message: "Project code saved successfully" });
    }
    catch (error: unknown) {
        return res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
}