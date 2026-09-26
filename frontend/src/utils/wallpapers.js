export const svgToDataUri = (svgString) => {
  return `data:image/svg+xml,${encodeURIComponent(svgString.trim())}`;
};

export const techDoodlesSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" opacity="0.05">
  <g fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- Code Brackets -->
    <path d="M 50 50 L 30 70 L 50 90" />
    <path d="M 70 50 L 90 70 L 70 90" />
    
    <!-- Curly Braces -->
    <path d="M 320 60 C 300 60 300 70 290 80 C 300 90 300 100 320 100" />
    <path d="M 340 60 C 360 60 360 70 370 80 C 360 90 360 100 340 100" />

    <!-- Terminal/Command Prompt -->
    <path d="M 40 250 L 60 270 L 40 290" />
    <line x1="70" y1="290" x2="100" y2="290" />

    <!-- Cloud/Server -->
    <rect x="250" y="240" width="80" height="60" rx="5" />
    <line x1="250" y1="260" x2="330" y2="260" />
    <line x1="250" y1="280" x2="330" y2="280" />
    <circle cx="270" cy="250" r="2" fill="#ffffff" />
    <circle cx="270" cy="270" r="2" fill="#ffffff" />
    <circle cx="270" cy="290" r="2" fill="#ffffff" />

    <!-- Database Cylinder -->
    <ellipse cx="150" cy="150" rx="30" ry="10" />
    <path d="M 120 150 L 120 190 A 30 10 0 0 0 180 190 L 180 150" />
    <path d="M 120 170 A 30 10 0 0 0 180 170" />

    <!-- API Connection -->
    <circle cx="100" cy="350" r="8" />
    <circle cx="160" cy="350" r="8" />
    <line x1="108" y1="350" x2="152" y2="350" />
    <path d="M 130 345 L 135 350 L 130 355" />

    <!-- Circuit/Node -->
    <circle cx="350" cy="350" r="6" />
    <line x1="350" y1="344" x2="350" y2="320" />
    <line x1="350" y1="320" x2="320" y2="320" />
    <circle cx="314" cy="320" r="6" />
    
    <!-- Bug/Insect (Debugging) -->
    <path d="M 180 60 A 10 15 0 0 1 200 60 A 10 15 0 0 1 180 60" />
    <line x1="190" y1="45" x2="190" y2="75" />
    <line x1="180" y1="50" x2="170" y2="45" />
    <line x1="200" y1="50" x2="210" y2="45" />
    <line x1="180" y1="60" x2="165" y2="60" />
    <line x1="200" y1="60" x2="215" y2="60" />
    <line x1="180" y1="70" x2="170" y2="75" />
    <line x1="200" y1="70" x2="210" y2="75" />

    <!-- Binary / Matrix feeling -->
    <text x="220" y="100" font-family="monospace" font-size="12" stroke="none" fill="#ffffff" opacity="0.5">01</text>
    <text x="240" y="80" font-family="monospace" font-size="12" stroke="none" fill="#ffffff" opacity="0.5">10</text>
    <text x="50" y="180" font-family="monospace" font-size="12" stroke="none" fill="#ffffff" opacity="0.5">11</text>
    
    <!-- Wifi/Signal -->
    <path d="M 270 170 A 20 20 0 0 1 310 170" />
    <path d="M 280 180 A 10 10 0 0 1 300 180" />
    <circle cx="290" cy="190" r="2" fill="#ffffff" />
    
    <!-- Branch/Git -->
    <circle cx="50" cy="130" r="5" />
    <circle cx="50" cy="160" r="5" />
    <circle cx="70" cy="145" r="5" />
    <line x1="50" y1="135" x2="50" y2="155" />
    <path d="M 50 135 C 50 145 70 135 70 140" />
  </g>
</svg>
`;

// These colors loosely match WhatsApp's dark solid colors
export const wallpaperColors = [
  '#0b141a', // WhatsApp dark default
  '#1e2b3c', // DevSup dark blue
  '#000000', // Pitch black
  '#202c33', // WhatsApp lighter dark
  '#111b21', // WhatsApp darker variant
  '#273443', // Slate dark
  '#1b262c', // Navy dark
  '#3a4a58', // Slate medium
  '#4a3f35', // Warm dark
  '#2a3b32', // Forest dark
  '#301f2e', // Plum dark
  '#3d2929', // Maroon dark
  '#162127', // Deep teal
  '#222e35', // Muted slate
  '#091014', // Almost black
  '#2f3b4c', // Blue slate
  '#4a5568', // Gray 600
  '#2d3748', // Gray 700
  '#1a202c', // Gray 800
  '#171923', // Gray 900
];
