
import React from 'react';
import * as fabric from 'fabric';
import { 
  Palette, 
  Settings2, 
  Type, 
  Maximize, 
  Layers, 
  Layout, 
  ChevronRight, 
  Check, 
  X, 
  Plus, 
  Image as ImageIcon, 
  Wand2 as ShadowIcon 
} from 'lucide-react';
import { EditorState } from '../types';

interface SidebarRightProps {
  state: EditorState;
  setState: React.Dispatch<React.SetStateAction<EditorState>>;
  selectedObject: fabric.FabricObject | null;
  fabricCanvas: fabric.Canvas | null;
  onObjectChange?: () => void;
  refresh: number;
}

const SidebarRight: React.FC<SidebarRightProps> = ({ state, setState, selectedObject, fabricCanvas, onObjectChange, refresh }) => {
  
  const updateObjectProperty = (prop: string, value: any) => {
    if (selectedObject && fabricCanvas) {
      selectedObject.set(prop as any, value);
      fabricCanvas.renderAll();
      onObjectChange?.();
    }
  };

  const getObjectClipPath = (obj: fabric.FabricObject) => {
    const common = {
      originX: 'center',
      originY: 'center',
      absolutePositioned: false,
    };

    if (obj.type === 'rect' || obj.type === 'image') {
      const rx = (obj as any)._cornerRadius || 0;
      return new fabric.Rect({
        ...common,
        width: obj.width,
        height: obj.height,
        rx: rx,
        ry: rx,
      });
    } else if (obj.type === 'circle') {
      return new fabric.Circle({
        ...common,
        radius: (obj as any).radius,
      });
    }
    return null;
  };

  const updateObjectShadow = (updates: Partial<fabric.TShadowOptions>) => {
    if (selectedObject && fabricCanvas) {
      const isInside = (selectedObject as any)._isInsideShadow;
      
      if (isInside) {
        // In "Inside" mode, 'blur' controls the stroke width
        // and 'color' controls the stroke color
        if (updates.blur !== undefined) {
          selectedObject.set('strokeWidth', updates.blur);
        }
        if (updates.color !== undefined) {
          selectedObject.set('stroke', updates.color);
        }
      } else {
        const currentShadow = selectedObject.shadow as fabric.Shadow;
        const defaultOptions: fabric.TShadowOptions = {
          color: 'rgba(0,0,0,0.5)',
          blur: 0,
          offsetX: 0,
          offsetY: 0,
        };

        const baseOptions = currentShadow ? {
          color: currentShadow.color,
          blur: currentShadow.blur,
          offsetX: currentShadow.offsetX,
          offsetY: currentShadow.offsetY,
        } : defaultOptions;

        selectedObject.set('shadow', new fabric.Shadow({
          ...baseOptions,
          ...updates
        }));
      }
      
      fabricCanvas.renderAll();
      onObjectChange?.();
    }
  };

  const handleDeselect = () => {
    if (fabricCanvas) {
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
    }
  };

  const updateImageBorderRadius = (value: number) => {
    if (selectedObject && fabricCanvas) {
      (selectedObject as any)._cornerRadius = value;
      // Re-apply clipPath which handles both border radius and inner shadow clipping
      selectedObject.set('clipPath', getObjectClipPath(selectedObject));
      fabricCanvas.renderAll();
      onObjectChange?.();
    }
  };

  const toggleShadowPlacement = (isInside: boolean) => {
    if (!selectedObject || !fabricCanvas) return;
    
    (selectedObject as any)._isInsideShadow = isInside;
    
    if (isInside) {
      // Switch to INNER shadow simulation
      // 1. Save current shadow color/blur if exists
      const color = selectedObject.shadow instanceof fabric.Shadow ? selectedObject.shadow.color : 'rgba(0,0,0,0.3)';
      const blur = selectedObject.shadow instanceof fabric.Shadow ? selectedObject.shadow.blur : 20;

      selectedObject.set({
        shadow: null,
        stroke: color,
        strokeWidth: blur,
        strokeUniform: true,
        // We MUST use a clipPath to hide the part of the stroke that falls outside
        clipPath: getObjectClipPath(selectedObject)
      });
    } else {
      // Switch back to OUTER shadow
      const color = typeof selectedObject.stroke === 'string' ? selectedObject.stroke : 'rgba(0,0,0,0.4)';
      const blur = selectedObject.strokeWidth || 40;

      selectedObject.set({
        stroke: 'transparent',
        strokeWidth: 0,
        shadow: new fabric.Shadow({
          color: color,
          blur: blur,
          offsetX: 0,
          offsetY: 10
        }),
        // Only keep clipPath if it's an image with border radius
        clipPath: selectedObject.type === 'image' || (selectedObject as any)._cornerRadius > 0 
          ? getObjectClipPath(selectedObject) 
          : null
      });
    }
    
    fabricCanvas.renderAll();
    onObjectChange?.();
  };

  const GRADIENTS = [
    'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
    'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
    'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
  ];

  const isShape = selectedObject?.type === 'rect' || selectedObject?.type === 'circle';
  const isText = selectedObject?.type === 'i-text';
  const isImage = selectedObject?.type === 'image';

  const bringForward = () => {
    if (fabricCanvas && selectedObject) {
      fabricCanvas.bringObjectForward(selectedObject);
      fabricCanvas.renderAll();
      onObjectChange?.();
    }
  };

  const sendBackward = () => {
    if (fabricCanvas && selectedObject) {
      fabricCanvas.sendObjectBackwards(selectedObject);
      fabricCanvas.renderAll();
      onObjectChange?.();
    }
  };

  const currentCornerRadius = (selectedObject as any)?._cornerRadius || 0;
  const isInsideShadow = (selectedObject as any)?._isInsideShadow || false;
  
  // Resolve current visual shadow properties
  const currentShadow = selectedObject?.shadow as fabric.Shadow | undefined;
  const displayBlur = isInsideShadow ? (selectedObject?.strokeWidth || 0) : (currentShadow?.blur || 0);
  const displayColor = isInsideShadow 
    ? (typeof selectedObject?.stroke === 'string' ? selectedObject.stroke : '#000000') 
    : (currentShadow?.color?.toString() || '#000000');

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col z-40 overflow-y-auto custom-scrollbar">
      <div className="flex border-b border-slate-800 h-12 shrink-0">
        <button 
          onClick={handleDeselect}
          className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold transition-colors ${!selectedObject ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Settings2 size={14} />
          SCENE
        </button>
        <button className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold transition-colors ${selectedObject ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-300 cursor-default'}`}>
          <Layers size={14} />
          OBJECT
        </button>
      </div>

      <div className="p-6 space-y-8 flex-1">
        {!selectedObject && (
          <>
            <section className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Palette size={14} />
                Frame Style
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {GRADIENTS.map((grad, i) => (
                  <button
                    key={i}
                    onClick={() => setState(s => ({ ...s, backgroundGradient: grad }))}
                    className="h-10 rounded-md border border-slate-700 hover:scale-105 transition-transform"
                    style={{ background: grad }}
                  />
                ))}
                <div className="h-10 rounded-md border border-slate-700 bg-slate-800 flex items-center justify-center relative overflow-hidden">
                  <input 
                    type="color" 
                    value={state.backgroundColor}
                    onChange={(e) => setState(s => ({ ...s, backgroundColor: e.target.value, backgroundGradient: '' }))}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                  />
                  <span className="text-[10px] text-slate-500 font-bold uppercase pointer-events-none">Color</span>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Layout size={14} />
                Dimensions
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Padding</span>
                    <span className="font-mono">{state.padding}px</span>
                  </div>
                  <input 
                    type="range" min="0" max="250" value={state.padding}
                    onChange={(e) => setState(s => ({ ...s, padding: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Frame Radius</span>
                    <span className="font-mono">{state.borderRadius}px</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={state.borderRadius}
                    onChange={(e) => setState(s => ({ ...s, borderRadius: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            </section>
          </>
        )}

        {selectedObject && (
          <section className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Maximize size={14} />
                {selectedObject.type?.toUpperCase()} Props
              </h3>
            </div>

            {(isImage || isShape) && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold">
                    <span>Object Rounding</span>
                    <span className="font-mono text-indigo-400">{currentCornerRadius}px</span>
                  </div>
                  <input 
                    type="range" min="0" max="200" step="1" 
                    value={currentCornerRadius}
                    onChange={(e) => updateImageBorderRadius(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            )}

            {isText && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Font & Color</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-9 bg-slate-800 rounded-md flex items-center px-3 border border-slate-700">
                       <Type size={14} className="text-slate-500 mr-2" />
                       <span className="text-[11px] text-slate-300">Inter</span>
                       <ChevronRight size={14} className="ml-auto text-slate-500" />
                    </div>
                    <div className="w-9 h-9 rounded-md border border-slate-700 bg-slate-800 relative overflow-hidden shrink-0">
                      <input 
                        type="color" 
                        onChange={(e) => updateObjectProperty('fill', e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        value={typeof selectedObject.fill === 'string' ? selectedObject.fill : '#ffffff'}
                      />
                      <div className="w-full h-full" style={{ backgroundColor: typeof selectedObject.fill === 'string' ? selectedObject.fill : '#ffffff' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Object Shadow/Glow Section */}
            <div className="space-y-6 border-t border-slate-800 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <ShadowIcon size={14} />
                  Shadow & Glow
                </h3>
                <button 
                  onClick={() => {
                    const hasAny = currentShadow || isInsideShadow;
                    if (hasAny) {
                      selectedObject.set({ shadow: null, stroke: 'transparent', strokeWidth: 0, clipPath: selectedObject.type === 'image' ? getObjectClipPath(selectedObject) : null });
                      (selectedObject as any)._isInsideShadow = false;
                      fabricCanvas?.renderAll();
                      onObjectChange?.();
                    } else {
                      toggleShadowPlacement(false);
                    }
                  }}
                  className={`p-1.5 rounded-md transition-all ${(currentShadow || isInsideShadow) ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-600 hover:bg-slate-800'}`}
                >
                  {(currentShadow || isInsideShadow) ? <Check size={14} /> : <Plus size={14} />}
                </button>
              </div>

              {(currentShadow || isInsideShadow) && (
                <div className="space-y-5 animate-in slide-in-from-top-2 duration-200">
                  <div className="bg-slate-800/50 p-1 rounded-lg flex border border-slate-700">
                    <button 
                      onClick={() => toggleShadowPlacement(false)}
                      className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${!isInsideShadow ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Outside (Shadow)
                    </button>
                    <button 
                      onClick={() => toggleShadowPlacement(true)}
                      className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${isInsideShadow ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Inside (Glow)
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold">
                        <span>{isInsideShadow ? 'Glow Intensity' : 'Blur Radius'}</span>
                        <span className="font-mono text-indigo-400">{Math.round(displayBlur)}px</span>
                      </div>
                      <input 
                        type="range" min="0" max="150" step="1" 
                        value={displayBlur}
                        onChange={(e) => updateObjectShadow({ blur: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    {!isInsideShadow && currentShadow && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold">
                            <span>Offset X</span>
                            <span className="font-mono text-indigo-400">{currentShadow.offsetX}</span>
                          </div>
                          <input 
                            type="range" min="-80" max="80" step="1" 
                            value={currentShadow.offsetX}
                            onChange={(e) => updateObjectShadow({ offsetX: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold">
                            <span>Offset Y</span>
                            <span className="font-mono text-indigo-400">{currentShadow.offsetY}</span>
                          </div>
                          <input 
                            type="range" min="-80" max="80" step="1" 
                            value={currentShadow.offsetY}
                            onChange={(e) => updateObjectShadow({ offsetY: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Color & Theme</label>
                      <div className="flex items-center gap-3">
                        <div className="w-full h-10 bg-slate-800 rounded-md border border-slate-700 relative overflow-hidden flex items-center px-3 hover:border-slate-600 transition-colors">
                          <input 
                            type="color" 
                            onChange={(e) => updateObjectShadow({ color: e.target.value })}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            value={displayColor.startsWith('#') ? displayColor : '#000000'}
                          />
                          <div className="w-5 h-5 rounded-full border border-slate-600 mr-3 shadow-inner" style={{ backgroundColor: displayColor }} />
                          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Change effect color</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-6 border-t border-slate-800">
              <button 
                onClick={bringForward}
                className="h-10 rounded-md bg-slate-800 border border-slate-700 hover:bg-slate-750 hover:text-white text-[10px] font-bold text-slate-400 uppercase transition-all"
              >
                Bring Forward
              </button>
              <button 
                onClick={sendBackward}
                className="h-10 rounded-md bg-slate-800 border border-slate-700 hover:bg-slate-750 hover:text-white text-[10px] font-bold text-slate-400 uppercase transition-all"
              >
                Send Backward
              </button>
            </div>
          </section>
        )}
      </div>

      <div className="p-4 bg-slate-950/50 border-t border-slate-800 shrink-0">
        <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 text-[11px] text-slate-400 leading-relaxed shadow-inner">
          <p className="font-bold text-indigo-300 mb-2 uppercase tracking-wide">Inner Glow Logic</p>
          {isInsideShadow ? "The glow is restricted to the inside using a clipPath. Adjust 'Intensity' to grow the inner stroke." : "Outer shadows cast a classic drop shadow that renders outside the object's path."}
        </div>
      </div>
    </aside>
  );
};

export default SidebarRight;
