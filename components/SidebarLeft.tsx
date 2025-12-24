import React from 'react';
import { LayoutGrid, Sparkles } from 'lucide-react';
import { Template } from '../types';

const TEMPLATES: Template[] = [
  {
    id: 't1',
    name: 'Modern Ocean',
    preview: 'https://picsum.photos/seed/ocean/200/120',
    config: {
      backgroundGradient: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
      padding: 64,
      borderRadius: 24,
      shadowBlur: 40,
      shadowOpacity: 0.3
    }
  },
  {
    id: 't2',
    name: 'Sunset Glow',
    preview: 'https://picsum.photos/seed/sunset/200/120',
    config: {
      backgroundGradient: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
      padding: 80,
      borderRadius: 16,
      shadowBlur: 50,
      shadowOpacity: 0.4
    }
  },
  {
    id: 't3',
    name: 'Deep Space',
    preview: 'https://picsum.photos/seed/space/200/120',
    config: {
      backgroundGradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      padding: 48,
      borderRadius: 12,
      shadowBlur: 60,
      shadowOpacity: 0.6
    }
  },
  {
    id: 't4',
    name: 'Minimalist White',
    preview: 'https://picsum.photos/seed/clean/200/120',
    config: {
      backgroundColor: '#f8fafc',
      backgroundGradient: '',
      padding: 100,
      borderRadius: 8,
      shadowBlur: 30,
      shadowOpacity: 0.15
    }
  },
  {
    id: 't5',
    name: 'Aurora Borealis',
    preview: 'https://picsum.photos/seed/aurora/200/120',
    config: {
      backgroundGradient: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
      padding: 72,
      borderRadius: 32,
      shadowBlur: 45,
      shadowOpacity: 0.25
    }
  },
  {
    id: 't6',
    name: 'Midnight Neon',
    preview: 'https://picsum.photos/seed/neon/200/120',
    config: {
      backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 56,
      borderRadius: 20,
      shadowBlur: 80,
      shadowOpacity: 0.5
    }
  },
  {
    id: 't7',
    name: 'Cotton Candy',
    preview: 'https://picsum.photos/seed/candy/200/120',
    config: {
      backgroundGradient: 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)',
      padding: 90,
      borderRadius: 40,
      shadowBlur: 35,
      shadowOpacity: 0.2
    }
  },
  {
    id: 't8',
    name: 'Forest Moss',
    preview: 'https://picsum.photos/seed/forest/200/120',
    config: {
      backgroundGradient: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
      padding: 60,
      borderRadius: 16,
      shadowBlur: 40,
      shadowOpacity: 0.35
    }
  },
  {
    id: 't9',
    name: 'Solar Flare',
    preview: 'https://picsum.photos/seed/fire/200/120',
    config: {
      backgroundGradient: 'linear-gradient(135deg, #f83600 0%, #f9d423 100%)',
      padding: 85,
      borderRadius: 12,
      shadowBlur: 50,
      shadowOpacity: 0.4
    }
  },
  {
    id: 't10',
    name: 'Lavender Mist',
    preview: 'https://picsum.photos/seed/mist/200/120',
    config: {
      backgroundGradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      padding: 70,
      borderRadius: 28,
      shadowBlur: 30,
      shadowOpacity: 0.2
    }
  },
  {
    id: 't11',
    name: 'Cyberpunk Red',
    preview: 'https://picsum.photos/seed/cyber/200/120',
    config: {
      backgroundGradient: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
      padding: 50,
      borderRadius: 4,
      shadowBlur: 70,
      shadowOpacity: 0.6
    }
  },
  {
    id: 't12',
    name: 'Corporate Slate',
    preview: 'https://picsum.photos/seed/corp/200/120',
    config: {
      backgroundColor: '#334155',
      backgroundGradient: '',
      padding: 64,
      borderRadius: 12,
      shadowBlur: 40,
      shadowOpacity: 0.5
    }
  }
];

interface SidebarLeftProps {
  onApplyTemplate: (template: Template) => void;
}

const SidebarLeft: React.FC<SidebarLeftProps> = ({ onApplyTemplate }) => {
  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col z-40">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <LayoutGrid size={14} />
          Templates
        </h2>
        <Sparkles size={14} className="text-indigo-500 animate-pulse" />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {TEMPLATES.map(tpl => (
          <button
            key={tpl.id}
            onClick={() => onApplyTemplate(tpl)}
            className="w-full group text-left transition-all hover:translate-y-[-2px]"
          >
            <div className="relative aspect-video w-full rounded-xl overflow-hidden border-2 border-zinc-800 group-hover:border-indigo-500/50 group-hover:shadow-[0_0_20px_rgba(79,70,229,0.2)] transition-all">
              <img 
                src={tpl.preview} 
                alt={tpl.name} 
                className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Apply Preset</span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-400 group-hover:text-white transition-colors truncate">
                {tpl.name}
              </p>
              <div 
                className="w-3 h-3 rounded-full border border-zinc-700" 
                style={{ background: tpl.config.backgroundGradient || tpl.config.backgroundColor }}
              />
            </div>
          </button>
        ))}
      </div>
      <div className="p-4 bg-zinc-950/50 border-t border-zinc-800">
        <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
          <p className="text-[10px] text-zinc-500 leading-relaxed text-center">
            Templates automatically adjust padding, gradients, and shadows for your screenshot.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default SidebarLeft;