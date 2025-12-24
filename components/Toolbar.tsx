import React from 'react';
import { 
  Plus, 
  Download, 
  Type, 
  Square, 
  Circle as CircleIcon, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  Ghost, 
  RotateCcw 
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
  hasImage?: boolean;
  onGenerateImage?: () => void;
  aiTransparentBg?: boolean;
  onToggleAiTransparentBg?: () => void;
  onReset?: () => void;
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
  hasImage = false,
  onGenerateImage,
  aiTransparentBg,
  onToggleAiTransparentBg,
  onReset
}) => {
  const isImageSelected = hasSelection && selectionType === 'image';

  return (
    <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
            Image Editor
          </span>
        </div>

        <div className="h-8 w-px bg-zinc-800 mx-2" />

        <div className="flex items-center gap-1">
          {onReset && (
            <>
              <button 
                onClick={onReset}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 transition-colors text-sm font-medium"
                title="Reset to Start"
              >
                <RotateCcw size={18} />
                <span>Reset</span>
              </button>
              <div className="w-px h-4 bg-zinc-800 mx-2" />
            </>
          )}
          
          <button 
            onClick={onUpload}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            <span>Upload</span>
          </button>
           {onGenerateImage && (
            <div className="flex items-center gap-1 bg-zinc-800/50 rounded-md p-1 border border-zinc-700/50 ml-2">
                <button 
                  onClick={onGenerateImage}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors text-sm font-medium ${isImageSelected ? 'bg-primary-600/10 text-primary-300 hover:bg-primary-600/20' : 'hover:bg-zinc-700 text-primary-300'}`}
                >
                  <Sparkles size={16} className={isImageSelected ? 'fill-primary-500/20' : ''} />
                  <span>{hasImage ? 'Remove bg' : 'AI Gen'}</span>
                </button>
                <div className="w-px h-4 bg-zinc-700 mx-1"></div>
                <button 
                  onClick={onToggleAiTransparentBg}
                  title={aiTransparentBg ? "Transparent Background: ON" : "Transparent Background: OFF"}
                  className={`p-1.5 rounded transition-colors ${aiTransparentBg ? 'bg-primary-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700'}`}
                >
                  <Ghost size={16} />
                </button>
            </div>
          )}
          <button 
            onClick={onAddText}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-zinc-800 text-zinc-300 transition-colors text-sm font-medium ml-2"
          >
            <Type size={18} />
            <span>Text</span>
          </button>
          <button 
            onClick={() => onSetTool('rect')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium ${activeTool === 'rect' ? 'bg-primary-600/20 text-primary-400' : 'hover:bg-zinc-800 text-zinc-300'}`}
          >
            <Square size={18} />
            <span>Rect</span>
          </button>
          <button 
            onClick={() => onSetTool('circle')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium ${activeTool === 'circle' ? 'bg-primary-600/20 text-primary-400' : 'hover:bg-zinc-800 text-zinc-300'}`}
          >
            <CircleIcon size={18} />
            <span>Circle</span>
          </button>
          <button 
            onClick={() => onSetTool('arrow')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium ${activeTool === 'arrow' ? 'bg-primary-600/20 text-primary-400' : 'hover:bg-zinc-800 text-zinc-300'}`}
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
        <button 
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-md transition-all text-sm font-bold shadow-lg shadow-primary-600/20"
        >
          <Download size={18} />
          <span>Export PNG</span>
        </button>
      </div>
    </header>
  );
};

export default Toolbar;