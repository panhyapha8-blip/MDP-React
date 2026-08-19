export default function Border() {
  return (
    <svg viewBox="0 0 700 60" xmlns="http://www.w3.org/2000/svg" width="100%" style={{ display: 'block' }}>
      <line x1="40" y1="30" x2="270" y2="30" stroke="#000" strokeWidth="0.8" />
      <line x1="430" y1="30" x2="660" y2="30" stroke="#000" strokeWidth="0.8" />

      {/* Left ornament */}
      <g transform="translate(285,30)">
        <polygon points="0,-7 6,0 0,7 -6,0" fill="#000" />
        <circle cx="0" cy="0" r="3" fill="#fff" />
        <circle cx="-12" cy="0" r="2.5" fill="#000" />
        <circle cx="12" cy="0" r="2.5" fill="#000" />
      </g>

      {/* Center ornament */}
      <g transform="translate(350,30)">
        <circle cx="0" cy="0" r="9" fill="none" stroke="#000" strokeWidth="0.8" />
        <circle cx="0" cy="0" r="3" fill="#000" />
        <polygon points="0,-5 4,2 -4,2" fill="#000" />
        <polygon points="0,5 4,-2 -4,-2" fill="#000" />
      </g>

      {/* Right ornament */}
      <g transform="translate(415,30)">
        <polygon points="0,-7 6,0 0,7 -6,0" fill="#000" />
        <circle cx="0" cy="0" r="3" fill="#fff" />
        <circle cx="-12" cy="0" r="2.5" fill="#000" />
        <circle cx="12" cy="0" r="2.5" fill="#000" />
      </g>
    </svg>
  );
}
