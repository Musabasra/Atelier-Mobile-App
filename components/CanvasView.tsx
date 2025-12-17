import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Layers, Undo2, Redo2, Brush, Eraser, ImagePlus, Save, UploadCloud, ChevronDown } from 'lucide-react';
import { Sketch, ToolType, DrawPoint } from '../types';
import Slider from './Slider';

interface CanvasViewProps {
  sketch: Sketch;
  onBack: () => void;
  onSave: (id: string, thumbnail: string) => void;
  onSync: (id: string) => void;
}

const CanvasView: React.FC<CanvasViewProps> = ({ sketch, onBack, onSave, onSync }) => {
  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  
  // Tool State
  const [tool, setTool] = useState<ToolType>('brush');
  const [brushSize, setBrushSize] = useState(5);
  const [opacity, setOpacity] = useState(100);
  const [layersOpen, setLayersOpen] = useState(false);
  
  // UI State
  const [syncing, setSyncing] = useState(false);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Set high resolution for retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      setContext(ctx);
      
      // Load thumbnail if exists (simple mock for restoration)
      if (sketch.thumbnail) {
        const img = new Image();
        img.src = sketch.thumbnail;
        img.onload = () => {
          ctx.drawImage(img, 0, 0, container.clientWidth, container.clientHeight);
          saveHistory(ctx, canvas);
        };
      } else {
        // Initial history save
        saveHistory(ctx, canvas);
      }
    }
  }, []);

  // Drawing Logic
  const getCoordinates = (event: React.PointerEvent): DrawPoint => {
    if (!canvasRef.current) return { x: 0, y: 0, pressure: 0.5 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      pressure: event.pressure || 0.5
    };
  };

  const startDrawing = (e: React.PointerEvent) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    if (!context) return;
    
    context.beginPath();
    context.moveTo(x, y);
    // Draw a single dot
    context.lineTo(x, y);
    context.stroke();
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing || !context) return;
    e.preventDefault(); // Prevent scrolling
    const { x, y, pressure } = getCoordinates(e);

    context.lineWidth = tool === 'eraser' ? brushSize * 2 : brushSize * (1 + pressure);
    context.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    context.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : `rgba(0, 0, 0, ${opacity / 100})`;
    
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && context && canvasRef.current) {
      context.closePath();
      setIsDrawing(false);
      saveHistory(context, canvasRef.current);
    }
  };

  // History Management
  const saveHistory = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyStep > 0 && context) {
      const prevData = history[historyStep - 1];
      context.putImageData(prevData, 0, 0);
      setHistoryStep(historyStep - 1);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1 && context) {
      const nextData = history[historyStep + 1];
      context.putImageData(nextData, 0, 0);
      setHistoryStep(historyStep + 1);
    }
  };

  // File IO
  const handleImageImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && context && containerRef.current) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Center and fit image
          const containerW = containerRef.current!.clientWidth;
          const containerH = containerRef.current!.clientHeight;
          const scale = Math.min(containerW / img.width, containerH / img.height) * 0.8;
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (containerW - w) / 2;
          const y = (containerH - h) / 2;
          
          context.globalCompositeOperation = 'source-over';
          context.globalAlpha = 1;
          context.drawImage(img, x, y, w, h);
          saveHistory(context, canvasRef.current!);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (canvasRef.current) {
      // Create a temporary canvas to composite white bg + drawing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvasRef.current.width;
      tempCanvas.height = canvasRef.current.height;
      const tCtx = tempCanvas.getContext('2d');
      if (tCtx) {
        tCtx.fillStyle = '#FFFFFF';
        tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tCtx.drawImage(canvasRef.current, 0, 0);
        const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.8);
        onSave(sketch.id, dataUrl);
      }
    }
  };

  const handleSync = () => {
    handleSave();
    setSyncing(true);
    setTimeout(() => {
      onSync(sketch.id);
      setSyncing(false);
    }, 2000); // Simulate network
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-neutral-900 overflow-hidden">
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent z-50 flex justify-between items-center px-4 pointer-events-none">
        <button onClick={onBack} className="pointer-events-auto text-white/80 hover:text-gold transition-colors">
          <ArrowLeft size={24} />
        </button>
        <span className="font-serif text-white/50 text-sm tracking-wider">{sketch.title}</span>
        
        {/* Layer Stack Toggle */}
        <button 
          onClick={() => setLayersOpen(!layersOpen)}
          className={`pointer-events-auto p-2 rounded-lg transition-colors ${layersOpen ? 'bg-burgundy text-gold' : 'text-white/80 hover:text-gold'}`}
        >
          <Layers size={24} />
        </button>
      </div>

      {/* Layer Stack Panel */}
      {layersOpen && (
        <div className="absolute top-16 right-4 w-48 bg-charcoal/95 backdrop-blur-md border border-white/10 rounded-xl shadow-luxury z-50 p-3 space-y-2 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between text-xs text-gray-500 uppercase tracking-wider mb-2">
            <span>Layers</span>
            <ChevronDown size={14} />
          </div>
          
          {/* Layer 1 (Active) */}
          <div className="p-3 bg-white/10 border border-gold/30 rounded-lg flex items-center space-x-3 cursor-pointer">
            <div className="w-8 h-8 bg-white rounded border border-white/20 overflow-hidden">
                {/* Tiny preview approximation could go here */}
                <div className="w-full h-full bg-checkered opacity-50"></div> 
            </div>
            <div>
              <p className="text-white text-sm font-medium">Sketch</p>
              <p className="text-gold text-xs">Normal • 100%</p>
            </div>
          </div>

          {/* Layer 0 (Locked) */}
          <div className="p-3 bg-white/5 border border-transparent rounded-lg flex items-center space-x-3 opacity-60">
            <div className="w-8 h-8 bg-white rounded border border-white/20"></div>
            <div>
              <p className="text-white text-sm font-medium">Paper</p>
              <p className="text-gray-400 text-xs">Locked</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div ref={containerRef} className="flex-1 relative bg-neutral-800 touch-none">
        {/* Layer 0: Background */}
        <div className="absolute inset-4 bg-white shadow-2xl pointer-events-none" />
        
        {/* Layer 1: Active Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-4 touch-none cursor-crosshair"
          style={{ width: 'calc(100% - 2rem)', height: 'calc(100% - 2rem)' }}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
        />
      </div>

      {/* Left Sidebar (Tools) */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-8 py-6 px-3 bg-charcoal/80 backdrop-blur-md rounded-full border border-white/5 shadow-luxury z-40">
        <Slider 
          value={brushSize} 
          min={1} 
          max={50} 
          onChange={setBrushSize} 
          label="Size" 
        />
        <Slider 
          value={opacity} 
          min={1} 
          max={100} 
          onChange={setOpacity} 
          label="Opac" 
        />
      </div>

      {/* Bottom Atelier Dock */}
      <div className="absolute bottom-6 left-6 right-6 h-16 bg-burgundy rounded-2xl shadow-luxury flex items-center justify-between px-6 z-50 border border-white/10">
        
        {/* Drawing Tools */}
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => setTool('brush')}
            className={`p-2 rounded-full transition-all ${tool === 'brush' ? 'bg-gold text-charcoal shadow-glow scale-110' : 'text-white/70 hover:text-white'}`}
          >
            <Brush size={20} />
          </button>
          
          <button 
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-full transition-all ${tool === 'eraser' ? 'bg-gold text-charcoal shadow-glow scale-110' : 'text-white/70 hover:text-white'}`}
          >
            <Eraser size={20} />
          </button>

          <div className="h-8 w-px bg-white/20 mx-2"></div>

          {/* Media Import */}
          <label className="p-2 text-white/70 hover:text-gold active:scale-95 transition-transform cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleImageImport} />
            <ImagePlus size={22} />
          </label>
        </div>

        {/* Action Tools */}
        <div className="flex items-center space-x-6">
          <div className="flex space-x-2">
            <button onClick={handleUndo} disabled={historyStep <= 0} className="p-2 text-white/70 hover:text-white disabled:opacity-30">
              <Undo2 size={22} />
            </button>
            <button onClick={handleRedo} disabled={historyStep >= history.length - 1} className="p-2 text-white/70 hover:text-white disabled:opacity-30">
              <Redo2 size={22} />
            </button>
          </div>

          <div className="h-8 w-px bg-white/20 mx-2"></div>

          {/* Save/Sync */}
          {sketch.status === 'Ready for Atelier Sync' ? (
             <button 
               onClick={handleSync}
               className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gold to-gold-light rounded-lg text-charcoal font-bold text-xs uppercase tracking-wide shadow-lg ${syncing ? 'animate-pulse' : ''}`}
             >
               {syncing ? (
                 <span>Syncing...</span>
               ) : (
                 <>
                   <UploadCloud size={16} />
                   <span>Sync</span>
                 </>
               )}
             </button>
          ) : (
            <button 
              onClick={handleSave}
              className="p-2 bg-white/10 rounded-lg text-gold hover:bg-white/20 transition-colors"
            >
              <Save size={20} />
            </button>
          )}
        </div>
      </div>
      
      {/* Sync Success Overlay */}
      {syncing && (
        <div className="absolute inset-0 bg-burgundy/40 backdrop-blur-sm z-[60] flex items-center justify-center">
            <div className="bg-charcoal p-8 rounded-2xl shadow-2xl border border-gold/50 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-4 border-gold border-t-transparent animate-spin mb-4"></div>
                <h3 className="text-gold font-serif text-xl">Syncing to Atelier</h3>
                <p className="text-gray-400 text-sm mt-2">Uploading high-res assets...</p>
            </div>
        </div>
      )}

    </div>
  );
};

export default CanvasView;