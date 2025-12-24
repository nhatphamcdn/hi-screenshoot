import React from 'react';
import { 
  Plus, 
  Download, 
  Image as ImageIcon, 
  Type, 
  Square, 
  Circle as CircleIcon,
  Trash2,
  Share2,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface ToolbarProps {
  onUpload: () => void;
  onAddText: () => void;
  activeTool: 'none' | 'rect' | 'circle' | 'arrow';
  onSetTool: (tool: 'none' | 'rect' | 'circle' | 'arrow') => void;
  onExport: () => void;
  onDelete: () => void;
  hasSelection: boolean;
  selectionType?: string;
  onGenerateImage?: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  onUpload, 
  onAddText, 
  activeTool, 
  onSetTool, 
  onExport, 
  onDelete, 
  hasSelection,
  selectionType,
  onGenerateImage
}) => {
  const isImageSelected = hasSelection && selectionType === 'image';

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <ImageIcon size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            SnapStyle
          </span>
        </div>

        <div className="h-8 w-px bg-slate-800 mx-2" />

        <div className="flex items-center gap-1">
          <button 
            onClick={onUpload}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-800 text-slate-300 transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            <span>Upload</span>
          </button>
           {onGenerateImage && (
            <button 
              onClick={onGenerateImage}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium border ${isImageSelected ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-300 hover:bg-indigo-600/20' : 'hover:bg-indigo-900/30 text-indigo-300 border-indigo-500/20'}`}
            >
              <Sparkles size={16} className={isImageSelected ? 'fill-indigo-500/20' : ''} />
              <span>{isImageSelected ? 'AI Edit' : 'AI Gen'}</span>
            </button>
          )}
          <button 
            onClick={onAddText}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-800 text-slate-300 transition-colors text-sm font-medium"
          >
            <Type size={18} />
            <span>Text</span>
          </button>
          <button 
            onClick={() => onSetTool('rect')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium ${activeTool === 'rect' ? 'bg-indigo-600/20 text-indigo-400' : 'hover:bg-slate-800 text-slate-300'}`}
          >
            <Square size={18} />
            <span>Rect</span>
          </button>
          <button 
            onClick={() => onSetTool('circle')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium ${activeTool === 'circle' ? 'bg-indigo-600/20 text-indigo-400' : 'hover:bg-slate-800 text-slate-300'}`}
          >
            <CircleIcon size={18} />
            <span>Circle</span>
          </button>
          <button 
            onClick={() => onSetTool('arrow')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium ${activeTool === 'arrow' ? 'bg-indigo-600/20 text-indigo-400' : 'hover:bg-slate-800 text-slate-300'}`}
          >
            <ArrowRight size={18} />
            <span>Arrow</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {hasSelection && (
          <button 
            onClick={onDelete}
            className="p-2 text-rose-400 hover:bg-rose-900/20 rounded-md transition-colors mr-2"
            title="Delete Selected"
          >
            <Trash2 size={20} />
          </button>
        )}
        <button className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-md transition-colors text-sm font-medium">
          <Share2 size={18} />
          <span>Share</span>
        </button>
        <button 
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-all text-sm font-bold shadow-lg shadow-indigo-600/20"
        >
          <Download size={18} />
          <span>Export PNG</span>
        </button>
      </div>
    </header>
  );
};

export default Toolbar;