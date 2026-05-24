import { forwardRef, useRef, useState, useEffect, useImperativeHandle } from "react";
import type { Project } from "../types";
import { iframeScript } from "../assets/assets";
import { EditorPanel } from "./EditorPanel";
import { LoaderSteps } from "./LoaderSteps";

export interface ProjectPreviewProps {
    project: Project;
    isGenerating: boolean;
    device?: 'mobile' | 'tablet' | 'desktop';
    showEditorPanel?: boolean;
}
export interface ProjectPreviewRef {
    getCode: () => string | undefined;
}

export const ProjectPreview = forwardRef<ProjectPreviewRef, ProjectPreviewProps>
    (({ project, isGenerating, device = 'desktop', showEditorPanel = true }, ref) => {
        const iframeRef = useRef<HTMLIFrameElement>(null)
        const [selectedElement, setSelectedElement] = useState<any>(null)
        const onUpdate = (updates: any) => {
            if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow?.postMessage({ type: 'UPDATE_ELEMENT', payload: updates }, '*')
            }
        }
        const onClose = () => {
            setSelectedElement(null)
            if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow?.postMessage({ type: 'CLEAR_SELECTION_REQUEST' }, '*')
            }
        }
        useEffect(() => {
            const handleMessage = (event: MessageEvent) => {
                if (event.data.type === 'ELEMENT_SELECTED') {
                    setSelectedElement(event.data.payload)
                }
                else if (event.data.type === 'CLEAR_SELECTION') {
                    setSelectedElement(null)
                }
            }
            window.addEventListener('message', handleMessage)
            return () => {
                window.removeEventListener('message', handleMessage)
            }

        }, [])
        const resolutions = {
            mobile: 'w-[412px]',
            tablet: 'w-[768px]',
            desktop: 'w-full'
        }
        useImperativeHandle(ref, () => ({
            getCode: () => {
                const document = iframeRef.current?.contentDocument
                if (!document) return undefined
                document.querySelectorAll('.ai-selected-element,[data-ai-selected]').forEach(el => {
                    el.classList.remove('ai-selected-element');
                    el.removeAttribute('data-ai-selected');
                        (el as HTMLElement).style.outline = ''
                })
                const previewStyle = document.getElementById('ai-preview-style')
                if (previewStyle) {
                    previewStyle.remove()
                }
                const previewScript = document.getElementById('ai-preview-script')
                if (previewScript) {
                    previewScript.remove()
                }
                const html = document.documentElement.outerHTML
                return html
            }
        }))
        const injectPreview = (html: string) => {
            if (!html) return ''
            if (!showEditorPanel) return html
            if (html.includes('</body>')) {
                return html.replace('</body>', iframeScript + '</body>')
            } else {
                return html + iframeScript
            }
        }
        return (
            <div className="relative h-full bg-gray-900 flex-1 rounded-xl overflow-hidden max-sm:ml-2">
                {project.current_code ? (
                    <>
                        <iframe
                            ref={iframeRef}
                            srcDoc={injectPreview(project.current_code)}
                            className={`h-full max-sm:w-full ${resolutions[device]} mx-auto transition-all`} />
                        {showEditorPanel && selectedElement && (
                            <EditorPanel selectedElement={selectedElement} onUpdate={onUpdate} onClose={onClose} />
                        )}
                    </>
                ) : isGenerating && (
                  <LoaderSteps />
                 
                )}

            </div>
        )
    })
