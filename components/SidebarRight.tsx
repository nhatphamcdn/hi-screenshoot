import React, { useState, useEffect } from 'react';
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
  Wand2 as ShadowIcon,
  Move,
  Lock,
  Unlock,
  Maximize2,
  Square as SquareIcon,
  Ghost,
  Highlighter
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
  const [lockAspect, setLockAspect] = useState(true);

  const updateObjectProperty = (prop: string, value: any) => {
    if (selectedObject && fabricCanvas) {
      selectedObject.set(prop as any, value);
      fabricCanvas.renderAll();
      onObjectChange?.();
    }
  };

  // Helper to handle fill color with alpha channel
  const updateFillAlpha = (alpha: number) => {
    if (!selectedObject || !fabricCanvas) return;
    
    const fill = selectedObject.fill;
    if (typeof fill === 'string' && fill !== 'transparent') {
      const color = new fabric.Color(fill);
      color.setAlpha(alpha);
      selectedObject.set('fill', color.toRgba());
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

    if (obj.type === 'image') {
      const rx = (obj as any)._cornerRadius || 0;
      return new fabric.Rect({
        ...common,
        width: obj.width,
        height: obj.height,
        rx: rx,
        ry: rx,
      });
    }
    return null;
  };

  const updateObjectShadow = (updates: Partial<fabric.TShadowOptions>) => {
    if (selectedObject && fabricCanvas) {
      const isInside = (selectedObject as any)._isInsideShadow;
      
      if (isInside) {
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

  const updateRounding = (value: number) => {
    if (selectedObject && fabricCanvas) {
      (selectedObject as any)._cornerRadius = value;
      
      if (selectedObject.type === 'rect') {
        selectedObject.set({ rx: value, ry: value });
      } else if (selectedObject.type === 'image') {
        selectedObject.set('clipPath', getObjectClipPath(selectedObject));
      }
      
      fabricCanvas.renderAll();
      onObjectChange?.();
    }
  };

  const toggleShadowPlacement = (isInside: boolean) => {
    if (!selectedObject || !fabricCanvas) return;
    
    (selectedObject as any)._isInsideShadow = isInside;
    
    if (isInside) {
      if (!(selectedObject as any)._originalStroke) {
        (selectedObject as any)._originalStroke = selectedObject.stroke;
        (selectedObject as any)._originalStrokeWidth = selectedObject.strokeWidth;
      }

      const color = selectedObject.shadow instanceof fabric.Shadow ? selectedObject.shadow.color : 'rgba(0,0,0,0.3)';
      const blur = selectedObject.shadow instanceof fabric.Shadow ? selectedObject.shadow.blur : 20;

      selectedObject.set({
        shadow: null,
        stroke: color,
        strokeWidth: blur,
        strokeUniform: true,
        clipPath: selectedObject.type === 'image' ? getObjectClipPath(selectedObject) : null
      });
    } else {
      const restoredStroke = (selectedObject as any)._originalStroke || 'transparent';
      const restoredStrokeWidth = (selectedObject as any)._originalStrokeWidth || 0;

      const color = typeof selectedObject.stroke === 'string' && selectedObject.stroke !== 'transparent' 
        ? selectedObject.stroke 
        : 'rgba(0,0,0,0.4)';
      const blur = selectedObject.strokeWidth > 0 && isInsideShadow ? selectedObject.strokeWidth : 40;

      selectedObject.set({
        stroke: restoredStroke,
        strokeWidth: restoredStrokeWidth,
        shadow: new fabric.Shadow({
          color: color,
          blur: blur,
          offsetX: 0,
          offsetY: 10
        }),
        clipPath: selectedObject.type === 'image' ? getObjectClipPath(selectedObject) : null
      });
    }
    
    fabricCanvas.renderAll();
    onObjectChange?.();
  };

  const handleSizeChange = (dim: 'width' | 'height', value: number) => {
    if (!selectedObject || !fabricCanvas) return;
    
    if (dim === 'width') {
      const scaleX = value / selectedObject.width;
      if (lockAspect) {
        selectedObject.set({ scaleX, scaleY: scaleX });
      } else {
        selectedObject.set('scaleX', scaleX);
      }
    } else {
      const scaleY = value / selectedObject.height;
      if (lockAspect) {
        selectedObject.set({ scaleX: scaleY, scaleY: scaleY });
      } else {
        selectedObject.set('scaleY', scaleY);
      }
    }
    fabricCanvas.renderAll();
    onObjectChange?.();
  };

  const handlePositionChange = (axis: 'left' | 'top', value: number) => {
    if (!selectedObject || !fabricCanvas) return;
    selectedObject.set(axis, value);
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

  const isShape = selectedObject?.type === 'rect' || selectedObject?.type === 'circle' || selectedObject?.type === 'path';
  const isText = selectedObject?.type === 'i-text';
  const isImage = selectedObject?.type === 'image';
  const isPath = selectedObject?.type === 'path';

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

  const currentRounding = (selectedObject as any)?._cornerRadius || 0;
  const isInsideShadow = (selectedObject as any)?._isInsideShadow || false;
  
  const currentShadow = selectedObject?.shadow as fabric.Shadow | undefined;
  const displayBlur = isInsideShadow ? (selectedObject?.strokeWidth || 0) : (currentShadow?.blur || 0);
  const displayColor = isInsideShadow 
    ? (typeof selectedObject?.stroke === 'string' ? selectedObject.stroke : '#000000') 
    : (currentShadow?.color?.toString() || '#000000');

  const objWidth = selectedObject ? Math.round(selectedObject.getScaledWidth()) : 0;
  const objHeight = selectedObject ? Math.round(selectedObject.getScaledHeight()) : 0;
  const objLeft = selectedObject ? Math.round(selectedObject.left) : 0;
  const objTop = selectedObject ? Math.round(selectedObject.top) : 0;

  // Determine opacity value based on object type
  let objOpacity = 100;
  if (selectedObject) {
    if (isImage) {
      objOpacity = Math.round(selectedObject.opacity * 100);
    } else if (isText || isShape) {
      const fill = selectedObject.fill;
      if (typeof fill === 'string' && fill !== 'transparent') {
        const color = new fabric.Color(fill);
        objOpacity = Math.round(color.getAlpha() * 100);
      }
    }
  }

  const canvasWidth = fabricCanvas ? fabricCanvas.width : 0;
  const canvasHeight = fabricCanvas ? fabricCanvas.height : 0;

  const currentStroke = selectedObject?.stroke || 'transparent';
  const currentStrokeWidth = selectedObject?.strokeWidth || 0;
  
  const currentTextBg = selectedObject?.backgroundColor;
  const hasTextBg = currentTextBg && currentTextBg !== 'transparent';

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
                Scene Layout
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Canvas W</label>
                      <input 
                        type="number"
                        value={canvasWidth}
                        onChange={(e) => setState(s => ({ ...s, customWidth: parseInt(e.target.value) || 1 }))}
                        className="w-full h-9 bg-slate-800 border border-slate-700 rounded-md px-3 text-[11px] font-mono text-slate-300 focus:border-indigo-500 transition-colors"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Canvas H</label>
                      <input 
                        type="number"
                        value={canvasHeight}
                        onChange={(e) => setState(s => ({ ...s, customHeight: parseInt(e.target.value) || 1 }))}
                        className="w-full h-9 bg-slate-800 border border-slate-700 rounded-md px-3 text-[11px] font-mono text-slate-300 focus:border-indigo-500 transition-colors"
                      />
                   </div>
                </div>

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
                <Maximize2 size={14} />
                {selectedObject.type === 'path' ? 'ARROW/LINE' : selectedObject.type?.toUpperCase()} Props
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Move size={12} />
                  Geometry & Transform
                </h4>
                <button 
                  onClick={() => setLockAspect(!lockAspect)}
                  className={`p-1 rounded transition-colors ${lockAspect ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400'}`}
                  title={lockAspect ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"}
                >
                  {lockAspect ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Width (px)</label>
                  <input 
                    type="number"
                    value={objWidth}
                    onChange={(e) => handleSizeChange('width', parseInt(e.target.value) || 1)}
                    className="w-full h-9 bg-slate-800 border border-slate-700 rounded-md px-3 text-[11px] font-mono text-indigo-400 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Height (px)</label>
                  <input 
                    type="number"
                    value={objHeight}
                    onChange={(e) => handleSizeChange('height', parseInt(e.target.value) || 1)}
                    className="w-full h-9 bg-slate-800 border border-slate-700 rounded-md px-3 text-[11px] font-mono text-indigo-400 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Position X</label>
                  <input 
                    type="number"
                    value={objLeft}
                    onChange={(e) => handlePositionChange('left', parseInt(e.target.value) || 0)}
                    className="w-full h-9 bg-slate-800 border border-slate-700 rounded-md px-3 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Position Y</label>
                  <input 
                    type="number"
                    value={objTop}
                    onChange={(e) => handlePositionChange('top', parseInt(e.target.value) || 0)}
                    className="w-full h-9 bg-slate-800 border border-slate-700 rounded-md px-3 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-800 pt-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Palette size={12} />
                Appearance & Fill
              </h4>
              <div className="space-y-4">
                {(isText || isShape) && !isPath && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Fill Color</label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-9 bg-slate-800 rounded-md flex items-center px-3 border border-slate-700">
                        <Palette size={14} className="text-slate-500 mr-2" />
                        <span className="text-[11px] text-slate-300 font-mono uppercase truncate">
                          {typeof selectedObject.fill === 'string' ? selectedObject.fill : 'Gradient/Other'}
                        </span>
                      </div>
                      <div className="w-9 h-9 rounded-md border border-slate-700 bg-slate-800 relative overflow-hidden shrink-0">
                        <input 
                          type="color" 
                          onChange={(e) => {
                             const hex = e.target.value;
                             const color = new fabric.Color(hex);
                             color.setAlpha(objOpacity / 100);
                             updateObjectProperty('fill', color.toRgba());
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          value={typeof selectedObject.fill === 'string' ? new fabric.Color(selectedObject.fill).toHex().substring(0, 7) : '#ffffff'}
                        />
                        <div className="w-full h-full" style={{ backgroundColor: typeof selectedObject.fill === 'string' ? selectedObject.fill : '#ffffff' }} />
                      </div>
                    </div>
                  </div>
                )}
                
                {isText && (
                   <div className="space-y-2 pt-2 border-t border-slate-800/50">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-slate-500 font-bold uppercase ml-1 flex items-center gap-1.5">
                           <Highlighter size={12} />
                           Text Background
                        </label>
                        <button
                          onClick={() => {
                             if (hasTextBg) {
                               updateObjectProperty('backgroundColor', '');
                             } else {
                               updateObjectProperty('backgroundColor', '#000000'); 
                             }
                          }}
                          className={`p-1 rounded transition-colors ${hasTextBg ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-600 hover:text-slate-400'}`}
                        >
                          {hasTextBg ? <Check size={14} /> : <Plus size={14} />}
                        </button>
                      </div>
                      
                      {hasTextBg && (
                        <div className="flex items-center gap-3 animate-in slide-in-from-top-1">
                           <div className="flex-1 h-9 bg-slate-800 rounded-md flex items-center px-3 border border-slate-700">
                              <div className="w-4 h-4 rounded-sm border border-slate-600 mr-2" style={{ backgroundColor: currentTextBg as string }} />
                              <span className="text-[11px] text-slate-300 font-mono uppercase truncate">
                                {currentTextBg as string}
                              </span>
                           </div>
                           <div className="w-9 h-9 rounded-md border border-slate-700 bg-slate-800 relative overflow-hidden shrink-0">
                              <input 
                                type="color" 
                                onChange={(e) => updateObjectProperty('backgroundColor', e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                value={new fabric.Color(currentTextBg as string).toHex().substring(0, 7)}
                              />
                              <div className="w-full h-full" style={{ backgroundColor: currentTextBg as string }} />
                           </div>
                        </div>
                      )}
                   </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold px-1">
                    <span className="flex items-center gap-1.5"><Ghost size={10} /> {isImage ? 'Global Opacity' : (isPath ? 'Stroke Opacity' : 'Fill Opacity')}</span>
                    <span className="font-mono text-indigo-400">{objOpacity}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" step="1" 
                    value={objOpacity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (isImage) {
                        updateObjectProperty('opacity', val / 100);
                      } else {
                        updateFillAlpha(val / 100);
                      }
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  {!isImage && (
                    <p className="text-[9px] text-slate-500 font-medium px-1">This transparency only applies to the background fill color, not the border.</p>
                  )}
                </div>

                {(isImage || (isShape && !isPath)) && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold px-1">
                      <span>Corner Rounding</span>
                      <span className="font-mono text-indigo-400">{currentRounding}px</span>
                    </div>
                    <input 
                      type="range" min="0" max="200" step="1" 
                      value={currentRounding}
                      onChange={(e) => updateRounding(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {isShape && (
              <div className="space-y-4 border-t border-slate-800 pt-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <SquareIcon size={12} />
                  Stroke & Outline
                </h4>
                <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-1.5">
                       <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Width</label>
                       <input 
                        type="number"
                        min="0"
                        value={isInsideShadow ? 0 : currentStrokeWidth}
                        disabled={isInsideShadow}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          (selectedObject as any)._originalStrokeWidth = val;
                          updateObjectProperty('strokeWidth', val);
                        }}
                        className={`w-full h-9 bg-slate-800 border border-slate-700 rounded-md px-3 text-[11px] font-mono text-slate-300 focus:border-indigo-500 transition-colors ${isInsideShadow ? 'opacity-50 grayscale' : ''}`}
                      />
                    </div>
                    <div className={`w-9 h-9 mt-4 rounded-md border border-slate-700 bg-slate-800 relative overflow-hidden shrink-0 ${isInsideShadow ? 'opacity-50 grayscale' : ''}`}>
                      <input 
                        type="color" 
                        disabled={isInsideShadow}
                        onChange={(e) => {
                          const val = e.target.value;
                          (selectedObject as any)._originalStroke = val;
                          updateObjectProperty('stroke', val);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        value={typeof currentStroke === 'string' ? new fabric.Color(currentStroke).toHex().substring(0, 7) : '#ffffff'}
                      />
                      <div className="w-full h-full" style={{ backgroundColor: typeof currentStroke === 'string' ? currentStroke : '#ffffff' }} />
                    </div>
                </div>
                {isInsideShadow && (
                  <p className="text-[9px] text-indigo-400/60 font-medium leading-tight">Stroke settings are disabled while Inside Glow is active as they share properties.</p>
                )}
              </div>
            )}

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
                      selectedObject.set({ 
                        shadow: null, 
                        stroke: (selectedObject as any)._originalStroke || 'transparent', 
                        strokeWidth: (selectedObject as any)._originalStrokeWidth || 0,
                        clipPath: null 
                      });
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
          <p className="font-bold text-indigo-300 mb-2 uppercase tracking-wide">Refined Transparency</p>
          <p>The Opacity slider now targets the <b>Fill Color</b> specifically for shapes and text, allowing your outlines to stay crisp and fully opaque.</p>
        </div>
      </div>
    </aside>
  );
};

export default SidebarRight;