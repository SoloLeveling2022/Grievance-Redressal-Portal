import * as React from "react";

export const BicepsFlexed = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Biceps flexed arm icon (simple version) */}
    <path d="M4 17c0-2 2-4 4-4h2c2 0 4 2 4 4v1a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3v-1z" />
    <path d="M8 13V7a4 4 0 0 1 8 0v6" />
    <path d="M16 13c1.5 0 3-1.5 3-3V7" />
  </svg>
);
