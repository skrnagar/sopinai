interface SopinLogoProps {
  className?: string;
  showWordmark?: boolean;
  purpleDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const PRONG_ANGLES = [0, 60, 120, 180, 240, 300];

export function SopinLogo({
  className = '',
  showWordmark = true,
  purpleDot = true,
  size = 'md',
}: SopinLogoProps) {
  const heightMap = {
    sm: 24,
    md: 32,
    lg: 42,
  };
  const h = heightMap[size];

  return (
    <span className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* 6-Prong Radial U-Architecture Emblem (preserved from brand reference) */}
      <svg
        height={h}
        width={h}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {PRONG_ANGLES.map((angle) => (
          <path
            key={angle}
            d="M 35.5 4 L 39.2 26 A 10.8 10.8 0 0 0 60.8 26 L 64.5 4 L 53.5 4 L 53.5 24.5 A 3.5 3.5 0 0 1 46.5 24.5 L 46.5 4 Z"
            fill="currentColor"
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
      </svg>

      {/* Monoline Geometric "Sopin" Wordmark with balanced x-height & optical spacing */}
      {showWordmark && (
        <svg
          height={h * 1.08}
          viewBox="0 0 202 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="SOPIN"
          role="img"
        >
          {/* S */}
          <path
            d="M 43.5 24.5 C 39.2 19.2 32.8 17 25.5 17 C 15.6 17 9.2 22.5 9.2 30.2 C 9.2 38.2 16 42 25.8 45.8 C 36.2 49.8 44.2 53.6 44.2 62.2 C 44.2 70 36 75 25.2 75 C 15.8 75 9.2 70.6 5.5 63.8"
            stroke="currentColor"
            strokeWidth="4.6"
            strokeLinecap="butt"
          />

          {/* o */}
          <ellipse
            cx="75"
            cy="55.5"
            rx="16.4"
            ry="19.5"
            stroke="currentColor"
            strokeWidth="4.6"
          />

          {/* p */}
          <line
            x1="101.5"
            y1="52"
            x2="101.5"
            y2="92"
            stroke="currentColor"
            strokeWidth="4.6"
            strokeLinecap="butt"
          />
          <ellipse
            cx="117.9"
            cy="55.5"
            rx="16.4"
            ry="19.5"
            stroke="currentColor"
            strokeWidth="4.6"
          />

          {/* i */}
          <line
            x1="147.5"
            y1="36"
            x2="147.5"
            y2="75"
            stroke="currentColor"
            strokeWidth="4.6"
            strokeLinecap="butt"
          />
          <circle
            cx="147.5"
            cy="20"
            r="3.9"
            fill={purpleDot ? '#965BFF' : 'currentColor'}
          />

          {/* n */}
          <path
            d="M 161.5 75 V 54 A 15.5 18 0 0 1 192.5 54 V 75"
            stroke="currentColor"
            strokeWidth="4.6"
            strokeLinecap="butt"
          />
        </svg>
      )}
    </span>
  );
}
