// get user credits
import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import openai from "../configs/openai.js";

function paramString(value: string | string[] | undefined): string | undefined {
    return typeof value === "string" ? value : value?.[0];
}

export const getUserCredits = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        res.status(200).json({ credits: user?.credits });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
}

// controller function to create new project

export const createNewProject = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const initial_prompt = typeof req.body?.initial_prompt === "string" ? req.body.initial_prompt.trim() : "";

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!initial_prompt) {
            return res.status(400).json({ message: "Please provide a description for your website (initial_prompt)." });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (user.credits < 5) {
            return res.status(401).json({ message: "Insufficient credits" });
        }
        // create new project
        const newProject = await prisma.websiteProject.create({
            data: {
                name: initial_prompt.slice(0, 20),
                initial_prompt,
                userId,
            },
        });
        // update user credits
        await prisma.user.update({
            where: { id: userId },
            data: { totalCreation: { increment: 1 } },
        });
        await prisma.conversation.create({
            data: {
                role: "user",
                content: initial_prompt,
                projectId: newProject.id,
            },
        });
        await prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: 5 } },
        });
        // enhance prompt
        let enhancedPrompt: string | null;
        try {
            const enhancedPromptResponse = await openai.chat.completions.create({
                model: "kwaipilot/kat-coder-pro",
                max_tokens: 4096,
                messages: [{
                    role: "system",
                    content: "You are a prompt enhancement specialist. Take the user's website request and expand it into a detailed, comprehensive prompt that will help create the best possible website. Enhance this prompt by: 1. Adding specific design details (layout, color scheme, typography) 2. Specifying key sections and features 3. Describing the user experience and interactions 4. Including modern web design best practices 5. Mentioning responsive design requirements 6. Adding any missing but important elements. Return ONLY the enhanced prompt, nothing else. Make it detailed but concise (2-3 paragraphs max)."
                }, { role: "user", content: initial_prompt }],
            });
            enhancedPrompt = enhancedPromptResponse.choices[0].message.content ?? null;
        } catch (apiError) {
            await prisma.user.update({ where: { id: userId }, data: { credits: { increment: 5 } } });
            const msg = apiError instanceof Error ? apiError.message : "AI service error";
            if (msg.includes("API key") || msg.includes("401") || msg.includes("authentication")) {
                return res.status(503).json({ message: "AI service is not configured. Please set AI_API_KEY in the server environment." });
            }
            return res.status(503).json({ message: `AI service error: ${msg}` });
        }
        await prisma.conversation.create({
            data: {
                role: "assistant",
                content: `I've enhanced your prompt: ${enhancedPrompt ?? ""}`,
                projectId: newProject.id,
            },
        });
        await prisma.conversation.create({
            data: {
                role: "assistant",
                content: `now generating the website code...`,
                projectId: newProject.id,
            },
        });
        let code: string;
        try {
            const codeGenerationResponse = await openai.chat.completions.create({
                model: "kwaipilot/kat-coder-pro",
                max_tokens: 32768,
                messages: [
                    { role: "system", content: `You are an expert web developer. Create a complete, production-ready, single-page website based on this request: ${enhancedPrompt ?? ""} Critical requirements: - Return ONLY the complete HTML code. - Use Tailwind CSS for ALL styling (NO custom CSS). - Use Tailwind utility classes. - Include all JavaScript in <script> tags before closing </body>. - Complete standalone HTML document with Tailwind CSS. Return the HTML code only, nothing else.` },
                    { role: "user", content: enhancedPrompt ?? "" },
                ],
            });
            code = codeGenerationResponse.choices[0].message.content || "";
        } catch (apiError) {
            await prisma.user.update({ where: { id: userId }, data: { credits: { increment: 5 } } });
            const msg = apiError instanceof Error ? apiError.message : "AI service error";
            if (msg.includes("API key") || msg.includes("401") || msg.includes("authentication")) {
                return res.status(503).json({ message: "AI service is not configured. Please set AI_API_KEY in the server environment." });
            }
            return res.status(503).json({ message: `AI service error: ${msg}` });
        }
        if (!code || code.trim() === '') {
            await prisma.conversation.create({
                data: {
                    role: "assistant",
                    content: `Unable to make the revision. Please try again.`,
                    projectId: newProject.id,
                },
            });
            await prisma.user.update({
                where: { id: userId },
                data: { credits: { increment: 5 } },
            });
            return res.status(500).json({ message: "Failed to generate website code" });
        }
        // create new version
        const version = await prisma.version.create({
            data: {
                code: code.replace(/```[a-z]*n?/gi, '').replace(/```$/g, '').trim(),
                description: `Version ${newProject.current_version_index + 1}`,
                projectId: newProject.id,
            },
        });
        await prisma.conversation.create({
            data: {
                role: "assistant",
                content: `I've generated the website code. You can now preview it and request any changes.`,
                projectId: newProject.id,
            },
        });
        await prisma.websiteProject.update({
            where: { id: newProject.id },
            data: {
                current_code: code.replace(/```[a-z]*n?/gi, '').replace(/```$/g, '').trim(),
                current_version_index: version.id
            },
        });
        res.json({ projectId: newProject.id });
    } catch (error: unknown) {
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

// controller function to get a single user project
export const getSingleUserProject = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const projectId = paramString(req.params.projectId);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!projectId) {
            return res.status(400).json({ message: "Invalid project ID" });
        }
        const project = await prisma.websiteProject.findUnique({
            where: { id: projectId, userId: userId },
            include: {
                conversation: {
                    orderBy: {
                        timestamp: "asc",
                    },
                },
                versions: {
                    orderBy: {
                        timestamp: "asc",
                    },
                },
            },
        });
        res.json({ project });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
}

// controller fun to get all user projects
export const getAllUserProjects = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const projects = await prisma.websiteProject.findMany({
            where: { userId: userId },
        });
        res.json({ projects });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
}

// controller funciton to toggle project publication
export const toggleProjectPublication = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const projectId = paramString(req.params.projectId);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!projectId) {
            return res.status(400).json({ message: "Invalid project ID" });
        }
        const project = await prisma.websiteProject.findUnique({
            where: { id: projectId, userId: userId },
        });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        await prisma.websiteProject.update({
            where: { id: projectId },
            data: { isPublished: !project.isPublished },
        });
        res.json({ message: project.isPublished ? "Project published" : "Project unpublished" });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
}

// controller function to purchase credits
export const purchaseCredits = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { credits } = req.body;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // TODO: implement credit purchase logic
        res.json({ message: "Credits purchased", credits });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
};
