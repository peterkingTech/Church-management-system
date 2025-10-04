import React from 'react';
import { Church } from 'lucide-react';

interface AppIconProps {
  size?: number;
  className?: string;
}

export default function AppIcon({ size = 32, className = '' }: AppIconProps) {
  return (
    <div 
      className={`bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <Church className="text-white" style={{ width: size * 0.6, height: size * 0.6 }} />
    </div>
  );
}