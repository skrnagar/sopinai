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
      {/* 6-Prong Radial Geometric Emblem */}
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
            d="M 35.8 5 L 38.5 25 A 11.5 11.5 0 0 0 61.5 25 L 64.2 5 L 54.4 5 L 54.4 25 A 4.4 4.4 0 0 1 45.6 25 L 45.6 5 Z"
            fill="currentColor"
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
      </svg>

      {/* Monoline Geometric "Sopin" Wordmark */}
      {showWordmark && (
        <svg
          height={h * 1.04}
          viewBox="0 0 206 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="SOPIN"
          role="img"
        >
          {/* S */}
          <path
            d="M 40.5 22.5 C 36.5 16.5 30.5 14 23.5 14 C 14.5 14 8.5 19.5 8.5 26.8 C 8.5 34.5 15.2 38.2 24.5 41.8 C 34.5 45.6 42.5 49.8 42.5 58.6 C 42.5 66.8 34.8 72.5 24.2 72.5 C 15.5 72.5 9.2 68.5 5.5 62.2"
            stroke="currentColor"
            strokeWidth="4.4"
            strokeLinecap="butt"
          />

          {/* o */}
          <ellipse
            cx="71"
            cy="54"
            rx="17.5"
            ry="18.5"
            stroke="currentColor"
            strokeWidth="4.4"
          />

          {/* p */}
          <line
            x1="101.5"
            y1="35.5"
            x2="101.5"
            y2="90"
            stroke="currentColor"
            strokeWidth="4.4"
            strokeLinecap="butt"
          />
          <ellipse
            cx="119"
            cy="54"
            rx="17.5"
            ry="18.5"
            stroke="currentColor"
            strokeWidth="4.4"
          />

          {/* i */}
          <line
            x1="149"
            y1="36.5"
            x2="149"
            y2="72.5"
            stroke="currentColor"
            strokeWidth="4.4"
            strokeLinecap="butt"
          />
          <circle
            cx="149"
            cy="20"
            r="3.8"
            fill={purpleDot ? '#965BFF' : 'currentColor'}
          />

          {/* n */}
          <path
            d="M 163 72.5 V 54 A 18 18.5 0 0 1 199 54 V 72.5"
            stroke="currentColor"
            strokeWidth="4.4"
            strokeLinecap="butt"
          />
        </svg>
      )}
    </span>
  );
}
