
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
  Minus,
  Check,
  X,
  Square
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

  // Robust checks for stroke/fill status
  // Fabric 6 might have fill as null or 'transparent'
  const fillValue = selectedObject?.fill;
  const hasFill = !!selectedObject && fillValue !== 'transparent' && fillValue !== '' && fillValue !== null;
  
  const strokeWidth = selectedObject?.strokeWidth || 0;
  const hasStroke = !!selectedObject && strokeWidth > 0;

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col z-40 overflow-y-auto">
      <div className="flex border-b border-slate-800 h-12 shrink-0">
        <button className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold ${!selectedObject ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}>
          <Settings2 size={14} />
          SCENE
        </button>
        <button className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold ${selectedObject ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}>
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
                Background
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
                Canvas Layout
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Padding</span>
                    <span className="font-mono">{state.padding}px</span>
                  </div>
                  <input 
                    type="range" min="0" max="200" value={state.padding}
                    onChange={(e) => setState(s => ({ ...s, padding: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Corner Radius</span>
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
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Maximize size={14} />
                {selectedObject.type?.toUpperCase()} Properties
              </h3>
            </div>

            {isText && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-bold uppercase">Typography</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-9 bg-slate-800 rounded-md flex items-center px-3 border border-slate-700">
                       <Type size={14} className="text-slate-500 mr-2" />
                       <span className="text-[11px] text-slate-300 font-bold uppercase">Inter</span>
                       <ChevronRight size={14} className="ml-auto text-slate-500" />
                    </div>
                    <div className="w-9 h-9 rounded-md border border-slate-700 bg-slate-800 relative overflow-hidden">
                      <input 
                        type="color" 
                        onChange={(e) => updateObjectProperty('fill', e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        value={typeof selectedObject.fill === 'string' ? selectedObject.fill : '#ffffff'}
                      />
                      <div className="w-full h-full" style={{ backgroundColor: typeof selectedObject.fill === 'string' ? selectedObject.fill : '#ffffff' }} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateObjectProperty('fontWeight', (selectedObject as any).fontWeight === 'bold' ? 'normal' : 'bold')} 
                      className={`flex-1 h-8 rounded text-[10px] font-bold border transition-colors ${(selectedObject as any).fontWeight === 'bold' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'}`}
                    >
                      BOLD
                    </button>
                    <button 
                      onClick={() => updateObjectProperty('fontStyle', (selectedObject as any).fontStyle === 'italic' ? 'normal' : 'italic')} 
                      className={`flex-1 h-8 rounded text-[10px] font-bold border transition-colors ${(selectedObject as any).fontStyle === 'italic' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'}`}
                    >
                      ITALIC
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isShape && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-500 font-bold uppercase">Fill</label>
                    <button 
                      onClick={() => updateObjectProperty('fill', hasFill ? 'transparent' : '#6366f1')}
                      className={`p-1 rounded transition-colors ${hasFill ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-600 hover:bg-slate-800'}`}
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
                        <span className="text-[10px] text-slate-400 font-mono uppercase">
                          {!hasFill ? 'NONE' : (selectedObject.fill as string)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 border-t border-slate-800 pt-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-500 font-bold uppercase">Outline</label>
                    <button 
                      onClick={() => {
                        updateObjectProperty('strokeWidth', hasStroke ? 0 : 2);
                        if (!hasStroke && (!selectedObject.stroke || selectedObject.stroke === 'transparent')) {
                          updateObjectProperty('stroke', '#6366f1');
                        }
                      }}
                      className={`p-1 rounded transition-colors ${hasStroke ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-600 hover:bg-slate-800'}`}
                    >
                      {hasStroke ? <Check size={14} /> : <X size={14} />}
                    </button>
                  </div>
                  
                  {hasStroke && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Width</span>
                          <span>{selectedObject.strokeWidth}px</span>
                        </div>
                        <input 
                          type="range" min="1" max="20" step="1" 
                          value={selectedObject.strokeWidth || 1}
                          onChange={(e) => updateObjectProperty('strokeWidth', parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-9 bg-slate-800 rounded-md flex items-center px-3 border border-slate-700 relative overflow-hidden">
                          <input 
                            type="color" 
                            onChange={(e) => updateObjectProperty('stroke', e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            value={typeof selectedObject.stroke === 'string' ? selectedObject.stroke : '#6366f1'}
                          />
                          <div className="w-full flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-sm border border-slate-600" 
                              style={{ backgroundColor: typeof selectedObject.stroke === 'string' ? selectedObject.stroke : 'transparent' }}
                            />
                            <span className="text-[10px] text-slate-400 font-mono uppercase">
                              {typeof selectedObject.stroke === 'string' ? selectedObject.stroke : 'None'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-800">
              <button 
                onClick={bringForward}
                className="h-9 rounded-md bg-slate-800 border border-slate-700 hover:bg-slate-750 text-[10px] font-bold flex items-center justify-center gap-2 text-slate-300 uppercase"
              >
                Bring Forward
              </button>
              <button 
                onClick={sendBackward}
                className="h-9 rounded-md bg-slate-800 border border-slate-700 hover:bg-slate-750 text-[10px] font-bold flex items-center justify-center gap-2 text-slate-300 uppercase"
              >
                Send Backward
              </button>
            </div>
          </section>
        )}
      </div>

      <div className="p-4 bg-slate-950/50 border-t border-slate-800 shrink-0">
        <div className="p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 text-[11px] text-indigo-300/80 leading-relaxed">
          <p className="font-bold text-indigo-300 mb-1">Styling Tip:</p>
          {isShape ? "Toggling 'Fill' or 'Outline' checkmarks updates the object instantly. Use the sliders for precision." : "Select an object to see its properties."}
        </div>
      </div>
    </aside>
  );
};

export default SidebarRight;
