import type { SVGProps } from "react";

export function ChevronLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 5 8 12l7 7" stroke="currentColor" />
    </svg>
  );
}

export function ChevronRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 5l7 7-7 7" stroke="currentColor" />
    </svg>
  );
}

export function ChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m5 9 7 7 7-7" stroke="currentColor" />
    </svg>
  );
}

export function Close(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" />
    </svg>
  );
}

export function Search(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" />
      <path d="m20 20-4.6-4.6" stroke="currentColor" />
    </svg>
  );
}

export function Stamp(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m5 13 4 4L19 7" stroke="currentColor" />
    </svg>
  );
}

/** Cog with eight evenly spaced teeth. */
export function Gear(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path
        d="M10.51 2.62A9.5 9.5 0 0 1 13.49 2.62L13.55 5.28A6.9 6.9 0 0 1 15.66 6.15L17.58 4.31A9.5 9.5 0 0 1 19.69 6.42L17.85 8.34A6.9 6.9 0 0 1 18.72 10.45L21.38 10.51A9.5 9.5 0 0 1 21.38 13.49L18.72 13.55A6.9 6.9 0 0 1 17.85 15.66L19.69 17.58A9.5 9.5 0 0 1 17.58 19.69L15.66 17.85A6.9 6.9 0 0 1 13.55 18.72L13.49 21.38A9.5 9.5 0 0 1 10.51 21.38L10.45 18.72A6.9 6.9 0 0 1 8.34 17.85L6.42 19.69A9.5 9.5 0 0 1 4.31 17.58L6.15 15.66A6.9 6.9 0 0 1 5.28 13.55L2.62 13.49A9.5 9.5 0 0 1 2.62 10.51L5.28 10.45A6.9 6.9 0 0 1 6.15 8.34L4.31 6.42A9.5 9.5 0 0 1 6.42 4.31L8.34 6.15A6.9 6.9 0 0 1 10.45 5.28L10.51 2.62Z"
        stroke="currentColor"
      />
      <circle cx="12" cy="12" r="3.1" stroke="currentColor" />
    </svg>
  );
}

export function Alert(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" />
      <path d="M12 7.5v5.5M12 16.5h.01" stroke="currentColor" />
    </svg>
  );
}

/** Clipboard with a tick — the test. */
export function Quiz(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path
        d="M9 4.6H7.6A1.6 1.6 0 0 0 6 6.2v12.2A1.6 1.6 0 0 0 7.6 20h8.8a1.6 1.6 0 0 0 1.6-1.6V6.2A1.6 1.6 0 0 0 16.4 4.6H15"
        stroke="currentColor"
      />
      <rect x="9" y="3" width="6" height="3.2" rx="1.1" stroke="currentColor" />
      <path d="m9.2 13 1.9 1.9L15 11" stroke="currentColor" />
    </svg>
  );
}

/** A circled cross, for a wrong answer in the review. */
export function Cross(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" />
      <path d="m9 9 6 6M15 9l-6 6" stroke="currentColor" />
    </svg>
  );
}

/** A circled tick, for a right answer in the review. */
export function Check(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" />
      <path d="m8.2 12.2 2.6 2.6 5-5.4" stroke="currentColor" />
    </svg>
  );
}

/** Circular arrow — retake the test. */
export function Refresh(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 12a8 8 0 1 1-2.5-5.8" stroke="currentColor" />
      <path d="M20 4v4.5h-4.5" stroke="currentColor" />
    </svg>
  );
}
