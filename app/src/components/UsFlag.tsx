// A small, flat (non-waving) US flag mark. Real flag colors; 13 stripes, blue
// canton with a simplified star field (readable at footer size).
export function UsFlag({ className = "" }: { className?: string }) {
  const stripe = 20 / 13;
  const redStripes = [0, 2, 4, 6, 8, 10, 12];
  const stars = Array.from({ length: 20 }, (_, i) => ({
    cx: 2 + (i % 5) * 2.6,
    cy: 1.7 + Math.floor(i / 5) * 2.5,
  }));
  return (
    <svg viewBox="0 0 38 20" className={className} role="img" aria-label="United States">
      <rect width="38" height="20" fill="#fff" />
      <g fill="#B22234">
        {redStripes.map((i) => (
          <rect key={i} y={i * stripe} width="38" height={stripe} />
        ))}
      </g>
      <rect width="15.2" height={7 * stripe} fill="#3C3B6E" />
      <g fill="#fff">
        {stars.map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r="0.6" />
        ))}
      </g>
    </svg>
  );
}
