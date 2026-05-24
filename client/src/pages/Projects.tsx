import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowBigDownDashIcon, EyeIcon, EyeOffIcon, FullscreenIcon, Loader2Icon, MonitorIcon, SaveIcon, SmartphoneIcon, TabletIcon, XIcon } from "lucide-react";
import type { Project } from "../types";
import { MessageSquareIcon } from "lucide-react";
import Sidebar from "../components/Sidebar";
import type { ProjectPreviewRef } from "../components/ProjectPreview";
import { ProjectPreview } from "../components/ProjectPreview";
import { toast } from "sonner";
import api from "../configs/axios";
import { authClient } from "../lib/auth-client";
const Projects = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const previewRef = useRef<ProjectPreviewRef>(null);

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/api/user/project/${projectId}`);
      const loaded = data?.project ?? null;
      console.log(loaded);
      setProject(loaded);
      setIsGenerating(loaded ? !loaded.current_code : false);
      setLoading(false);
      if (!loaded) {
        toast.error("Project not found or deleted");
        navigate("/projects", { replace: true });
      }
    } catch (err: unknown) {
      setProject(null);
      setLoading(false);
      const message = err && typeof err === "object" && "response" in err
        && (err as { response?: { status?: number } }).response?.status === 404
        ? "Project not found or deleted"
        : err instanceof Error ? err.message : "Failed to fetch project";
      toast.error("Failed to fetch project", { description: message });
      navigate("/projects", { replace: true });
    }
  }
  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-screen">
          <Loader2Icon className="animate-spin size-7 text-violet-200" />
        </div>
      </>
    )
  }
  const saveProject = async () => {
    if (!previewRef.current) {
      return toast.error("Please save the project first");
    }
    const code = previewRef.current?.getCode() || project?.current_code;
    if (!code) {
      return toast.error("Please save the project first");
    }
    setIsSaving(true);
    try {
      const { data } = await api.put(`/api/project/save/${projectId}`, { code });
      toast.success("Project saved successfully", {
        description: data.message,
      });
    } catch (error: any) {
      toast.error("Failed to save project", {
        description: error?.message,
      });
      console.log(error);
    }
    finally {
      setIsSaving(false);
    }
  }
  // download code (index.html)
  const downloadCode = async () => {
    const code = previewRef.current?.getCode() || project?.current_code;
    if (!code) {
      if (isGenerating) {
        return;
      }
      else {
        return;
      }
    };
    const element = document.createElement('a');

    const file = new Blob([code], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = 'index.html';
    document.body.appendChild(element);
    element.click();


  }

  const togglePublish = async () => {
try{
  const { data } =await api.put(`/api/project/publish-toggle/${projectId}`);
  toast.success("Project published successfully", {
    description: data.message,
  });
  setProject((prev) => prev ? { ...prev, isPublished: !prev.isPublished } : null);
} catch (error: any) {
  toast.error("Failed to publish project", {
    description: error?.message,
  });
  console.log(error);
}
  }
  useEffect(() => {
    if (session?.user) {
      fetchProject();
    }
    else if (!session?.user && !isPending) {
      navigate("/");
      toast.error("Please sign in to view this project");
    }
  }, [session?.user]);

  useEffect(() => {
    if (project && !project.current_code) {
      const intervalId = setInterval(() => {
        fetchProject();
      }, 10000);
      return () => clearInterval(intervalId);

    }
    fetchProject();
    console.log(project);
  }, [projectId]);

  return project ? (
    <div className="flex flex-col h-screen w-full bg-gray-900 text-white">
      {/* builder navbar */}
      <div className="flex max-sm:flex-col sm:items-center gap-4 px-4 py-2 no-scrollbar">
        {/* left side */}
        <div>
          <img src="/favicon.svg" alt="logo" className="h-6 cursor-pointer "
            onClick={() => navigate("/")} />
          <div>
            <p className="text-sm font-medium capitalize truncate">{project?.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">Previewing last saved version</p>
          </div>
          <div className="sm:hidden flex-1 flex justify-end">
            {isMenuOpen ? (
              <MessageSquareIcon onClick={() => setIsMenuOpen(false)} className="size-6 cursor-pointer" />
            ) : (
              <XIcon onClick={() => setIsMenuOpen(true)} className="size-6 cursor-pointer" />
            )}
          </div>
        </div>
        {/* middle side */}
        <div className="hidden sm:flex gap-2 bg-gray-950 p-1.5 rounded-md">
          <SmartphoneIcon onClick={() => setDevice("mobile")}
            className={`size-6 p-1 rounded cursor-pointer ${device === 'mobile' ? 'bg-gray-700' : ''}`} />
          <TabletIcon onClick={() => setDevice("tablet")}
            className={`size-6 p-1 rounded cursor-pointer ${device === 'tablet' ? 'bg-gray-700' : ''}`} />
          <MonitorIcon onClick={() => setDevice("desktop")}
            className={`size-6 p-1 rounded cursor-pointer ${device === 'desktop' ? 'bg-gray-700' : ''}`} />
        </div>
        {/* right side */}
        <div className="flex items-center gap-3 justify-end flex-1 text-xs sm:text-sm">
          <button onClick={saveProject} disabled={isSaving} className="max-sm:hidden bg-gray-800 hover:bg-gray-700 text-white
          px-3.5 py-1 flex items-center gap-2 rounded sm:rounded-sm 
          transition-colors border border-gray-700">
            {isSaving ? <Loader2Icon size={16} className="animate-spin" /> : <SaveIcon size={16} />}
            Save
          </button>

          <Link to={`/preview/${projectId}`} target="_blank" className="flex items-center gap-2 px-4 py-1 
        rounded sm:rounded-sm border border-gray-700 hover:border-gray-500 transition-colors">
            <FullscreenIcon size={16} /> Preview
          </Link>
          <button onClick={downloadCode} className="bg-linear-to-br from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500
         text-white px-3.5 py-1 flex items-center gap-2 rounded sm:rounded-sm transition-colors">
            <ArrowBigDownDashIcon size={16} /> Download
          </button>
          <button onClick={togglePublish} className="bg-linear-to-br from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500
         text-white px-3.5 py-1 flex items-center gap-2 rounded sm:rounded-sm transition-colors">
            {project?.isPublished ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
            {project?.isPublished ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>
      <div className="flex flex-1 overflow-auto">
        <Sidebar isMenuOpen={isMenuOpen} project={project} setProject={(p) => setProject(p)} isGenerating={isGenerating} setIsGenerating={setIsGenerating} />
        <div className="flex-1 p-2 pl-0">
          <ProjectPreview ref={previewRef} project={project} isGenerating={isGenerating} device={device} />
        </div>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center h-screen">
      <h1>Unable to load project!</h1>
    </div>
  );
};

export default Projects;