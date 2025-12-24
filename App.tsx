import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as fabric from 'fabric';
import { 
  Download, 
  Image as ImageIcon, 
  Type, 
  Square, 
  Circle as CircleIcon,
  Trash2,
  Upload,
  ArrowRight
} from 'lucide-react';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import Toolbar from './components/Toolbar';
import { EditorState, Template } from './types';

type DrawingTool = 'none' | 'rect' | 'circle' | 'arrow';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool>('none');
  const [refresh, setRefresh] = useState(0); 
  const [hasImage, setHasImage] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeToolRef = useRef<DrawingTool>('none');
  
  useEffect(() => {
    activeToolRef.current = activeTool;
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      const isDrawingMode = activeTool !== 'none';
      canvas.selection = !isDrawingMode;
      canvas.defaultCursor = isDrawingMode ? 'crosshair' : 'default';
      
      canvas.getObjects().forEach((obj) => {
        obj.set({
          selectable: !isDrawingMode,
          evented: !isDrawingMode // Prevents objects from catching events (dragging) while drawing
        });
      });
      
      // If entering drawing mode, discard active selection to avoid confusion
      if (isDrawingMode) {
        canvas.discardActiveObject();
      }
      
      canvas.requestRenderAll();
    }
  }, [activeTool]);

  const isDrawing = useRef(false);
  const currentShape = useRef<fabric.FabricObject | null>(null);
  const startPoint = useRef<{ x: number, y: number } | null>(null);

  const [editorState, setEditorState] = useState<EditorState>({
    backgroundColor: '#6366f1',
    backgroundGradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    padding: 64, 
    borderRadius: 24,
    shadowBlur: 40,
    shadowOpacity: 0.4,
    aspectRatio: 'Auto',
    showBrowserFrame: true,
  });

  const forceRefresh = () => setRefresh(prev => prev + 1);

  // Sync fabric canvas size with editorState or auto-dimensions
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const targetW = editorState.customWidth || canvasDimensions.width || 400;
    const targetH = editorState.customHeight || canvasDimensions.height || 300;

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.setDimensions({ width: targetW, height: targetH });
      canvas.renderAll();
    }
  }, [editorState.customWidth, editorState.customHeight, canvasDimensions]);

  // Calculate the zoom scale to fit the wrapper (canvas + padding) into the viewport
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;

      const viewportWidth = containerRef.current.clientWidth - 100; 
      const viewportHeight = containerRef.current.clientHeight - 100;

      const effectiveW = editorState.customWidth || canvasDimensions.width;
      const effectiveH = editorState.customHeight || canvasDimensions.height;

      if (!effectiveW || !effectiveH) return;

      const totalWidth = effectiveW + (editorState.padding * 2);
      const totalHeight = effectiveH + (editorState.padding * 2);

      const scale = Math.min(viewportWidth / totalWidth, viewportHeight / totalHeight, 1);
      setZoomScale(scale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [canvasDimensions, editorState.padding, editorState.customWidth, editorState.customHeight, hasImage]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 400,
      height: 300,
      backgroundColor: 'transparent',
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;

    const updateSelection = (e: any) => {
      setSelectedObject((e.selected?.[0] as fabric.FabricObject) || null);
    };

    canvas.on('selection:created', updateSelection);
    canvas.on('selection:updated', updateSelection);
    canvas.on('selection:cleared', () => setSelectedObject(null));
    canvas.on('object:modified', forceRefresh);
    canvas.on('object:scaling', forceRefresh);
    canvas.on('object:moving', forceRefresh);
    canvas.on('object:rotating', forceRefresh);

    canvas.on('mouse:down', (o) => {
      const tool = activeToolRef.current;
      if (tool === 'none') return;
      
      isDrawing.current = true;
      const pointer = canvas.getPointer(o.e);
      startPoint.current = { x: pointer.x, y: pointer.y };

      const commonProps = {
        left: pointer.x,
        top: pointer.y,
        fill: '#6366f1',
        stroke: '#4f46e5',
        strokeWidth: 2,
        strokeUniform: true,
        selectable: false,
        evented: false, // Ensure the shape being drawn doesn't capture events itself immediately
      };

      if (tool === 'rect') {
        currentShape.current = new fabric.Rect({
          ...commonProps,
          width: 0,
          height: 0,
          rx: 8,
          ry: 8,
        });
      } else if (tool === 'circle') {
        currentShape.current = new fabric.Circle({
          ...commonProps,
          radius: 0,
        });
      } else if (tool === 'arrow') {
        currentShape.current = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          ...commonProps,
          fill: 'transparent',
          strokeWidth: 4,
          stroke: '#6366f1'
        });
      }

      if (currentShape.current) {
        // Tag original stroke for shadow management
        (currentShape.current as any)._originalStroke = commonProps.stroke;
        (currentShape.current as any)._originalStrokeWidth = commonProps.strokeWidth;
        canvas.add(currentShape.current);
      }
    });

    canvas.on('mouse:move', (o) => {
      if (!isDrawing.current || !currentShape.current || !startPoint.current) return;
      const tool = activeToolRef.current;
      const pointer = canvas.getPointer(o.e);

      if (tool === 'rect' && currentShape.current instanceof fabric.Rect) {
        const width = Math.abs(startPoint.current.x - pointer.x);
        const height = Math.abs(startPoint.current.y - pointer.y);
        currentShape.current.set({
          width,
          height,
          left: Math.min(pointer.x, startPoint.current.x),
          top: Math.min(pointer.y, startPoint.current.y),
        });
      } else if (tool === 'circle' && currentShape.current instanceof fabric.Circle) {
        const radius = Math.sqrt(
          Math.pow(startPoint.current.x - pointer.x, 2) + 
          Math.pow(startPoint.current.y - pointer.y, 2)
        ) / 2;
        currentShape.current.set({
          radius,
          left: Math.min(pointer.x, startPoint.current.x),
          top: Math.min(pointer.y, startPoint.current.y),
        });
      } else if (tool === 'arrow' && currentShape.current instanceof fabric.Line) {
        currentShape.current.set({
          x2: pointer.x,
          y2: pointer.y
        });
      }
      canvas.renderAll();
    });

    canvas.on('mouse:up', () => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      
      const tool = activeToolRef.current;
      if (tool === 'arrow' && currentShape.current instanceof fabric.Line) {
        const line = currentShape.current;
        const x1 = line.x1!;
        const y1 = line.y1!;
        const x2 = line.x2!;
        const y2 = line.y2!;
        
        // Remove the temporary line
        canvas.remove(line);

        // Check if line is too small, if so, ignore
        const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        if (dist < 5) {
             forceRefresh();
             currentShape.current = null;
             setActiveTool('none');
             return;
        }

        // Calculate arrow path
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLength = 20;
        const xLeft = x2 - headLength * Math.cos(angle - Math.PI / 6);
        const yLeft = y2 - headLength * Math.sin(angle - Math.PI / 6);
        const xRight = x2 - headLength * Math.cos(angle + Math.PI / 6);
        const yRight = y2 - headLength * Math.sin(angle + Math.PI / 6);

        const pathData = `M ${x1} ${y1} L ${x2} ${y2} M ${x2} ${y2} L ${xLeft} ${yLeft} M ${x2} ${y2} L ${xRight} ${yRight}`;

        const arrow = new fabric.Path(pathData, {
          stroke: '#6366f1',
          strokeWidth: 4,
          fill: 'transparent',
          strokeCap: 'round',
          strokeJoin: 'round',
          selectable: true,
          strokeUniform: true
        });

        // Store original stroke props for Sidebar logic
        (arrow as any)._originalStroke = '#6366f1';
        (arrow as any)._originalStrokeWidth = 4;
        
        // Tag as arrow for sidebar editing
        (arrow as any).customType = 'arrow';
        (arrow as any).arrowStyle = 'end';

        canvas.add(arrow);
        canvas.setActiveObject(arrow);
        currentShape.current = arrow;
      } else if (currentShape.current) {
        // For Rect and Circle
        currentShape.current.set({ selectable: true, evented: true });
        canvas.setActiveObject(currentShape.current);
      }
      
      forceRefresh();
      currentShape.current = null;
      setActiveTool('none');
    });

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const canvas = fabricCanvasRef.current;
    if (!files || files.length === 0 || !canvas) return;

    (Array.from(files) as File[]).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result !== 'string') return;
        
        const imgObj = new Image();
        imgObj.onload = () => {
          const fabricImg = new fabric.FabricImage(imgObj);
          
          let scale = 1;

          if (!hasImage && index === 0 && !editorState.customWidth) {
            const maxW = 1000; 
            const maxH = 800;
            scale = Math.min(maxW / fabricImg.width!, maxH / fabricImg.height!, 1);
            const finalWidth = fabricImg.width! * scale;
            const finalHeight = fabricImg.height! * scale;

            // Remove fixed buffer so canvas fits image exactly
            const canvasW = finalWidth;
            const canvasH = finalHeight;

            canvas.setDimensions({ width: canvasW, height: canvasH });
            setCanvasDimensions({ width: canvasW, height: canvasH });
            
            fabricImg.set({
              left: 0,
              top: 0,
              scaleX: scale,
              scaleY: scale,
            });
            setHasImage(true);
          } else {
            const canvasW = canvas.width;
            const canvasH = canvas.height;
            const targetW = canvasW * 0.6;
            const targetH = canvasH * 0.6;
            
            scale = Math.min(targetW / fabricImg.width!, targetH / fabricImg.height!, 1);
            
            const offset = (index + 1) * 30;
            fabricImg.set({
              left: (canvasW - (fabricImg.width! * scale)) / 2 + offset,
              top: (canvasH - (fabricImg.height! * scale)) / 2 + offset,
              scaleX: scale,
              scaleY: scale,
            });
            setHasImage(true);
          }

          fabricImg.set({
            selectable: true,
            evented: true, // Ensure uploaded images are interactive by default
            shadow: new fabric.Shadow({
              color: `rgba(0, 0, 0, ${editorState.shadowOpacity})`,
              blur: editorState.shadowBlur,
              offsetY: 10,
            })
          });

          canvas.add(fabricImg);
          canvas.setActiveObject(fabricImg);
          canvas.renderAll();
          forceRefresh();
        };
        imgObj.src = result;
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleApplyTemplate = (template: Template) => {
    setEditorState(prev => ({
      ...prev,
      ...template.config
    }));
  };

  const handleExport = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    const link = document.createElement('a');
    link.download = 'snapstyle-export.png';
    link.href = dataURL;
    link.click();
  };

  const addText = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const text = new fabric.IText('New Caption', {
      left: canvas.width / 2 - 100,
      top: 100,
      fontFamily: 'Inter',
      fontSize: 42,
      fill: '#000000',
      fontWeight: 'bold',
      textAlign: 'center'
    });
    canvas.add(text);
    canvas.bringObjectToFront(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    forceRefresh();
  };

  const deleteSelected = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !selectedObject) return;
    canvas.remove(selectedObject);
    canvas.discardActiveObject();
    canvas.renderAll();
    forceRefresh();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden">
      <Toolbar 
        onUpload={() => fileInputRef.current?.click()}
        onAddText={addText}
        activeTool={activeTool}
        onSetTool={(tool) => setActiveTool(prev => prev === tool ? 'none' : tool)}
        onExport={handleExport}
        onDelete={deleteSelected}
        hasSelection={!!selectedObject}
      />
      
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        multiple 
        onChange={handleFileUpload} 
      />

      <div className="flex flex-1 overflow-hidden">
        <SidebarLeft onApplyTemplate={handleApplyTemplate} />

        <main ref={containerRef} className="flex-1 flex flex-col items-center justify-center bg-slate-900 overflow-hidden relative">
          
          <div 
            id="canvas-wrapper" 
            className={`transition-all duration-300 ease-out relative ${!hasImage ? 'hidden' : 'block'}`}
            style={{ 
              background: editorState.backgroundGradient || editorState.backgroundColor,
              padding: `${editorState.padding}px`,
              borderRadius: `${editorState.borderRadius}px`,
              boxShadow: '0 30px 60px -12px rgba(0,0,0,0.6)',
              transform: `scale(${zoomScale})`,
              transformOrigin: 'center center'
            }}
          >
            {/* The actual Fabric canvas */}
            <canvas ref={canvasRef} />
          </div>

          {!hasImage && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-lg aspect-video rounded-3xl border-2 border-dashed border-slate-700 bg-slate-800/40 hover:bg-slate-800/60 hover:border-indigo-500 transition-all cursor-pointer flex flex-col items-center justify-center gap-5 group"
            >
              <div className="w-20 h-20 rounded-2xl bg-slate-700/50 group-hover:bg-indigo-600/20 flex items-center justify-center transition-all group-hover:scale-110">
                <Upload size={36} className="text-slate-400 group-hover:text-indigo-400" />
              </div>
              <div className="text-center px-6">
                <p className="text-xl font-bold text-slate-200">Snap a Screenshot Here</p>
                <p className="text-sm text-slate-500 mt-2">Upload one or more images to start creating professional layouts</p>
              </div>
            </div>
          )}
          
          {hasImage && (
            <div className="absolute bottom-8 px-6 py-3 bg-slate-950/80 backdrop-blur-2xl rounded-2xl text-[11px] text-slate-400 border border-slate-800 shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-slate-200 uppercase tracking-tighter">Multi-Object Canvas Active</span>
              </div>
              <div className="w-px h-4 bg-slate-800" />
              <span>Composition mode enabled</span>
            </div>
          )}
        </main>

        <SidebarRight 
          state={editorState} 
          setState={setEditorState} 
          selectedObject={selectedObject}
          fabricCanvas={fabricCanvasRef.current}
          onObjectChange={forceRefresh}
          refresh={refresh}
        />
      </div>
    </div>
  );
};

export default App;