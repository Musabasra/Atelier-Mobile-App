import React, { useRef, useState, useEffect } from 'react';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  label: string;
}

const Slider: React.FC<SliderProps> = ({ value, min, max, onChange, label }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateValue = (clientY: number) => {
    if (!trackRef.current) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const height = rect.height;
    const relativeY = clientY - rect.top;
    
    // Invert Y because slider goes up
    const percentage = Math.max(0, Math.min(1, 1 - (relativeY / height)));
    
    const newValue = Math.round(min + percentage * (max - min));
    onChange(newValue);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateValue(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      updateValue(e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col items-center space-y-2">
      <div 
        ref={trackRef}
        className="relative w-8 h-40 bg-black/40 rounded-full border border-white/10 overflow-hidden cursor-ns-resize touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Fill */}
        <div 
          className="absolute bottom-0 left-0 right-0 bg-gold/80 transition-all duration-75 ease-out"
          style={{ height: `${percentage}%` }}
        />
        
        {/* Label inside (dynamic color contrast) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <span className="text-[10px] font-bold tracking-tighter text-white drop-shadow-md rotate-[-90deg]">
                {value}
             </span>
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-gold font-medium">
        {label}
      </span>
    </div>
  );
};

export default Slider;