import { ReactNode } from "react";

interface MapOverlayManagerProps {
  children: ReactNode;
  width: number;
  height: number;
}

export function MapOverlayManager({ children, width, height }: MapOverlayManagerProps) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ overflow: "visible" }}
    >
      {children}
    </svg>
  );
}