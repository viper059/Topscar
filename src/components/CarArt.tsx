import type { Listing } from "@/lib/types";

// Side-view drawing shown until a listing has real photos.
const SHAPES: Record<Listing["body"], [string, string]> = {
  sedan: ["M10 62 L16 49 Q30 44 52 42 L72 29 Q82 25 110 25 L134 27 L156 42 Q182 45 190 52 L192 62 Z", "M76 31 Q84 28 108 28 L130 29 L148 42 L68 42 Z"],
  hatch: ["M12 62 L15 47 Q26 42 48 40 L68 26 Q76 22 122 22 L152 24 L168 44 Q186 47 190 54 L190 62 Z", "M73 28 Q80 25 120 25 L146 26 L159 42 L63 42 Z"],
  suv: ["M10 64 L12 43 Q20 38 44 36 L60 20 Q66 16 132 16 L152 18 L168 36 Q186 40 190 48 L190 64 Z", "M65 22 Q70 19 128 19 L146 21 L159 35 L53 35 Z"],
  pickup: ["M8 64 L8 42 L84 42 L96 21 Q100 17 132 17 L142 19 L158 38 Q182 41 190 48 L192 64 Z", "M101 23 Q104 20 128 20 L138 22 L151 37 L91 37 Z"],
  van: ["M10 64 L10 22 Q12 14 24 14 L148 14 Q160 14 172 30 L186 42 Q192 46 192 56 L192 64 Z", "M20 20 L148 20 Q155 20 163 31 L168 37 L20 37 Z"],
};

export default function CarArt({ l }: { l: Listing }) {
  const [body, glass] = SHAPES[l.body];
  return (
    <svg viewBox="0 0 200 84" role="img" aria-label={`ภาพประกอบ ${l.brand} ${l.model}`} style={{ width: "100%", height: "auto" }}>
      <ellipse cx="100" cy="77" rx="92" ry="4" fill="#0000001f" />
      <path d={body} fill={l.color} stroke="#00000055" />
      <path d={glass} fill="#2c3a47" opacity=".82" />
      <rect x="182" y="49" width="8" height="4" rx="1" fill="#f3d27a" />
      {[48, 152].map((x) => (
        <g key={x}><circle cx={x} cy="64" r="13" fill="#1b1f24" /><circle cx={x} cy="64" r="6" fill="#9aa1a8" /></g>
      ))}
    </svg>
  );
}
