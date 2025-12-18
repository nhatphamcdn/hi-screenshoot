
import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as fabric from 'fabric';
import { 
  Download, 
  Image as ImageIcon, 
  Type, 
  Square, 
  Circle as CircleIcon,
  Trash2,
  Upload
} from 'lucide-react';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import Toolbar from './components/Toolbar';
import { EditorState, Template } from './types';

type DrawingTool = 'none' | 'rect' | 'circle';

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

  // Calculate the zoom scale to fit the wrapper (canvas + padding) into the viewport
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current || canvasDimensions.width === 0) return;

      const viewportWidth = containerRef.current.clientWidth - 100; 
      const viewportHeight = containerRef.current.clientHeight - 100;

      const totalWidth = canvasDimensions.width + (editorState.padding * 2);
      const totalHeight = canvasDimensions.height + (editorState.padding * 2);

      const scale = Math.min(viewportWidth / totalWidth, viewportHeight / totalHeight, 1);
      setZoomScale(scale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [canvasDimensions, editorState.padding, hasImage]);

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

    canvas.on('mouse:down', (o) => {
      const tool = activeToolRef.current;
      if (tool === 'none') return;
      
      isDrawing.current = true;
      const pointer = canvas.getPointer(o.e);
      startPoint.current = { x: pointer.x, y: pointer.y };

      const commonProps = {
        left: pointer.x,
        top: pointer.y,
        fill: 'transparent',
        stroke: '#6366f1',
        strokeWidth: 3,
        selectable: false,
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
      }

      if (currentShape.current) {
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
      }
      canvas.renderAll();
    });

    canvas.on('mouse:up', () => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      if (currentShape.current) {
        currentShape.current.set({ selectable: true });
        canvas.setActiveObject(currentShape.current);
        forceRefresh();
      }
      currentShape.current = null;
      setActiveTool('none');
    });

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // Fixed handleFileUpload by explicitly casting files to File[] to avoid 'unknown' type errors when passed to reader.readAsDataURL
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
        // Fixed image loading by setting the onload handler before setting the src attribute
        imgObj.onload = () => {
          const fabricImg = new fabric.FabricImage(imgObj);
          
          let scale = 1;
          const buffer = 200;

          // If this is the very first image being added, set the canvas dimensions
          if (!hasImage && index === 0) {
            const maxW = 1000; 
            const maxH = 800;
            scale = Math.min(maxW / fabricImg.width!, maxH / fabricImg.height!, 1);
            const finalWidth = fabricImg.width! * scale;
            const finalHeight = fabricImg.height! * scale;

            const canvasW = finalWidth + buffer;
            const canvasH = finalHeight + buffer;

            canvas.setDimensions({ width: canvasW, height: canvasH });
            setCanvasDimensions({ width: canvasW, height: canvasH });
            
            fabricImg.set({
              left: buffer / 2,
              top: buffer / 2,
              scaleX: scale,
              scaleY: scale,
            });
            setHasImage(true);
          } else {
            // For subsequent images, scale them to fit within the existing canvas but keep them manageable
            const canvasW = canvas.width;
            const canvasH = canvas.height;
            const targetW = canvasW * 0.6;
            const targetH = canvasH * 0.6;
            
            scale = Math.min(targetW / fabricImg.width!, targetH / fabricImg.height!, 1);
            
            // Offset subsequent images so they don't perfectly overlap
            const offset = (index + 1) * 30;
            fabricImg.set({
              left: (canvasW - (fabricImg.width! * scale)) / 2 + offset,
              top: (canvasH - (fabricImg.height! * scale)) / 2 + offset,
              scaleX: scale,
              scaleY: scale,
            });
          }

          fabricImg.set({
            selectable: true,
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
      fill: '#ffffff',
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
