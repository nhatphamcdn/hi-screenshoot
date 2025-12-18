
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

  const updateObjectShadow = (updates: Partial<fabric.TShadowOptions>) => {
    if (selectedObject && fabricCanvas) {
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
    if (selectedObject && selectedObject.type === 'image' && fabricCanvas) {
      const clipPath = new fabric.Rect({
        originX: 'center',
        originY: 'center',
        rx: value,
        ry: value,
        width: selectedObject.width,
        height: selectedObject.height,
      });
      selectedObject.set('clipPath', clipPath);
      (selectedObject as any)._cornerRadius = value;
      fabricCanvas.renderAll();
      onObjectChange?.();
    }
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

  const fillValue = selectedObject?.fill;
  const hasFill = !!selectedObject && fillValue !== 'transparent' && fillValue !== '' && fillValue !== null;
  
  const strokeWidth = selectedObject?.strokeWidth || 0;
  const hasStroke = !!selectedObject && strokeWidth > 0;

  const currentCornerRadius = (selectedObject as any)?._cornerRadius || 0;
  const currentShadow = selectedObject?.shadow as fabric.Shadow | undefined;
  const isInsideShadow = (selectedObject as any)?._isInsideShadow || false;

  const toggleShadowPlacement = (isInside: boolean) => {
    if (!selectedObject || !fabricCanvas) return;
    
    (selectedObject as any)._isInsideShadow = isInside;
    
    if (isInside) {
      // Simulate Inside Shadow:
      // We use a high stroke width with transparency and a centered shadow
      selectedObject.set({
        stroke: 'rgba(0,0,0,0.05)',
        strokeWidth: 20,
        shadow: new fabric.Shadow({
          color: 'rgba(0,0,0,0.4)',
          blur: 30,
          offsetX: 0,
          offsetY: 0
        })
      });
    } else {
      // Revert to normal outside shadow
      selectedObject.set({
        stroke: 'transparent',
        strokeWidth: 0,
        shadow: new fabric.Shadow({
          color: 'rgba(0,0,0,0.4)',
          blur: 40,
          offsetX: 0,
          offsetY: 10
        })
      });
    }
    
    fabricCanvas.renderAll();
    onObjectChange?.();
  };

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

            {isImage && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold">
                    <span>Corner Radius</span>
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

            {isShape && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Fill Color</label>
                    <button 
                      onClick={() => updateObjectProperty('fill', hasFill ? 'transparent' : '#6366f1')}
                      className={`p-1.5 rounded-md transition-all ${hasFill ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-600 hover:bg-slate-800'}`}
                    >
                      {hasFill ? <Check size={14} /> : <X size={14} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-9 bg-slate-800 rounded-md flex items-center px-3 border border-slate-700 relative overflow-hidden">
                      <input 
                        type="color" 
                        disabled={!hasFill}
                        onChange={(e) => updateObjectProperty('fill', e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
                        value={typeof selectedObject.fill === 'string' && hasFill ? (selectedObject.fill as string) : '#6366f1'}
                      />
                      <div className="w-full flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-sm border border-slate-600" 
                          style={{ backgroundColor: !hasFill ? 'transparent' : (selectedObject.fill as string) }}
                        />
                        <span className="text-[10px] text-slate-400 font-mono">
                          {!hasFill ? 'NONE' : (selectedObject.fill as string)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Object Shadow Section */}
            <div className="space-y-6 border-t border-slate-800 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <ShadowIcon size={14} />
                  Shadow
                </h3>
                <button 
                  onClick={() => {
                    if (currentShadow) {
                      updateObjectProperty('shadow', null);
                    } else {
                      updateObjectShadow({ blur: 20, color: 'rgba(0,0,0,0.5)', offsetY: 10 });
                    }
                  }}
                  className={`p-1.5 rounded-md transition-all ${currentShadow ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-600 hover:bg-slate-800'}`}
                >
                  {currentShadow ? <Check size={14} /> : <Plus size={14} />}
                </button>
              </div>

              {currentShadow && (
                <div className="space-y-5 animate-in slide-in-from-top-2 duration-200">
                  <div className="bg-slate-800/50 p-1 rounded-lg flex border border-slate-700">
                    <button 
                      onClick={() => toggleShadowPlacement(false)}
                      className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${!isInsideShadow ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Outside
                    </button>
                    <button 
                      onClick={() => toggleShadowPlacement(true)}
                      className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${isInsideShadow ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Inside
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold">
                        <span>Blur Radius</span>
                        <span className="font-mono text-indigo-400">{currentShadow.blur}px</span>
                      </div>
                      <input 
                        type="range" min="0" max="120" step="1" 
                        value={currentShadow.blur}
                        onChange={(e) => updateObjectShadow({ blur: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    {!isInsideShadow && (
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
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Color & Opacity</label>
                      <div className="flex items-center gap-3">
                        <div className="w-full h-10 bg-slate-800 rounded-md border border-slate-700 relative overflow-hidden flex items-center px-3 hover:border-slate-600 transition-colors">
                          <input 
                            type="color" 
                            onChange={(e) => updateObjectShadow({ color: e.target.value })}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            value={currentShadow.color?.toString().startsWith('#') ? currentShadow.color.toString() : '#000000'}
                          />
                          <div className="w-5 h-5 rounded-full border border-slate-600 mr-3" style={{ backgroundColor: currentShadow.color?.toString() }} />
                          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Change shadow color</span>
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
          <p className="font-bold text-indigo-300 mb-2 uppercase tracking-wide">Dynamic Scaling</p>
          {isInsideShadow ? "Inside shadows use an inner glow effect. Best for a 'pushed-in' or 'beveled' look." : "Outer shadows are now safe from clipping. The canvas buffer automatically handles large offsets."}
        </div>
      </div>
    </aside>
  );
};

export default SidebarRight;
