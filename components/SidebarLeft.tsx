
import React from 'react';
import { Layout, Smartphone, Monitor, LayoutGrid } from 'lucide-react';
import { Template } from '../types';

const TEMPLATES: Template[] = [
  {
    id: 't1',
    name: 'Modern Ocean',
    preview: 'https://picsum.photos/seed/1/200/150',
    config: {
      backgroundGradient: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
      padding: 60,
      borderRadius: 20
    }
  },
  {
    id: 't2',
    name: 'Sunset Glow',
    preview: 'https://picsum.photos/seed/2/200/150',
    config: {
      backgroundGradient: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
      padding: 80,
      borderRadius: 12
    }
  },
  {
    id: 't3',
    name: 'Deep Space',
    preview: 'https://picsum.photos/seed/3/200/150',
    config: {
      backgroundGradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      padding: 40,
      borderRadius: 8
    }
  },
  {
    id: 't4',
    name: 'Minimalist White',
    preview: 'https://picsum.photos/seed/4/200/150',
    config: {
      backgroundColor: '#f8fafc',
      backgroundGradient: '',
      padding: 100,
      borderRadius: 4
    }
  }
];

interface SidebarLeftProps {
  onApplyTemplate: (template: Template) => void;
}

const SidebarLeft: React.FC<SidebarLeftProps> = ({ onApplyTemplate }) => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-40">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <LayoutGrid size={14} />
          Templates
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {TEMPLATES.map(tpl => (
          <button
            key={tpl.id}
            onClick={() => onApplyTemplate(tpl)}
            className="w-full group text-left space-y-2"
          >
            <div className="aspect-video w-full rounded-lg overflow-hidden border-2 border-transparent group-hover:border-indigo-500 transition-all shadow-sm">
              <img src={tpl.preview} alt={tpl.name} className="w-full h-full object-cover" />
            </div>
            <p className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">
              {tpl.name}
            </p>
          </button>
        ))}
      </div>
      <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-[10px] text-slate-500 text-center">
        More templates coming soon...
      </div>
    </aside>
  );
};

export default SidebarLeft;
