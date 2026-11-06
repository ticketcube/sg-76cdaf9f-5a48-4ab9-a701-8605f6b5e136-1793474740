import { ReactNode } from "react";

interface MapOverlayManagerProps {
  children: ReactNode;
  width: number;
  height: number;
}

export function MapOverlayManager({ children, width, height }: MapOverlayManagerProps) {
  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{ width, height }}
    >
      <svg
        width={width}
        height={height}
        className="absolute inset-0"
        style={{ overflow: "visible" }}
      >
        {children}
      </svg>
    </div>
  );
}