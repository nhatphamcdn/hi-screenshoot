import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as fabric from 'fabric';
import { GoogleGenAI } from "@google/genai";
import { 
  Download, 
  Image as ImageIcon, 
  Type, 
  Square, 
  Circle as CircleIcon,
  Trash2,
  Upload,
  ArrowRight,
  Sparkles,
  Loader2,
  GripHorizontal,
  GripVertical
} from 'lucide-react';
// SidebarLeft removed
import SidebarRight from './components/SidebarRight';
import Toolbar from './components/Toolbar';
import { EditorState, Template } from './types';

type DrawingTool = 'none' | 'rect' | 'circle' | 'arrow';

const INITIAL_EDITOR_STATE: EditorState = {
  backgroundColor: '#ffffff',
  backgroundGradient: '',
  padding: 64, 
  borderRadius: 24,
  shadowBlur: 40,
  shadowOpacity: 0.4,
  aspectRatio: 'Auto',
  showBrowserFrame: true,
};

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTransparentBg, setAiTransparentBg] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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

  const [editorState, setEditorState] = useState<EditorState>(INITIAL_EDITOR_STATE);

  const forceRefresh = () => setRefresh(prev => prev + 1);

  const handleReset = () => {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      canvas.clear();
      canvas.backgroundColor = 'transparent';
      canvas.setDimensions({ width: 400, height: 300 }); // Reset to default small size
    }

    setHasImage(false);
    setSelectedObject(null);
    setActiveTool('none');
    setAiTransparentBg(false);
    setCanvasDimensions({ width: 0, height: 0 });
    setEditorState(INITIAL_EDITOR_STATE);
    setZoomScale(1);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setRefresh(prev => prev + 1);
  };

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
        fill: '#a21621',
        stroke: '#82111a',
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
          stroke: '#a21621'
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
          stroke: '#a21621',
          strokeWidth: 4,
          fill: 'transparent',
          strokeCap: 'round',
          strokeJoin: 'round',
          selectable: true,
          strokeUniform: true
        });

        // Store original stroke props for Sidebar logic
        (arrow as any)._originalStroke = '#a21621';
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

  const addImageObjectToCanvas = (imgObj: HTMLImageElement, isInitial: boolean) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const fabricImg = new fabric.FabricImage(imgObj);
    
    let scale = 1;

    if (isInitial && !editorState.customWidth) {
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
      
      fabricImg.set({
        left: (canvasW - (fabricImg.width! * scale)) / 2,
        top: (canvasH - (fabricImg.height! * scale)) / 2,
        scaleX: scale,
        scaleY: scale,
      });
      setHasImage(true);
    }

    fabricImg.set({
      selectable: true,
      evented: true, 
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

  const processFiles = (files: FileList) => {
    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith('image/')) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result !== 'string') return;
        
        const imgObj = new Image();
        imgObj.onload = () => {
          // Check if this is the very first image being added to a blank canvas
          const isInitial = !hasImage && index === 0;
          addImageObjectToCanvas(imgObj, isInitial);
        };
        imgObj.src = result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFiles(files);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're actually leaving the container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const handleGenerateImage = async () => {
    // START LOADING IMMEDIATELY
    setIsGenerating(true);

    // Give React a moment to render the loader before potential heavy work
    await new Promise(resolve => setTimeout(resolve, 50));

    // STRICT instruction to avoid checkerboards
    // We demand a flat color so we can key it out.
    const backgroundInstruction = aiTransparentBg 
      ? "Replace the background with a uniform, solid MAGENTA color (Hex #FF00FF). Ensure the background is one single flat color with no gradients, no shadows, and no patterns. Do not generate a checkerboard."
      : "Replace the background with pure white (#FFFFFF). No shadows added to the background.";

    // Refined prompt to preserve object identity while strictly removing background/border and ensuring high quality
    const promptText = `Edit the provided reference image. Keep the main foreground object exactly the same in shape, color, texture, and position. Remove the rounded border/frame completely. ${backgroundInstruction} Ultra-high-resolution 8K output, sharp focus, photorealistic. No changes to product design, no additional objects.`;

    // Logic to find an image even if not currently selected
    let targetImage = selectedObject;
    
    // If no object selected, or selected object is not an image, try to find one on canvas
    if (!targetImage || targetImage.type !== 'image') {
        const canvas = fabricCanvasRef.current;
        if (canvas) {
            const images = canvas.getObjects().filter(obj => obj.type === 'image');
            if (images.length > 0) {
                targetImage = images[images.length - 1]; // Use the top-most image
            }
        }
    }

    const isEditing = targetImage && targetImage.type === 'image';
    
    try {
       const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
       
       const parts: any[] = [];

       if (isEditing && targetImage) {
           // For Image-to-Image editing
           // We extract the base64 from the image object
           const dataUrl = targetImage.toDataURL({ format: 'png' });
           const base64Data = dataUrl.split(',')[1];
           
           parts.push({
               inlineData: {
                   data: base64Data,
                   mimeType: 'image/png'
               }
           });
       }

       parts.push({ text: promptText });

       const response = await ai.models.generateContent({
           model: 'gemini-2.5-flash-image',
           contents: {
               parts: parts
           },
           config: {
               imageConfig: {
                   aspectRatio: '1:1'
               }
           }
       });

       // Extract the image from the response parts
       let foundImage = false;
       if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
         for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64Str = part.inlineData.data;
                const imgSrc = `data:image/png;base64,${base64Str}`;
                
                const imgObj = new Image();
                imgObj.onload = () => {
                   const cleanupOldImage = () => {
                      if (targetImage && fabricCanvasRef.current) {
                          fabricCanvasRef.current.remove(targetImage);
                          if (selectedObject === targetImage) {
                            setSelectedObject(null);
                            fabricCanvasRef.current.discardActiveObject();
                          }
                          fabricCanvasRef.current.requestRenderAll();
                      }
                   };

                   if (aiTransparentBg) {
                       // Client-side Chroma Key Removal
                       const tempCanvas = document.createElement('canvas');
                       tempCanvas.width = imgObj.width;
                       tempCanvas.height = imgObj.height;
                       const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
                       
                       if (ctx) {
                           ctx.drawImage(imgObj, 0, 0);
                           const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                           const data = imageData.data;
                           
                           // Auto-detect the background color from the top-left pixel.
                           // This creates a dynamic key based on what the AI actually generated.
                           const keyR = data[0];
                           const keyG = data[1];
                           const keyB = data[2];

                           // Define thresholds for hard removal and soft blending
                           // Adjusted to prevent eating into the subject but removing artifacts
                           const hardThreshold = 35; // Pixels closer than this are fully removed
                           const softThreshold = 75; // Pixels between hard and soft are blended
                           
                           for (let i = 0; i < data.length; i += 4) {
                               const r = data[i];
                               const g = data[i + 1];
                               const b = data[i + 2];
                               
                               // Calculate Euclidean distance from the key color
                               const distance = Math.sqrt(
                                   Math.pow(r - keyR, 2) + 
                                   Math.pow(g - keyG, 2) + 
                                   Math.pow(b - keyB, 2)
                               );

                               if (distance < hardThreshold) {
                                   data[i + 3] = 0; // Fully transparent
                               } else if (distance < softThreshold) {
                                   // Linear ramp for simple anti-aliasing
                                   // distance = hard -> alpha = 0
                                   // distance = soft -> alpha = 255
                                   const alpha = ((distance - hardThreshold) / (softThreshold - hardThreshold)) * 255;
                                   data[i + 3] = alpha;
                               }
                           }
                           
                           ctx.putImageData(imageData, 0, 0);
                           
                           const processedImg = new Image();
                           processedImg.onload = () => {
                               addImageObjectToCanvas(processedImg, !hasImage);
                               cleanupOldImage();
                           };
                           processedImg.src = tempCanvas.toDataURL();
                       } else {
                           // Fallback if canvas context fails
                           addImageObjectToCanvas(imgObj, !hasImage);
                           cleanupOldImage();
                       }
                   } else {
                       // Standard flow
                       addImageObjectToCanvas(imgObj, !hasImage);
                       cleanupOldImage();
                   }
                };
                imgObj.src = imgSrc;
                foundImage = true;
                break;
            }
         }
       }

       if (!foundImage) {
         console.warn("API Response did not contain inlineData image.");
         alert("No image generated. Please try again.");
       }

    } catch (e: any) {
        console.error("AI Generation Error:", e);
        
        const errorMessage = e.message || JSON.stringify(e);
        // Handle potential permission errors if environment key is invalid
        const isPermissionDenied = 
            e.status === 403 || 
            errorMessage.includes('403') || 
            errorMessage.includes('PERMISSION_DENIED');
        
        if (isPermissionDenied && (window as any).aistudio) {
             await (window as any).aistudio.openSelectKey(); 
             alert("Please select a valid paid project API key and try again.");
        } else {
             alert("Image generation failed. " + errorMessage);
        }
    } finally {
        setIsGenerating(false);
    }
  };

  const handleExport = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // 1. Setup high-res multiplier
    const multiplier = 4; // 4x for high quality
    
    // 2. Get the content as a canvas element (preserves transparency)
    const contentCanvas = canvas.toCanvasElement(multiplier);

    // 3. Define dimensions
    const padding = editorState.padding;
    const radius = editorState.borderRadius;
    const innerWidth = canvas.width || 0;
    const innerHeight = canvas.height || 0;
    const totalWidth = innerWidth + (padding * 2);
    const totalHeight = innerHeight + (padding * 2);
    
    // 4. Create Export Canvas
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = totalWidth * multiplier;
    exportCanvas.height = totalHeight * multiplier;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // 5. Scale context to match logical coordinate system
    ctx.scale(multiplier, multiplier);
    
    // 6. Draw Background (Rounded Rect)
    // Only draw background if it is NOT transparent
    if (editorState.backgroundColor !== 'transparent') {
        const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + w - r, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + r);
          ctx.lineTo(x + w, y + h - r);
          ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          ctx.lineTo(x + r, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.closePath();
        };

        drawRoundedRect(0, 0, totalWidth, totalHeight, radius);
        ctx.clip(); // Ensure sharp clipping at borders

        // Fill Background
        if (editorState.backgroundGradient) {
          const gradMatch = editorState.backgroundGradient.match(/linear-gradient\((\d+)deg,\s*(#[a-fA-F0-9]+)\s*0%,\s*(#[a-fA-F0-9]+)\s*100%\)/i);
          if (gradMatch) {
             const gradient = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
             gradient.addColorStop(0, gradMatch[2]);
             gradient.addColorStop(1, gradMatch[3]);
             ctx.fillStyle = gradient;
          } else {
             ctx.fillStyle = editorState.backgroundColor;
          }
        } else {
          ctx.fillStyle = editorState.backgroundColor;
        }
        ctx.fill();
    } else {
        // For transparent export, we just need to ensure the final image is clipped if needed, 
        // although clipping a transparent background has no visual effect unless content overflows.
        // We skip filling the background rect.
    }

    // 7. Draw Content
    // contentCanvas is scaled by multiplier, but since ctx is also scaled, 
    // we use logical dimensions for destination.
    ctx.drawImage(contentCanvas, padding, padding, innerWidth, innerHeight);

    // 8. Download
    const dataURL = exportCanvas.toDataURL('image/png');
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

  // Helper to determine the container style
  const getContainerStyle = () => {
     const baseStyle = {
        padding: `${editorState.padding}px`,
        borderRadius: `${editorState.borderRadius}px`,
        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.6)',
        transform: `scale(${zoomScale})`,
        transformOrigin: 'center center'
     };

     if (editorState.backgroundColor === 'transparent') {
         return {
             ...baseStyle,
             backgroundImage: `
                linear-gradient(45deg, #ccc 25%, transparent 25%), 
                linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                linear-gradient(45deg, transparent 75%, #ccc 75%), 
                linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
             backgroundSize: '20px 20px',
             backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
             backgroundColor: 'white'
         };
     }

     return {
         ...baseStyle,
         background: editorState.backgroundGradient || editorState.backgroundColor
     };
  };

  const startResize = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    
    // We rely on editorState values as source of truth if set, otherwise canvas dimensions
    const startW = editorState.customWidth || canvasDimensions.width || 400;
    const startH = editorState.customHeight || canvasDimensions.height || 300;

    const onMove = (moveEvent: MouseEvent) => {
        // Adjust delta by zoom scale
        const deltaX = (moveEvent.clientX - startX) / zoomScale;
        const deltaY = (moveEvent.clientY - startY) / zoomScale;
        
        let newW = startW;
        let newH = startH;

        // Simple resizing logic - resize from bottom/right implies top/left anchor
        if (direction.includes('e')) newW = Math.max(100, startW + deltaX);
        if (direction.includes('s')) newH = Math.max(100, startH + deltaY);

        // Update state - this will trigger useEffect to update canvas
        setEditorState(prev => ({
            ...prev,
            customWidth: Math.round(newW),
            customHeight: Math.round(newH)
        }));
    };

    const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const currentWidth = editorState.customWidth || canvasDimensions.width || 400;
  const currentHeight = editorState.customHeight || canvasDimensions.height || 300;

  return (
    <div 
      className="flex flex-col h-screen bg-zinc-950 text-zinc-200 overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-[60] bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-8 transition-all animate-in fade-in duration-200 pointer-events-none">
            <div className="w-full h-full border-4 border-dashed border-primary-500 rounded-3xl flex flex-col items-center justify-center gap-6">
                 <div className="w-24 h-24 rounded-full bg-primary-500/20 flex items-center justify-center animate-bounce">
                    <Upload size={48} className="text-primary-400" />
                 </div>
                 <h2 className="text-3xl font-bold text-white">Drop your image here</h2>
                 <p className="text-zinc-400 text-lg">Add to your canvas instantly</p>
            </div>
        </div>
      )}

      {isGenerating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full mx-4">
               <div className="relative">
                 <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full"></div>
                 <Loader2 size={48} className="text-primary-400 animate-spin relative z-10" />
               </div>
               <div className="text-center space-y-2">
                 <h3 className="text-xl font-bold text-white">Generating Image</h3>
                 <p className="text-zinc-400 text-sm">Processing with AI...</p>
                 <p className="text-xs text-zinc-500 mt-2">Generating Magenta Mask & Removing Background...</p>
               </div>
           </div>
        </div>
      )}

      <Toolbar 
        onUpload={() => fileInputRef.current?.click()}
        onAddText={addText}
        activeTool={activeTool}
        onSetTool={(tool) => setActiveTool(prev => prev === tool ? 'none' : tool)}
        onExport={handleExport}
        onDelete={deleteSelected}
        hasSelection={!!selectedObject}
        selectionType={selectedObject?.type}
        hasImage={hasImage}
        onGenerateImage={handleGenerateImage}
        aiTransparentBg={aiTransparentBg}
        onToggleAiTransparentBg={() => setAiTransparentBg(prev => !prev)}
        onReset={handleReset}
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
        {/* SidebarLeft removed */}

        <main ref={containerRef} className="flex-1 flex flex-col items-center justify-center bg-zinc-900 overflow-hidden relative">
          
          <div 
            id="canvas-wrapper" 
            className={`transition-all duration-300 ease-out relative ${!hasImage ? 'hidden' : 'block'}`}
            style={getContainerStyle()}
          >
            {/* The actual Fabric canvas needs to be wrapped for relative positioning of handles */}
            <div className="relative" style={{ width: currentWidth, height: currentHeight }}>
                <canvas ref={canvasRef} />
                
                {/* Resize Handles - Only show if hasImage */}
                {hasImage && (
                    <>
                        {/* Right Handle (Width) */}
                        <div 
                           onMouseDown={(e) => startResize(e, 'e')}
                           className="absolute -right-5 top-1/2 -translate-y-1/2 w-4 h-16 cursor-ew-resize flex items-center justify-center group/handle hover:scale-110 transition-transform"
                           title="Drag to resize width"
                        >
                            <div className="w-1.5 h-8 bg-zinc-600/50 rounded-full group-hover/handle:bg-primary-500 backdrop-blur-sm border border-white/10 transition-colors shadow-sm" />
                        </div>

                        {/* Bottom Handle (Height) */}
                        <div 
                           onMouseDown={(e) => startResize(e, 's')}
                           className="absolute -bottom-5 left-1/2 -translate-x-1/2 h-4 w-16 cursor-ns-resize flex items-center justify-center group/handle hover:scale-110 transition-transform"
                           title="Drag to resize height"
                        >
                             <div className="h-1.5 w-8 bg-zinc-600/50 rounded-full group-hover/handle:bg-primary-500 backdrop-blur-sm border border-white/10 transition-colors shadow-sm" />
                        </div>

                        {/* Corner Handle (Both) */}
                         <div 
                           onMouseDown={(e) => startResize(e, 'se')}
                           className="absolute -right-5 -bottom-5 w-6 h-6 cursor-nwse-resize flex items-center justify-center group/handle"
                           title="Drag to resize both"
                        >
                             <div className="w-3 h-3 bg-white border-2 border-zinc-600 rounded-full group-hover/handle:border-primary-500 group-hover/handle:scale-125 transition-all shadow-md" />
                        </div>
                    </>
                )}
            </div>
          </div>

          {!hasImage && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-lg aspect-video rounded-3xl border-2 border-dashed border-zinc-700 bg-zinc-800/40 hover:bg-zinc-800/60 hover:border-primary-500 transition-all cursor-pointer flex flex-col items-center justify-center gap-5 group"
            >
              <div className="w-20 h-20 rounded-2xl bg-zinc-700/50 group-hover:bg-primary-600/20 flex items-center justify-center transition-all group-hover:scale-110">
                <Upload size={36} className="text-zinc-400 group-hover:text-primary-400" />
              </div>
              <div className="text-center px-6">
                <p className="text-xl font-bold text-zinc-200">Snap a Screenshot Here</p>
                <p className="text-sm text-zinc-500 mt-2">Upload images or <span className="text-primary-400 font-bold hover:underline" onClick={(e) => { e.stopPropagation(); handleGenerateImage(); }}>generate with AI</span></p>
              </div>
            </div>
          )}
          
          {hasImage && (
            <div className="absolute bottom-8 px-6 py-3 bg-zinc-950/80 backdrop-blur-2xl rounded-2xl text-[11px] text-zinc-400 border border-zinc-800 shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-zinc-200 uppercase tracking-tighter">Multi-Object Canvas Active</span>
              </div>
              <div className="w-px h-4 bg-zinc-800" />
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