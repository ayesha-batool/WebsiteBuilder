import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface EditorPanelProps {
    selectedElement: {
        tagName: string;
        className: string;
        text: string;
        styles: {
            padding: string;
            margin: string;
            backgroundColor: string;
            color: string;
            fontSize: string;
        };
    } | null;

    onUpdate: (updates: any) => void;
    onClose: () => void;
}

export const EditorPanel = ({ selectedElement, onUpdate, onClose }: EditorPanelProps) => {
    const [values, setValues] = useState(selectedElement)

    useEffect(() => {
        setValues(selectedElement)
    }, [selectedElement])
    if (!selectedElement || !values) return null;
    const handleChange = (field: string, value: string) => {
        const newValues = { ...values, [field]: value }
        if (field in values.styles) {
            newValues.styles = { ...values.styles, [field]: value }
        }
        setValues(newValues)
        onUpdate({ [field]: value })

    }
const handleStyleChange = (styleName: string, value: string) => {
    const newValues = { ...values.styles, [styleName]: value }
    setValues({...values, styles: newValues})
    onUpdate({ styles: {[styleName]: value} })
}
    return (
        <div className="absolute top-4 right-4 w-80 bg-white p-4 rounded-lg shadow-xl border border-gray-200 z-50 animate-fade-in fade-in">
            <div className="flex items-center justify-between mb-4 ">
                <h3 className="text-gray-800 font-semibold">Edit Element</h3>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                    <X className="h-4 w-4 text-gray-500" />
                </button>
            </div>
            <div className="space-y-4 text-black overflow-y-auto max-h-[calc(100vh-10rem)]">
                <div>
                    <label htmlFor="" className="block text-xs font-medium text-gray-500 mb-1">Text Content</label>
                    <textarea
                        value={values.text}
                        onChange={(e) => handleChange('text', e.target.value)} name="" id=""
                        className="w-full text-sm p-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none min-h-20"></textarea>
                </div>
                <div>
                    <label htmlFor="" className="block text-xs font-medium text-gray-500 mb-1">Class Name</label>
                    <input type="text"
                        value={values.className || ''}
                        onChange={(e) => handleChange('className', e.target.value)} name="" id=""
                        className="w-full text-sm p-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"></input>
                        
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="" className="block text-xs font-medium text-gray-500 mb-1">Padding</label>
                        <input type="text"
                            value={values.styles.padding || ''}
                            onChange={(e) => handleStyleChange('padding', e.target.value)} name="" id=""
                            className="w-full text-sm p-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"></input>
                    </div>
                   
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="" className="block text-xs font-medium text-gray-500 mb-1">Margin</label>
                        <input type="text"
                            value={values.styles.margin || ''}
                            onChange={(e) => handleStyleChange('margin', e.target.value)} name="" id=""
                            className="w-full text-sm p-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"></input>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="" className="block text-xs font-medium text-gray-500 mb-1">Font Size</label>
                            <input type="text"
                                value={values.styles.fontSize || ''}
                                onChange={(e) => handleStyleChange('fontSize', e.target.value)} name="" id=""
                                className="w-full text-sm p-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"></input>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="" className="block text-xs font-medium text-gray-500 mb-1">BackgroundColor</label>
                      <div className="flex items-center gap-2 border border-gray-400 rounded-md p-1">
                        <input type="color"
                            value={values.styles.backgroundColor==='rgba(0, 0, 0, 0)'?'#ffffff':values.styles.backgroundColor}
                            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)} name="" id=""
                            className="w-6 h-6 cursor-pointer"></input>
                            <span className="text-xs text-gray-600 truncate">{values.styles.backgroundColor==='rgba(0, 0, 0, 0)'?'#ffffff':values.styles.backgroundColor}</span>
                    </div>

                      </div>

                    <div>
                        <label htmlFor="" className="block text-xs font-medium text-gray-500 mb-1">Text Color</label>
                        <div className="flex items-center gap-2 border border-gray-400 rounded-md p-1">             
                        <input type="color"
                                value={values.styles.color}
                                onChange={(e) => handleStyleChange('color', e.target.value)} name="" id=""
                                className="w-6 h-6 cursor-pointer"></input>
                                <span className="text-xs text-gray-600 truncate">{values.styles.color}</span>
                        </div>
                    </div>
                </div>
               

            </div>
        </div>
    )
}
