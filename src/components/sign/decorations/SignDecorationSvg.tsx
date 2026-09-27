import type { DecorationTypeId } from "@/types/signDesign";
import type { SVGProps } from "react";

type SignDecorationSvgProps = SVGProps<SVGSVGElement> & {
  type: DecorationTypeId;
};

const svgBase = {
  viewBox: "0 0 24 24",
  "aria-hidden": true as const,
  color: "currentColor",
};

/** Owned SVG paths — color via CSS `color` / currentColor on parent. */
export function SignDecorationSvg({ type, ...props }: SignDecorationSvgProps) {
  switch (type) {
    case "heart":
      return (
        <svg {...svgBase} fill="currentColor" {...props}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    case "star":
      return (
        <svg {...svgBase} fill="currentColor" {...props}>
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      );
    case "paw":
      return (
        <svg {...svgBase} fill="currentColor" {...props}>
          <ellipse cx="7" cy="9" rx="2.2" ry="2.5" />
          <ellipse cx="12" cy="7" rx="2.2" ry="2.5" />
          <ellipse cx="17" cy="9" rx="2.2" ry="2.5" />
          <ellipse cx="9.5" cy="13" rx="2" ry="2.3" />
          <ellipse cx="14.5" cy="13" rx="2" ry="2.3" />
          <path d="M8 16c0 3 1.8 5 4 5s4-2 4-5c0-2.5-1.5-4-4-4s-4 1.5-4 4z" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...svgBase} fill="currentColor" {...props}>
          <path d="M17 3C10 3 5 8 5 14c0 2.2 1.8 4 4 4 1.2 0 2.3-.5 3.1-1.4.8.9 1.9 1.4 3.1 1.4 2.2 0 4-1.8 4-4 0-6-5-11-12-11zm-1 14.5c-.6.6-1.4 1-2.2 1-.9 0-1.7-.4-2.3-1.1.6-.7 1.4-1.1 2.3-1.1.8 0 1.6.4 2.2 1.2z" />
        </svg>
      );
    case "flower":
      return (
        <svg {...svgBase} fill="currentColor" {...props}>
          <circle cx="12" cy="12" r="2.5" />
          <ellipse cx="12" cy="6.5" rx="2.2" ry="3" />
          <ellipse cx="12" cy="17.5" rx="2.2" ry="3" />
          <ellipse cx="6.5" cy="12" rx="3" ry="2.2" />
          <ellipse cx="17.5" cy="12" rx="3" ry="2.2" />
          <ellipse cx="8.2" cy="8.2" rx="2.2" ry="2.8" transform="rotate(-45 8.2 8.2)" />
          <ellipse cx="15.8" cy="8.2" rx="2.2" ry="2.8" transform="rotate(45 15.8 8.2)" />
          <ellipse cx="8.2" cy="15.8" rx="2.2" ry="2.8" transform="rotate(45 8.2 15.8)" />
          <ellipse cx="15.8" cy="15.8" rx="2.2" ry="2.8" transform="rotate(-45 15.8 15.8)" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...svgBase} fill="currentColor" {...props}>
          <path d="M12 2l1.4 5.2L18.5 9 13.4 10.4 12 15.5 10.6 10.4 5.5 9l5.1-1.8L12 2zm7 11l.9 3.2 3.2.9-3.2.9-.9 3.2-.9-3.2-3.2-.9 3.2-.9.9-3.2zM5 14l.7 2.5 2.5.7-2.5.7-.7 2.5-.7-2.5-2.5-.7 2.5-.7.7-2.5z" />
        </svg>
      );
    case "house":
      return (
        <svg {...svgBase} fill="currentColor" {...props}>
          <path d="M12 3L2 12h3v9h6v-6h2v6h6v-9h3L12 3z" />
        </svg>
      );
    case "sun":
      return (
        <svg {...svgBase} fill="currentColor" {...props}>
          <circle cx="12" cy="12" r="4" />
          <path
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          />
        </svg>
      );
    default:
      return null;
  }
}
