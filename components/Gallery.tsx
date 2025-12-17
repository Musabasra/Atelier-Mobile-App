import React from 'react';
import { Folder, Plus, FileImage, Cloud, CheckCircle2 } from 'lucide-react';
import { Project, Sketch } from '../types';

interface GalleryProps {
  projects: Project[];
  onOpenSketch: (project: Project, sketch: Sketch) => void;
  onCreateSketch: (projectId: string) => void;
}

const Gallery: React.FC<GalleryProps> = ({ projects, onOpenSketch, onCreateSketch }) => {
  return (
    <div className="flex flex-col h-full bg-charcoal">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 bg-gradient-to-b from-burgundy/20 to-transparent">
        <h1 className="text-4xl font-serif text-gold drop-shadow-lg tracking-wide">Atelier</h1>
        <p className="text-gray-400 text-sm mt-1 tracking-widest uppercase">Mobile Creative Suite</p>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-20 no-scrollbar">
        {projects.map(project => (
          <div key={project.id} className="mb-8">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center space-x-2 text-gold-light">
                <Folder size={20} />
                <h2 className="text-xl font-serif tracking-wide">{project.name}</h2>
              </div>
              <button 
                onClick={() => onCreateSketch(project.id)}
                className="p-2 bg-burgundy rounded-full text-white shadow-luxury hover:scale-105 transition-transform active:scale-95"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {project.sketches.map(sketch => (
                <div 
                  key={sketch.id} 
                  onClick={() => onOpenSketch(project, sketch)}
                  className="group relative aspect-[3/4] bg-neutral-900 rounded-lg overflow-hidden border border-white/5 hover:border-gold/50 transition-colors cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="w-full h-full bg-white flex items-center justify-center">
                     {sketch.thumbnail ? (
                       <img src={sketch.thumbnail} alt={sketch.title} className="w-full h-full object-cover" />
                     ) : (
                       <div className="opacity-10">
                         <FileImage size={40} className="text-black" />
                       </div>
                     )}
                  </div>

                  {/* Overlay Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8">
                    <h3 className="text-white font-medium text-sm truncate">{sketch.title}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">{sketch.createdAt}</span>
                      {sketch.status === 'Ready for Atelier Sync' && (
                        <Cloud size={12} className="text-gold animate-pulse" />
                      )}
                      {sketch.status === 'Synced' && (
                        <CheckCircle2 size={12} className="text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {project.sketches.length === 0 && (
                <div className="col-span-2 py-8 text-center border border-dashed border-white/10 rounded-lg">
                  <p className="text-gray-500 text-sm">No sketches in this collection.</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;