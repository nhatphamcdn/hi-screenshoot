
import React, { useState, useRef, useEffect } from 'react';
import * as fabric from 'fabric';
import { 
  Plus, 
  Download, 
  Image as ImageIcon, 
  Type, 
  Square, 
  Circle as CircleIcon,
  Layout, 
  Settings2, 
  Palette,
  Monitor,
  Smartphone,
  Layers,
  Trash2,
  Copy,
  ChevronDown
} from 'lucide-react';
import SidebarRight from './components/SidebarRight';
import Toolbar from './components/Toolbar';
import { EditorState } from './types';

type DrawingTool = 'none' | 'rect' | 'circle';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool>('none');
  const [refresh, setRefresh] = useState(0); // State to force re-render of child components
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
    padding: 60,
    borderRadius: 16,
    shadowBlur: 30,
    shadowOpacity: 0.3,
    aspectRatio: 'Auto',
    showBrowserFrame: true,
  });

  const forceRefresh = () => setRefresh(prev => prev + 1);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f1f5f9',
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
          rx: 4,
          ry: 4,
        });
      } else if (tool === 'circle') {
        currentShape.current = new fabric.Circle({
          ...commonProps,
          radius: 0,
        });
      }

      if (currentShape.current) {
        canvas.add(currentShape.current);
        canvas.bringObjectToFront(currentShape.current);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const canvas = fabricCanvasRef.current;
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgObj = new Image();
      imgObj.src = event.target?.result as string;
      imgObj.onload = () => {
        const fabricImg = new fabric.FabricImage(imgObj);
        const scaleX = (canvas.width! - editorState.padding * 2) / fabricImg.width!;
        const scaleY = (canvas.height! - editorState.padding * 2) / fabricImg.height!;
        const scale = Math.min(scaleX, scaleY, 1);
        
        fabricImg.set({
          left: canvas.width! / 2,
          top: canvas.height! / 2,
          originX: 'center',
          originY: 'center',
          scaleX: scale,
          scaleY: scale,
          shadow: new fabric.Shadow({
            color: `rgba(0, 0, 0, ${editorState.shadowOpacity})`,
            blur: editorState.shadowBlur,
            offsetY: 10,
          })
        });

        canvas.add(fabricImg);
        canvas.sendObjectToBack(fabricImg);
        canvas.setActiveObject(fabricImg);
        canvas.renderAll();
        forceRefresh();
      };
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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
    const text = new fabric.IText('Double click to edit', {
      left: 100,
      top: 100,
      fontFamily: 'Inter',
      fontSize: 24,
      fill: '#ffffff',
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
      
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

      <div className="flex flex-1 overflow-hidden">
        {/* Removed SidebarLeft (Preset Templates) as requested */}
        
        <main className={`flex-1 flex flex-col items-center justify-center p-8 bg-slate-900 overflow-auto relative ${activeTool !== 'none' ? 'cursor-crosshair' : ''}`}>
          <div 
            id="canvas-wrapper" 
            className="shadow-2xl transition-all duration-300 relative group"
            style={{ 
              background: editorState.backgroundGradient || editorState.backgroundColor,
              padding: `${editorState.padding}px`,
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <canvas ref={canvasRef} className="rounded-sm" />
          </div>
          
          <div className="mt-8 px-4 py-2 bg-slate-800/50 backdrop-blur rounded-full text-xs text-slate-400 border border-slate-700">
            {activeTool !== 'none' ? `Drawing Mode: Click and drag to create a ${activeTool}` : 'Upload images, draw shapes, or add text to begin'}
          </div>
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
