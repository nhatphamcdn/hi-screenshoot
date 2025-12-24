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
  RotateCcw,
  PanelRight,
  Menu,
  X,
  Zap,
  Crown
} from 'lucide-react';
import { AIModel } from '../types';

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
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  aiModel?: AIModel;
  onSetAiModel?: (model: AIModel) => void;
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
  onReset,
  onToggleSidebar,
  isSidebarOpen,
  aiModel = 'flash',
  onSetAiModel
}) => {
  const isImageSelected = hasSelection && selectionType === 'image';

  const ToolsGroup = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
        {onReset && (
            <button 
                onClick={onReset}
                className={`flex items-center justify-center rounded-md transition-colors ${
                    isMobile 
                    ? 'flex-col gap-1 p-2 text-zinc-400 hover:text-white min-w-[50px]' 
                    : 'flex-row gap-2 px-3 py-2 hover:bg-zinc-800 text-zinc-300'
                }`}
                title="Reset"
            >
                <RotateCcw size={isMobile ? 20 : 18} />
                <span className={isMobile ? "text-[10px]" : "text-sm font-medium hidden lg:inline"}>Reset</span>
            </button>
        )}

        <button 
            onClick={onUpload}
            className={`flex items-center justify-center rounded-md transition-colors ${
                    isMobile 
                    ? 'flex-col gap-1 p-2 text-zinc-400 hover:text-white min-w-[50px]' 
                    : 'flex-row gap-2 px-3 py-2 hover:bg-zinc-800 text-zinc-300'
            }`}
             title="Upload"
        >
            <Plus size={isMobile ? 20 : 18} />
            <span className={isMobile ? "text-[10px]" : "text-sm font-medium hidden sm:inline"}>Upload</span>
        </button>

        {onGenerateImage && (
             <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-1 bg-zinc-800/50 rounded-md p-1 border border-zinc-700/50 ml-2'}`}>
                {/* Model Selector */}
                {onSetAiModel && (
                    <div className="flex bg-zinc-900 rounded border border-zinc-700 p-0.5 mr-1">
                        <button
                            onClick={() => onSetAiModel('flash')}
                            className={`p-1 rounded transition-colors ${aiModel === 'flash' ? 'bg-zinc-700 text-primary-300' : 'text-zinc-500 hover:text-zinc-300'}`}
                            title="Flash (Fast, Lower Limits)"
                        >
                            <Zap size={14} />
                        </button>
                        <button
                            onClick={() => onSetAiModel('pro')}
                            className={`p-1 rounded transition-colors ${aiModel === 'pro' ? 'bg-zinc-700 text-yellow-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                            title="Pro (High Quality, Your Key)"
                        >
                            <Crown size={14} />
                        </button>
                    </div>
                )}

                <button 
                  onClick={onGenerateImage}
                  className={`flex items-center justify-center rounded transition-colors ${
                      isMobile
                      ? 'flex-col gap-1 p-2 text-zinc-400 min-w-[50px]' 
                      : 'gap-2 px-3 py-1.5 text-sm font-medium'
                  } ${!isMobile && isImageSelected ? 'bg-primary-600/10 text-primary-300' : (!isMobile ? 'hover:bg-zinc-700 text-primary-300' : '')}`}
                >
                  <Sparkles size={isMobile ? 20 : 16} className={!isMobile && isImageSelected ? 'fill-primary-500/20' : ''} />
                   {isMobile && <span className="text-[10px]">AI</span>}
                   {!isMobile && <span className="hidden xl:inline">{hasImage ? 'Remove bg' : 'AI Gen'}</span>}
                </button>
                
                {!isMobile && <div className="w-px h-4 bg-zinc-700 mx-1"></div>}

                <button 
                  onClick={onToggleAiTransparentBg}
                  className={`rounded transition-colors ${
                      isMobile
                      ? 'flex-col gap-1 p-2 text-zinc-400 min-w-[50px] flex items-center justify-center'
                      : 'p-1.5'
                  } ${aiTransparentBg ? 'bg-primary-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700'}`}
                  title="Transparent BG Toggle"
                >
                  <Ghost size={isMobile ? 20 : 16} />
                  {isMobile && <span className="text-[10px]">{aiTransparentBg ? 'On' : 'Off'}</span>}
                </button>
             </div>
        )}

        {/* Separator for desktop */}
        {!isMobile && <div className="w-px h-4 bg-zinc-800 mx-2 hidden sm:block" />}

        <button 
            onClick={onAddText}
            className={`flex items-center justify-center rounded-md transition-colors ${
                    isMobile 
                    ? 'flex-col gap-1 p-2 text-zinc-400 hover:text-white min-w-[50px]' 
                    : 'flex-row gap-2 px-3 py-2 hover:bg-zinc-800 text-zinc-300'
            }`}
        >
            <Type size={isMobile ? 20 : 18} />
             <span className={isMobile ? "text-[10px]" : "text-sm font-medium hidden md:inline"}>Text</span>
        </button>

        <button 
            onClick={() => onSetTool('rect')}
            className={`flex items-center justify-center rounded-md transition-colors ${
                    isMobile 
                    ? `flex-col gap-1 p-2 min-w-[50px] ${activeTool === 'rect' ? 'text-primary-400' : 'text-zinc-400'}`
                    : `flex-row gap-2 px-3 py-2 ${activeTool === 'rect' ? 'bg-primary-600/20 text-primary-400' : 'hover:bg-zinc-800 text-zinc-300'}`
            }`}
        >
            <Square size={isMobile ? 20 : 18} />
             <span className={isMobile ? "text-[10px]" : "text-sm font-medium hidden xl:inline"}>Rect</span>
        </button>

        <button 
            onClick={() => onSetTool('circle')}
            className={`flex items-center justify-center rounded-md transition-colors ${
                    isMobile 
                    ? `flex-col gap-1 p-2 min-w-[50px] ${activeTool === 'circle' ? 'text-primary-400' : 'text-zinc-400'}`
                    : `flex-row gap-2 px-3 py-2 ${activeTool === 'circle' ? 'bg-primary-600/20 text-primary-400' : 'hover:bg-zinc-800 text-zinc-300'}`
            }`}
        >
            <CircleIcon size={isMobile ? 20 : 18} />
             <span className={isMobile ? "text-[10px]" : "text-sm font-medium hidden xl:inline"}>Circle</span>
        </button>

        <button 
            onClick={() => onSetTool('arrow')}
            className={`flex items-center justify-center rounded-md transition-colors ${
                    isMobile 
                    ? `flex-col gap-1 p-2 min-w-[50px] ${activeTool === 'arrow' ? 'text-primary-400' : 'text-zinc-400'}`
                    : `flex-row gap-2 px-3 py-2 ${activeTool === 'arrow' ? 'bg-primary-600/20 text-primary-400' : 'hover:bg-zinc-800 text-zinc-300'}`
            }`}
        >
            <ArrowRight size={isMobile ? 20 : 18} />
             <span className={isMobile ? "text-[10px]" : "text-sm font-medium hidden xl:inline"}>Arrow</span>
        </button>
    </>
  );

  return (
      <>
        <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 lg:px-6 z-50 shrink-0 relative justify-between">
            {/* Desktop: Logo and Tools on the Left */}
            <div className="hidden md:flex items-center gap-6">
                 {/* Logo */}
                <div className="flex flex-col items-center pointer-events-none select-none">
                     <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                        Image Editor
                     </span>
                </div>
                
                <div className="h-6 w-px bg-zinc-800" />

                {/* Tools */}
                <div className="flex items-center gap-1">
                    <ToolsGroup isMobile={false} />
                </div>
            </div>

            {/* Mobile: Centered Logo */}
            <div className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                 <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                    Image Editor
                 </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 ml-auto z-10">
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
                <span className="hidden sm:inline">Export</span>
                </button>
                
                {onToggleSidebar && (
                    <button 
                        onClick={onToggleSidebar}
                        className={`p-2 rounded-md ml-2 transition-colors ${isSidebarOpen ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                    >
                        <PanelRight size={20} />
                    </button>
                )}
            </div>
        </header>

        {/* Mobile Bottom Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 z-50 pb-safe">
            <div className="flex items-center justify-between px-4 py-2 overflow-x-auto no-scrollbar">
                <ToolsGroup isMobile={true} />
            </div>
        </div>
    </>
  );
};

export default Toolbar;