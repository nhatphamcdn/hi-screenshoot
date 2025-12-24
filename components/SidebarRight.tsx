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
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Italic,
  Underline,
  ArrowRight,
  ArrowLeft,
  MoveHorizontal,
  Minus,
  Ban
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

  const updateArrowStyle = (style: 'start' | 'end' | 'both' | 'none') => {
    if (!fabricCanvas || !selectedObject || selectedObject.type !== 'path') return;
    const obj = selectedObject as fabric.Path;
    
    // Safety check: Is this one of our arrows?
    if ((obj as any).customType !== 'arrow') return;

    const path = obj.path;
    // Assuming simple structure where first M is start and first L is end of the SHAFT
    if (!path || path.length < 2) return;
    
    // Note: path coordinates are relative to the bounding box/pathOffset
    // We will extract them, reconstruct the path string, and create a new object.
    const start = path[0]; 
    const end = path[1];

    if (start[0] !== 'M' || end[0] !== 'L') return;

    const x1 = start[1];
    const y1 = start[2];
    const x2 = end[1];
    const y2 = end[2];

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLength = 20;

    let newPathData = `M ${x1} ${y1} L ${x2} ${y2}`;

    if (style === 'end' || style === 'both') {
         const xLeft = x2 - headLength * Math.cos(angle - Math.PI / 6);
         const yLeft = y2 - headLength * Math.sin(angle - Math.PI / 6);
         const xRight = x2 - headLength * Math.cos(angle + Math.PI / 6);
         const yRight = y2 - headLength * Math.sin(angle + Math.PI / 6);
         newPathData += ` M ${x2} ${y2} L ${xLeft} ${yLeft} M ${x2} ${y2} L ${xRight} ${yRight}`;
    }

    if (style === 'start' || style === 'both') {
         const xLeft = x1 + headLength * Math.cos(angle - Math.PI / 6);
         const yLeft = y1 + headLength * Math.sin(angle - Math.PI / 6);
         const xRight = x1 + headLength * Math.cos(angle + Math.PI / 6);
         const yRight = y1 + headLength * Math.sin(angle + Math.PI / 6);
         newPathData += ` M ${x1} ${y1} L ${xLeft} ${yLeft} M ${x1} ${y1} L ${xRight} ${yRight}`;
    }

    // Capture old center to preserve position
    const oldCenter = obj.getCenterPoint();

    // Create new object
    const newPath = new fabric.Path(newPathData, {
       left: obj.left,
       top: obj.top,
       stroke: obj.stroke,
       strokeWidth: obj.strokeWidth,
       fill: obj.fill,
       strokeLineCap: obj.strokeLineCap,
       strokeLineJoin: obj.strokeLineJoin,
       strokeUniform: obj.strokeUniform,
       scaleX: obj.scaleX,
       scaleY: obj.scaleY,
       rotation: obj.rotation,
       opacity: obj.opacity,
       shadow: obj.shadow,
       // Maintain metadata
       customType: 'arrow',
       arrowStyle: style
    } as any);

    // Reposition to match center
    // Because adding arrowheads changes dimensions, we align by center to avoid big jumps.
    newPath.set({ originX: 'center', originY: 'center' });
    newPath.setPositionByOrigin(oldCenter, 'center', 'center');
    newPath.set({ originX: 'left', originY: 'top' }); // Reset to default origin if needed

    fabricCanvas.remove(obj);
    fabricCanvas.add(newPath);
    fabricCanvas.setActiveObject(newPath);
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
  const isArrow = (selectedObject as any)?.customType === 'arrow';

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
              <div className="grid grid-cols-4 gap-2">
                <button
                    onClick={() => setState(s => ({ ...s, backgroundColor: 'transparent', backgroundGradient: '' }))}
                    className={`h-10 rounded-md border border-slate-700 hover:scale-105 transition-transform flex items-center justify-center ${state.backgroundColor === 'transparent' ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900' : ''}`}
                    title="Transparent Background"
                    style={{ 
                         backgroundImage: `linear-gradient(45deg, #334155 25%, transparent 25%), linear-gradient(-45deg, #334155 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #334155 75%), linear-gradient(-45deg, transparent 75%, #334155 75%)`,
                         backgroundSize: '8px 8px',
                         backgroundColor: '#0f172a'
                    }}
                >
                    <Ban size={14} className="text-slate-400" />
                </button>
                <button
                    onClick={() => setState(s => ({ ...s, backgroundColor: '#ffffff', backgroundGradient: '' }))}
                    className="h-10 rounded-md border border-slate-700 bg-white hover:scale-105 transition-transform"
                    title="White Background"
                />
                <button
                    onClick={() => setState(s => ({ ...s, backgroundColor: '#000000', backgroundGradient: '' }))}
                    className="h-10 rounded-md border border-slate-700 bg-black hover:scale-105 transition-transform"
                    title="Black Background"
                />
                
                <div className="h-10 rounded-md border border-slate-700 bg-slate-800 flex items-center justify-center relative overflow-hidden">
                  <input 
                    type="color" 
                    value={state.backgroundColor === 'transparent' ? '#ffffff' : state.backgroundColor}
                    onChange={(e) => setState(s => ({ ...s, backgroundColor: e.target.value, backgroundGradient: '' }))}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                  />
                  <span className="text-[10px] text-slate-500 font-bold uppercase pointer-events-none">Color</span>
                </div>
              </div>
              
              <div className="grid grid-cols-6 gap-2 pt-2">
                  {GRADIENTS.map((grad, i) => (
                      <button
                        key={i}
                        onClick={() => setState(s => ({ ...s, backgroundGradient: grad }))}
                        className="h-8 rounded-md border border-slate-700 hover:scale-105 transition-transform"
                        style={{ background: grad }}
                      />
                  ))}
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
            
            {isArrow && (
              <div className="space-y-4 border-t border-slate-800 pt-4">
                 <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <ArrowRight size={12} />
                   Arrow Style
                 </h4>
                 <div className="flex bg-slate-800 rounded-md border border-slate-700 h-9 p-1">
                      {[
                        { id: 'none', icon: Minus, label: 'Line' },
                        { id: 'start', icon: ArrowLeft, label: 'Start' },
                        { id: 'end', icon: ArrowRight, label: 'End' },
                        { id: 'both', icon: MoveHorizontal, label: 'Both' }
                      ].map((style) => (
                          <button
                              key={style.id}
                              onClick={() => updateArrowStyle(style.id as any)}
                              className={`flex-1 rounded flex items-center justify-center transition-all ${
                                  (selectedObject as any).arrowStyle === style.id 
                                  ? 'bg-indigo-600 text-white shadow-sm' 
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                              title={style.label}
                          >
                              <style.icon size={14} />
                          </button>
                      ))}
                  </div>
              </div>
            )}

            {isText && (
              <section className="space-y-4 border-t border-slate-800 pt-4">
                 <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Type size={12} />
                      Typography
                    </h4>
                 </div>

                 <div className="space-y-4">
                    {/* Font Family */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Font Family</label>
                        <div className="relative">
                          <select
                              value={(selectedObject as any).fontFamily}
                              onChange={(e) => updateObjectProperty('fontFamily', e.target.value)}
                              className="w-full h-9 bg-slate-800 border border-slate-700 rounded-md px-3 text-[11px] text-slate-300 focus:border-indigo-500 outline-none appearance-none cursor-pointer"
                          >
                              <option value="Inter">Inter</option>
                              <option value="Arial">Arial</option>
                              <option value="Helvetica">Helvetica</option>
                              <option value="Times New Roman">Times New Roman</option>
                              <option value="Courier New">Courier New</option>
                              <option value="Georgia">Georgia</option>
                              <option value="Verdana">Verdana</option>
                          </select>
                          <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 rotate-90 pointer-events-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                         {/* Font Size */}
                         <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Size</label>
                              <input 
                                type="number"
                                value={(selectedObject as any).fontSize}
                                onChange={(e) => updateObjectProperty('fontSize', parseInt(e.target.value))}
                                className="w-full h-9 bg-slate-800 border border-slate-700 rounded-md px-3 text-[11px] font-mono text-indigo-400 focus:outline-none focus:border-indigo-500 transition-colors"
                              />
                        </div>
                        
                        {/* Font Weight */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Weight</label>
                            <div className="relative">
                              <select
                                  value={(selectedObject as any).fontWeight}
                                  onChange={(e) => updateObjectProperty('fontWeight', e.target.value)}
                                  className="w-full h-9 bg-slate-800 border border-slate-700 rounded-md px-3 text-[11px] text-slate-300 focus:border-indigo-500 outline-none appearance-none cursor-pointer"
                              >
                                  <option value="normal">Normal</option>
                                  <option value="bold">Bold</option>
                                  <option value="300">Light</option>
                                  <option value="600">Semi Bold</option>
                                  <option value="800">Extra Bold</option>
                              </select>
                              <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 rotate-90 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                         {/* Line Height */}
                        <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Line Height</label>
                              <input 
                                type="number"
                                step="0.1"
                                min="0.5"
                                max="3"
                                value={(selectedObject as any).lineHeight}
                                onChange={(e) => updateObjectProperty('lineHeight', parseFloat(e.target.value))}
                                className="w-full h-9 bg-slate-800 border border-slate-700 rounded-md px-3 text-[11px] font-mono text-indigo-400 focus:outline-none focus:border-indigo-500 transition-colors"
                              />
                        </div>
                         {/* Alignment */}
                         <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Align</label>
                            <div className="flex bg-slate-800 rounded-md border border-slate-700 h-9 p-1">
                                {['left', 'center', 'right'].map((align) => (
                                    <button
                                        key={align}
                                        onClick={() => updateObjectProperty('textAlign', align)}
                                        className={`flex-1 rounded flex items-center justify-center transition-all ${
                                            (selectedObject as any).textAlign === align 
                                            ? 'bg-indigo-600 text-white shadow-sm' 
                                            : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        {align === 'left' && <AlignLeft size={14} />}
                                        {align === 'center' && <AlignCenter size={14} />}
                                        {align === 'right' && <AlignRight size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Style & Decoration */}
                    <div className="flex gap-2 pt-1">
                         <button
                            onClick={() => updateObjectProperty('fontStyle', (selectedObject as any).fontStyle === 'italic' ? 'normal' : 'italic')}
                            className={`flex-1 h-9 rounded-md border flex items-center justify-center text-[10px] font-bold transition-all uppercase tracking-wide ${(selectedObject as any).fontStyle === 'italic' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}`}
                         >
                            <Italic size={14} className="mr-2"/> Italic
                         </button>
                          <button
                            onClick={() => updateObjectProperty('underline', !(selectedObject as any).underline)}
                            className={`flex-1 h-9 rounded-md border flex items-center justify-center text-[10px] font-bold transition-all uppercase tracking-wide ${(selectedObject as any).underline ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}`}
                         >
                            <Underline size={14} className="mr-2"/> Underline
                         </button>
                    </div>
                 </div>
              </section>
            )}

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