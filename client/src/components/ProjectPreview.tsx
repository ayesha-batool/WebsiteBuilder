import { forwardRef, useRef, useState, useEffect, useImperativeHandle, useCallback } from "react";
import type { Project } from "../types";
import { iframeScript } from "../assets/assets";
import { EditorPanel } from "./EditorPanel";
import { LoaderSteps } from "./LoaderSteps";

export type PreviewMode = 'interact' | 'edit';

export interface ProjectPreviewProps {
    project: Project;
    isGenerating: boolean;
    device?: 'mobile' | 'tablet' | 'desktop';
    showEditorPanel?: boolean;
    previewMode?: PreviewMode;
}
export interface ProjectPreviewRef {
    getCode: () => string | undefined;
}

export const ProjectPreview = forwardRef<ProjectPreviewRef, ProjectPreviewProps>
    (({ project, isGenerating, device = 'desktop', showEditorPanel = true, previewMode = 'interact' }, ref) => {
        const iframeRef = useRef<HTMLIFrameElement>(null)
        const [selectedElement, setSelectedElement] = useState<any>(null)

        const sendPreviewMode = useCallback((mode: PreviewMode) => {
            iframeRef.current?.contentWindow?.postMessage({ type: 'SET_PREVIEW_MODE', payload: mode }, '*')
        }, [])

        useEffect(() => {
            sendPreviewMode(previewMode)
            if (previewMode === 'interact') {
                setSelectedElement(null)
            }
        }, [previewMode, sendPreviewMode])

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

        const injectPreview = useCallback((html: string) => {
            if (!html) return ''
            if (!showEditorPanel) return html
            const cleaned = html
                .replace(/<style id="ai-preview-style">[\s\S]*?<\/style>/gi, '')
                .replace(/<script id="ai-preview-script">[\s\S]*?<\/script>/gi, '')
            const bodyClose = cleaned.lastIndexOf('</body>')
            if (bodyClose !== -1) {
                return cleaned.slice(0, bodyClose) + iframeScript + cleaned.slice(bodyClose)
            }
            return cleaned + iframeScript
        }, [showEditorPanel])

        const attachNavGuard = useCallback((doc: Document) => {
            const handler = (e: MouseEvent) => {
                const anchor = (e.target as Element)?.closest?.('a[href]') as HTMLAnchorElement | null
                if (!anchor) return
                const href = anchor.getAttribute('href')
                if (!href || href === '#' || href.startsWith('#')) return
                if (/^(javascript|mailto|tel):/i.test(href)) return
                if (anchor.target === '_parent' || anchor.target === '_top') {
                    e.preventDefault()
                    e.stopPropagation()
                    return
                }
                try {
                    const url = new URL(href, window.location.origin)
                    if (url.origin === window.location.origin) {
                        e.preventDefault()
                        e.stopPropagation()
                    }
                } catch {
                    /* ignore invalid URLs */
                }
            }
            doc.addEventListener('click', handler, true)
            return () => doc.removeEventListener('click', handler, true)
        }, [])

        useEffect(() => {
            const iframe = iframeRef.current
            if (!iframe || !project.current_code) return

            const html = injectPreview(project.current_code)
            let removeNavGuard: (() => void) | undefined

            const loadPreview = () => {
                const doc = iframe.contentDocument
                if (!doc) return
                removeNavGuard?.()
                removeNavGuard = attachNavGuard(doc)
                sendPreviewMode(previewMode)
            }

            const doc = iframe.contentDocument
            if (doc) {
                doc.open()
                doc.write(html)
                doc.close()
                loadPreview()
            }

            const onLoad = () => loadPreview()
            iframe.addEventListener('load', onLoad)

            return () => {
                iframe.removeEventListener('load', onLoad)
                removeNavGuard?.()
            }
        }, [project.current_code, injectPreview, attachNavGuard, sendPreviewMode, previewMode])

        return (
            <div className="relative h-full bg-gray-900 flex-1 rounded-xl overflow-hidden max-sm:ml-2">
                {project.current_code ? (
                    <>
                        <iframe
                            ref={iframeRef}
                            title="Website preview"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                            className={`h-full max-sm:w-full ${resolutions[device]} mx-auto transition-all border-0`} />
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
