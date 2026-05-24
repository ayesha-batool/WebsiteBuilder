import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Version } from "../types";
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
      const { data } = await api.get(`/api/project/preview/${projectId}`);
      setCode(data.project.current_code);
      if (versionId) {
        data.project.versions.forEach((version: Version) => {
          if (version.id === versionId) {
            setCode(version.code);
          }
        });
      }
      setLoading(false);
    } catch (error: any) {
      toast.error("Failed to fetch code", {
        description: error?.message,
      });
    }
    console.log(code);
  }

  useEffect(() => {
    if (session?.user && !isPending) {
      fetchCode();
    }

  }, [session?.user]);

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