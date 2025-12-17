import React, { useState } from 'react';
import { Project, Sketch } from './types';
import Gallery from './components/Gallery';
import CanvasView from './components/CanvasView';

// Mock Initial Data - Updated with Burgundy vibes
const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Autumn Collection 24',
    sketches: [
      { id: 's1', title: 'Silhouette Study #1', createdAt: '2023-10-24', status: 'Ready for Atelier Sync' },
      { id: 's2', title: 'Fabric Drape Concept', createdAt: '2023-10-25', status: 'Local Sketch' },
    ]
  },
  {
    id: 'p2',
    name: 'Couture Ideas',
    sketches: []
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<'GALLERY' | 'CANVAS'>('GALLERY');
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentSketch, setCurrentSketch] = useState<Sketch | null>(null);

  const handleOpenSketch = (project: Project, sketch: Sketch) => {
    setCurrentProject(project);
    setCurrentSketch(sketch);
    setView('CANVAS');
  };

  const handleCreateSketch = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newSketch: Sketch = {
      id: Date.now().toString(),
      title: `Untitled Sketch ${project.sketches.length + 1}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Local Sketch',
    };

    const updatedProjects = projects.map(p => {
      if (p.id === projectId) {
        return { ...p, sketches: [newSketch, ...p.sketches] };
      }
      return p;
    });

    setProjects(updatedProjects);
    setCurrentProject(project); 
    setCurrentSketch(newSketch);
    setView('CANVAS');
  };

  const handleSaveSketch = (sketchId: string, thumbnail: string) => {
    if (!currentProject) return;

    const updatedProjects = projects.map(p => {
      if (p.id === currentProject.id) {
        return {
          ...p,
          sketches: p.sketches.map(s => 
            s.id === sketchId ? { ...s, thumbnail } : s
          )
        };
      }
      return p;
    });
    setProjects(updatedProjects);
  };

  const handleSyncSketch = (sketchId: string) => {
    if (!currentProject) return;
    
    const updatedProjects = projects.map(p => {
      if (p.id === currentProject.id) {
        return {
          ...p,
          sketches: p.sketches.map(s => 
            s.id === sketchId ? { ...s, status: 'Ready for Atelier Sync' as const } : s
          )
        };
      }
      return p;
    });
    setProjects(updatedProjects);
  };

  const handleBackToGallery = () => {
    setView('GALLERY');
    setCurrentSketch(null);
  };

  return (
    /* FIXED: Changed h-full to min-h-screen to prevent black screen.
      FIXED: Added direct Burgundy (#800020) and Charcoal (#121212) styles.
    */
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', width: '100vw', color: 'white', overflow: 'hidden' }}>
      <div className="w-full h-full font-sans selection:bg-[#800020] selection:text-white">
        {view === 'GALLERY' ? (
          <Gallery 
            projects={projects} 
            onOpenSketch={handleOpenSketch} 
            onCreateSketch={handleCreateSketch} 
          />
        ) : (
          <CanvasView 
            sketch={currentSketch!} 
            onBack={handleBackToGallery}
            onSave={handleSaveSketch}
            onSync={handleSyncSketch}
          />
        )}
      </div>
    </div>
  );
};

export default App;