/** Placeholder monogram until the approved BOSS monogram is supplied (D01, CLAUDE.md section 12). */
export function Monogram({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <circle cx="24" cy="24" r="22.5" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
      <text x="24" y="31" textAnchor="middle" fontFamily="var(--font-display)" fontSize="21" fontWeight="600" fill="currentColor">
        B
      </text>
    </svg>
  );
}
