interface LogoProps {
  height?: number;
  className?: string;
}

export function Logo({ height = 28, className = "" }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/synqlogo.png"
      alt="SoloSynq.ai"
      style={{ height, width: "auto" }}
      className={`flex-shrink-0 block ${className}`.trim()}
    />
  );
}
