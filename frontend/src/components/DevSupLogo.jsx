export default function DevSupLogo({ size = 48, className, style, glow = true, strokeWidth = 14 }) {
  const width = size;
  const height = (size * 100) / 120;
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 120 100" 
      width={width} 
      height={height} 
      stroke="var(--colors-accent, #06b6d4)" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      fill="none"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        filter: glow ? 'drop-shadow(0 0 14px rgba(6, 182, 212, 0.55))' : undefined,
        ...style
      }}
    >
      <path d="M 35 25 L 10 50 L 35 75" />
      <path d="M 70 15 L 50 85" />
      <path d="M 85 25 L 110 50 L 85 75" />
    </svg>
  );
}

