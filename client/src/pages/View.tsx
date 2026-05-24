import { useParams } from "react-router-dom";
import type { Project } from "../types";
import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { ProjectPreview } from "../components/ProjectPreview";
import { toast } from "sonner";
import api from "@/configs/axios";


const View = () => {
  const { projectId } = useParams();
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCode = async () => {
    try {
      const { data } = await api.get(`/api/project/published/${projectId}`);
      setCode(data.code);
      setLoading(false);
    } catch (error: any) {
      toast.error("Failed to fetch code", {
        description: error?.message,
      });
    }
  }
  useEffect(() => {
    fetchCode();
  }, []);

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

export default View;