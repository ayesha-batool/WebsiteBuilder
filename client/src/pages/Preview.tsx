import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import type { Project } from "../types";
import { authClient } from "../lib/auth-client";
import { Loader2Icon } from "lucide-react";
import { ProjectPreview } from "../components/ProjectPreview";
import api from "@/configs/axios";
import { useNavigate } from "react-router-dom";
const Preview = () => {
  const navigate = useNavigate();
  const { projectId, versionId } = useParams();
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { data: session, isPending } = authClient.useSession();

  const fetchCode = async () => {
    try {
      const { data } = await api.get(`/api/project/preview/${projectId}`, {
        params: versionId ? { versionId } : undefined,
      });
      setCode(data.code);
      setLoading(false);
    } catch (error: unknown) {
      setLoading(false);
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : error instanceof Error
            ? error.message
            : "Failed to fetch code";
      toast.error("Failed to fetch preview", { description: message });
    }
  };

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      setLoading(false);
      toast.error("Please sign in to preview this project");
      navigate("/auth/sign-in");
      return;
    }
    if (projectId) {
      fetchCode();
    }
  }, [session?.user, isPending, projectId, versionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2Icon className="size-7 animate-spin text-indigo-200" />
      </div>
    );
  }

  return (
    <div className="h-screen">
      {code && <ProjectPreview project={{ current_code: code } as Project} isGenerating={false} showEditorPanel={false} device="desktop" />}

    </div>
  );
};

export default Preview;