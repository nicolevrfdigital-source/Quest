import type { ReactNode } from 'react';

/**
 * Hand-drawn sticker art. Every sticker is a 64×64 SVG with a soft ink outline;
 * the white die-cut border and shadow come from the `.sticker` CSS class.
 * To add more, append to STICKERS — earned stickers keep their place in the book.
 */

const INK = '#3d3833';
const BLUSH = '#f4a6a0';

function Face({ x, y, s = 1, eyes = INK }: { x: number; y: number; s?: number; eyes?: string }) {
  return (
    <g>
      <circle cx={x - 5 * s} cy={y} r={1.9 * s} fill={eyes} stroke="none" />
      <circle cx={x + 5 * s} cy={y} r={1.9 * s} fill={eyes} stroke="none" />
      <path d={`M${x - 2.6 * s} ${y + 3 * s} Q${x} ${y + 5.6 * s} ${x + 2.6 * s} ${y + 3 * s}`} fill="none" strokeWidth={1.8 * s} />
      <ellipse cx={x - 9 * s} cy={y + 3 * s} rx={2.6 * s} ry={1.7 * s} fill={BLUSH} opacity={0.75} stroke="none" />
      <ellipse cx={x + 9 * s} cy={y + 3 * s} rx={2.6 * s} ry={1.7 * s} fill={BLUSH} opacity={0.75} stroke="none" />
    </g>
  );
}

export interface StickerDef {
  name: string;
  art: ReactNode;
}

const rays = Array.from({ length: 8 }, (_, k) => {
  const a = (k * Math.PI) / 4;
  return `M${32 + 20 * Math.cos(a)} ${32 + 20 * Math.sin(a)} L${32 + 27 * Math.cos(a)} ${32 + 27 * Math.sin(a)}`;
}).join(' ');

const arc = (r: number) => `M${32 - r} 46 A${r} ${r} 0 0 1 ${32 + r} 46`;

export const STICKERS: readonly StickerDef[] = [
  {
    name: 'Sunny',
    art: (
      <>
        <path d={rays} strokeWidth={3.2} />
        <circle cx="32" cy="32" r="16" fill="#fbd96a" />
        <Face x={32} y={31} />
      </>
    ),
  },
  {
    name: 'Cloud nap',
    art: (
      <>
        <path d="M18 47h28a9.5 9.5 0 0 0 1.5-18.9A13.5 13.5 0 0 0 22 25.4 10.8 10.8 0 0 0 18 47Z" fill="#e3eefa" />
        <path d="M24.5 36q2 1.6 4 0M35.5 36q2 1.6 4 0" fill="none" strokeWidth={1.8} />
        <ellipse cx="22.5" cy="40" rx="2.6" ry="1.7" fill={BLUSH} opacity={0.75} stroke="none" />
        <ellipse cx="41.5" cy="40" rx="2.6" ry="1.7" fill={BLUSH} opacity={0.75} stroke="none" />
      </>
    ),
  },
  {
    name: 'Rainbow',
    art: (
      <>
        <path d={arc(21)} fill="none" stroke="#f4a6a0" strokeWidth={6.5} strokeLinecap="butt" />
        <path d={arc(14.5)} fill="none" stroke="#fbd96a" strokeWidth={6.5} strokeLinecap="butt" />
        <path d={arc(8)} fill="none" stroke="#a9c4a1" strokeWidth={6.5} strokeLinecap="butt" />
        <path d="M5 50a6 6 0 0 1 4-9.5 7 7 0 0 1 12 1 5 5 0 0 1-1 8.5Z" fill="#fff" />
        <path d="M43 50a6 6 0 0 1 4-9.5 7 7 0 0 1 12 1 5 5 0 0 1-1 8.5Z" fill="#fff" />
      </>
    ),
  },
  {
    name: 'Big heart',
    art: (
      <>
        <path d="M32 53C15 42 8 32 11.5 23 15.5 13 27 13.5 32 21.5 37 13.5 48.5 13 52.5 23 56 32 49 42 32 53Z" fill="#f7a8b8" />
        <Face x={32} y={31} s={0.9} />
      </>
    ),
  },
  {
    name: 'Gold star',
    art: (
      <>
        <path
          d="M32 9.5 38.8 24.7 54.8 26.6 42.9 37.6 46.1 53.4 32 45.5 17.9 53.4 21.1 37.6 9.2 26.6 25.2 24.7Z"
          fill="#fbd96a"
          strokeWidth={2.6}
        />
        <Face x={32} y={35} s={0.75} />
      </>
    ),
  },
  {
    name: 'Sleepy moon',
    art: (
      <>
        <path d="M38 9A23 23 0 1 0 55 41 18 18 0 0 1 38 9Z" fill="#fbe7a1" />
        <path d="M20 34q2 1.6 4 0" fill="none" strokeWidth={1.8} />
        <ellipse cx="18" cy="39" rx="2.6" ry="1.7" fill={BLUSH} opacity={0.75} stroke="none" />
        <path d="M50 12v6M47 15h6M54 25v4M52 27h4" strokeWidth={2} />
      </>
    ),
  },
  {
    name: 'Daisy',
    art: (
      <>
        {Array.from({ length: 8 }, (_, k) => (
          <ellipse key={k} cx="32" cy="16.5" rx="6.5" ry="10" fill="#fff" transform={`rotate(${k * 45} 32 32)`} />
        ))}
        <circle cx="32" cy="32" r="9.5" fill="#fbd96a" />
        <Face x={32} y={31} s={0.6} />
      </>
    ),
  },
  {
    name: 'Tulip',
    art: (
      <>
        <path d="M32 38v18" stroke="#5f8459" strokeWidth={3} />
        <path d="M32 52c-10-1-14-8-12.5-13 7 1.5 11.5 6 12.5 13Z" fill="#a9c4a1" />
        <path d="M32 50c8-.5 11.5-6 10.5-10.5-6 1-9.5 5-10.5 10.5Z" fill="#a9c4a1" />
        <path d="M20 16l6.5 6L32 12l5.5 10 6.5-6v13c0 8-5.5 13-12 13s-12-5-12-13Z" fill="#f7a8b8" />
        <Face x={32} y={30} s={0.6} />
      </>
    ),
  },
  {
    name: 'Cactus pal',
    art: (
      <>
        <path d="M26 34h-5a5 5 0 0 1-5-5v-7a3 3 0 0 1 6 0v5h4" fill="#a9c4a1" />
        <path d="M38 28h5v-5a3 3 0 0 1 6 0v6a5 5 0 0 1-5 5h-6" fill="#a9c4a1" />
        <rect x="25" y="11" width="14" height="33" rx="7" fill="#a9c4a1" />
        <Face x={32} y={24} s={0.55} />
        <path d="M21 44h22l-3 12H24Z" fill="#e8a87c" />
        <rect x="18.5" y="40" width="27" height="6" rx="2" fill="#f2bf9b" />
      </>
    ),
  },
  {
    name: 'Mushroom',
    art: (
      <>
        <path d="M25 37h14l2 15a3 3 0 0 1-3 3.5H26a3 3 0 0 1-3-3.5Z" fill="#fdf3e1" />
        <path d="M8 37C8 20 20 10 32 10s24 10 24 27c0 3-2 4-6 4H14c-4 0-6-1-6-4Z" fill="#f08a7e" />
        <circle cx="20" cy="25" r="4" fill="#fff" stroke="none" />
        <circle cx="34" cy="18" r="3.5" fill="#fff" stroke="none" />
        <circle cx="45" cy="28" r="4" fill="#fff" stroke="none" />
        <circle cx="31" cy="32" r="2.5" fill="#fff" stroke="none" />
        <Face x={32} y={46} s={0.55} />
      </>
    ),
  },
  {
    name: 'Strawberry',
    art: (
      <>
        <path d="M32 56C18 50 10 38 12 28c2-8 10-10 20-8 10-2 18 0 20 8 2 10-6 22-20 28Z" fill="#f2737b" />
        {[
          [20, 30], [44, 30], [24, 44], [40, 44], [32, 50], [18, 38], [46, 38],
        ].map(([x, y]) => (
          <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="1.2" ry="1.8" fill="#fde9a8" stroke="none" />
        ))}
        <path d="M20 21l6-3-2-6 6 3 2-6 2 6 6-3-2 6 6 3-12 3Z" fill="#8fbf7f" />
        <Face x={32} y={35} s={0.8} />
      </>
    ),
  },
  {
    name: 'Cherry twins',
    art: (
      <>
        <path d="M22 38C24 27 30 17 40 10M42 40c0-12-1-21-2-30" fill="none" stroke="#5f8459" strokeWidth={2.6} />
        <path d="M40 10c6-4 13-3 16 1-5 4-12 4-16-1Z" fill="#a9c4a1" />
        <circle cx="21" cy="44" r="10" fill="#e85d6a" />
        <circle cx="43" cy="46" r="10" fill="#e85d6a" />
        <ellipse cx="17" cy="40" rx="2.2" ry="3" fill="#fff" opacity={0.8} stroke="none" />
        <ellipse cx="39" cy="42" rx="2.2" ry="3" fill="#fff" opacity={0.8} stroke="none" />
        <Face x={22} y={46} s={0.5} />
        <Face x={44} y={48} s={0.5} />
      </>
    ),
  },
  {
    name: 'Avocado',
    art: (
      <>
        <path d="M32 8c10 0 16 12 18 24 3 14-6 24-18 24S11 46 14 32c2-12 8-24 18-24Z" fill="#6f9a5a" />
        <path d="M32 13c8 0 12 10 14 20 2 12-5 19-14 19s-16-7-14-19c2-10 6-20 14-20Z" fill="#dcedb2" stroke="none" />
        <circle cx="32" cy="38" r="8.5" fill="#b27a4f" />
        <Face x={32} y={37} s={0.5} eyes="#fff" />
      </>
    ),
  },
  {
    name: 'Orange slice',
    art: (
      <>
        <circle cx="32" cy="32" r="23" fill="#f6a64a" />
        <circle cx="32" cy="32" r="18.5" fill="#fcd38a" stroke="none" />
        {Array.from({ length: 6 }, (_, k) => {
          const a = (k * Math.PI) / 3;
          return (
            <path key={k} d={`M32 32L${32 + 18 * Math.cos(a)} ${32 + 18 * Math.sin(a)}`} stroke="#f6a64a" strokeWidth={2.4} />
          );
        })}
        <circle cx="32" cy="32" r="3" fill="#fdf3e1" stroke="none" />
      </>
    ),
  },
  {
    name: 'Watermelon',
    art: (
      <g transform="translate(0 6)">
        <path d="M7 22a25 25 0 0 0 50 0Z" fill="#8fbf7f" />
        <path d="M12 22a20 20 0 0 0 40 0Z" fill="#f58a8f" stroke="none" />
        <path d="M7 22h50" />
        {[
          [22, 30], [42, 30], [32, 38], [18, 25], [46, 25],
        ].map(([x, y]) => (
          <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="1.3" ry="2" fill={INK} stroke="none" />
        ))}
        <Face x={32} y={27} s={0.6} />
      </g>
    ),
  },
  {
    name: 'Ice cream',
    art: (
      <>
        <path d="M20 33l12 25 12-25Z" fill="#f2c37f" />
        <path d="M25 38l10 9M30 36l9 8M24 44l8-7M28 50l9-11" stroke="#d9a35c" strokeWidth={1.6} />
        <path d="M18 35c-4 0-5-6-2-9-1-9 7-15 16-15s17 6 16 15c3 3 2 9-2 9Z" fill="#f7b6c8" />
        <circle cx="32" cy="9" r="4" fill="#e85d6a" />
        <Face x={32} y={25} s={0.7} />
      </>
    ),
  },
  {
    name: 'Cupcake',
    art: (
      <>
        <path d="M17 36h30l-4 20H21Z" fill="#a8c8e8" />
        <path d="M25 37l1.5 18M32 37v18M39 37l-1.5 18" stroke="#7fa6cf" strokeWidth={1.6} />
        <path d="M14 37c-4 0-4-7 1-8-2-7 5-11 10-9 2-7 12-7 14 0 5-2 12 2 10 9 5 1 5 8 1 8Z" fill="#d9cdf0" />
        <path d="M22 24l2 2M40 21l-1 3M44 29l2-1M28 18l1 2" stroke="#f2737b" strokeWidth={2} />
        <Face x={32} y={45} s={0.6} />
      </>
    ),
  },
  {
    name: 'Cozy mug',
    art: (
      <>
        <path d="M22 15c-2-3 2-5 0-8M30 15c-2-3 2-5 0-8M38 15c-2-3 2-5 0-8" fill="none" stroke="#b9ab9a" strokeWidth={2} />
        <path d="M44 27h4a6.5 6.5 0 0 1 0 13h-4" fill="none" strokeWidth={3} />
        <path d="M13 20h32v24a9 9 0 0 1-9 9H22a9 9 0 0 1-9-9Z" fill="#f5c3a5" />
        <Face x={29} y={34} s={0.8} />
      </>
    ),
  },
  {
    name: 'Kitty',
    art: (
      <>
        <path d="M13 32l2-21 13 11ZM51 32l-2-21-13 11Z" fill="#fbe7a1" />
        <path d="M17 19l1-5 5 5ZM47 19l-1-5-5 5Z" fill="#f7a8b8" stroke="none" />
        <ellipse cx="32" cy="37" rx="20" ry="16.5" fill="#fbe7a1" />
        <path d="M8 36l8 1M8 42l8-2M56 36l-8 1M56 42l-8-2" strokeWidth={1.6} />
        <Face x={32} y={36} />
      </>
    ),
  },
  {
    name: 'Bunny',
    art: (
      <>
        <ellipse cx="24" cy="17" rx="5.5" ry="13" fill="#fdf3e1" transform="rotate(-8 24 17)" />
        <ellipse cx="40" cy="17" rx="5.5" ry="13" fill="#fdf3e1" transform="rotate(8 40 17)" />
        <ellipse cx="24" cy="18" rx="2.2" ry="8" fill="#f7a8b8" stroke="none" transform="rotate(-8 24 18)" />
        <ellipse cx="40" cy="18" rx="2.2" ry="8" fill="#f7a8b8" stroke="none" transform="rotate(8 40 18)" />
        <circle cx="32" cy="41" r="16" fill="#fdf3e1" />
        <Face x={32} y={40} />
      </>
    ),
  },
  {
    name: 'Froggy',
    art: (
      <>
        <circle cx="21" cy="22" r="8" fill="#9ccc85" />
        <circle cx="43" cy="22" r="8" fill="#9ccc85" />
        <ellipse cx="32" cy="38" rx="22" ry="16" fill="#9ccc85" />
        <circle cx="21" cy="22" r="4.5" fill="#fff" stroke="none" />
        <circle cx="43" cy="22" r="4.5" fill="#fff" stroke="none" />
        <circle cx="21.5" cy="22.5" r="2.2" fill={INK} stroke="none" />
        <circle cx="43.5" cy="22.5" r="2.2" fill={INK} stroke="none" />
        <path d="M22 38q10 8 20 0" fill="none" strokeWidth={2} />
        <ellipse cx="15" cy="38" rx="3" ry="2" fill={BLUSH} opacity={0.8} stroke="none" />
        <ellipse cx="49" cy="38" rx="3" ry="2" fill={BLUSH} opacity={0.8} stroke="none" />
      </>
    ),
  },
  {
    name: 'Whale hello',
    art: (
      <>
        <path d="M27 18c-1-4-4-6-7-6M30 17c0-4 2-7 5-8" fill="none" stroke="#8fb4e0" strokeWidth={2.4} />
        <path d="M49 35c4-4 7-8 9-13-1 8 1 14-1 18-3-2-5-2-8-2Z" fill="#8fb4e0" />
        <path d="M7 36c0-12 12-18 24-16 12 2 18 10 20 16 2 6-6 14-20 14S7 46 7 36Z" fill="#8fb4e0" />
        <path d="M9 40c6 6 16 9 30 6" fill="none" stroke="#c9dcf2" strokeWidth={2.4} />
        <Face x={22} y={33} s={0.8} />
      </>
    ),
  },
  {
    name: 'Snail',
    art: (
      <>
        <path d="M13 31l-3-9M17 31l2-9" fill="none" strokeWidth={2} />
        <circle cx="10" cy="21" r="2" fill={INK} stroke="none" />
        <circle cx="19" cy="21" r="2" fill={INK} stroke="none" />
        <path d="M10 52c-4 0-4-6-2-12 1-6 4-10 7-10 4 0 5 6 5 14h31a4 4 0 0 1 0 8Z" fill="#fbe7a1" />
        <circle cx="36" cy="33" r="15" fill="#f5c3a5" />
        <path d="M36 33a3 3 0 1 1 3 3 6 6 0 1 1-6-6 9 9 0 1 1-8 9" fill="none" stroke="#c8724a" strokeWidth={2.2} />
        <circle cx="13.5" cy="37" r="1.7" fill={INK} stroke="none" />
        <path d="M12 42q2 1.5 4 0" fill="none" strokeWidth={1.6} />
      </>
    ),
  },
  {
    name: 'Busy bee',
    art: (
      <>
        <ellipse cx="27" cy="19" rx="7" ry="9.5" fill="#e3eefa" transform="rotate(-20 27 19)" />
        <ellipse cx="39" cy="19" rx="7" ry="9.5" fill="#e3eefa" transform="rotate(20 39 19)" />
        <path d="M50 36l7-1-6 5" fill={INK} />
        <ellipse cx="32" cy="36" rx="19" ry="14" fill="#fbd96a" />
        <path d="M32 22.5q-3 13.5 0 27M41 24.5q-3 11.5 0 23" fill="none" strokeWidth={4} />
        <Face x={21} y={35} s={0.65} />
      </>
    ),
  },
  {
    name: 'Ladybug',
    art: (
      <>
        <path d="M27 14l-4-6M37 14l4-6" fill="none" strokeWidth={2} />
        <circle cx="32" cy="20" r="9" fill={INK} />
        <circle cx="32" cy="38" r="18" fill="#ef5f63" />
        <path d="M32 21v35" strokeWidth={2} />
        <circle cx="23" cy="33" r="3.5" fill={INK} stroke="none" />
        <circle cx="41" cy="33" r="3.5" fill={INK} stroke="none" />
        <circle cx="24" cy="46" r="3" fill={INK} stroke="none" />
        <circle cx="40" cy="46" r="3" fill={INK} stroke="none" />
        <circle cx="28.5" cy="17" r="1.6" fill="#fff" stroke="none" />
        <circle cx="35.5" cy="17" r="1.6" fill="#fff" stroke="none" />
      </>
    ),
  },
  {
    name: 'Little sprout',
    art: (
      <>
        <path d="M32 44V30" stroke="#5f8459" strokeWidth={3} />
        <path d="M32 33c-10 2-20-4-20-14 12-2 19 4 20 14Z" fill="#a9c4a1" />
        <path d="M32 30c2-12 12-18 22-16 0 12-10 18-22 16Z" fill="#8fbf7f" />
        <path d="M20 44h24l-3 14H23Z" fill="#e8a87c" />
        <Face x={32} y={50} s={0.55} />
      </>
    ),
  },
  {
    name: 'Sneaker',
    art: (
      <>
        <path d="M8 44V28c0-4 4-6 8-4l9 4c3 1.5 6 .5 8-2l3-4c6 6 14 10 20 13 3 1.5 3 6 1 9Z" fill="#f5c3a5" />
        <path d="M26 30l4 4M30 27l4 4M34 24l3 4" stroke="#fff" strokeWidth={2.4} />
        <rect x="6" y="43" width="52" height="9" rx="4.5" fill="#fff" />
        <path d="M14 47.5h8M28 47.5h8M42 47.5h8" stroke="#ece3d3" strokeWidth={2} />
      </>
    ),
  },
  {
    name: 'Off we go',
    art: (
      <>
        <path d="M13 28L9 15h6l9 13Z" fill="#7fa6cf" />
        <path d="M7 35c0-6 6-8 14-8h26c7 0 11 4 11 8s-4 8-11 8H21c-8 0-14-2-14-8Z" fill="#c9dcf2" />
        <path d="M28 36l-7 15h8l11-15Z" fill="#7fa6cf" />
        <circle cx="24" cy="33" r="2" fill="#fff" />
        <circle cx="31" cy="33" r="2" fill="#fff" />
        <circle cx="38" cy="33" r="2" fill="#fff" />
        <path d="M48 28.5c4 0 7 2 8 5" fill="none" strokeWidth={2} />
      </>
    ),
  },
  {
    name: 'Suitcase',
    art: (
      <>
        <path d="M24 18v-5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v5" fill="none" strokeWidth={3} />
        <rect x="10" y="18" width="44" height="33" rx="6" fill="#f5c3a5" />
        <path d="M20 18v33M44 18v33" stroke="#c8724a" strokeWidth={3} />
        <circle cx="32" cy="31" r="5" fill="#fbd96a" />
        <path d="M27 42h10" stroke="#fff" strokeWidth={3} />
        <circle cx="17" cy="54" r="2.5" fill={INK} />
        <circle cx="47" cy="54" r="2.5" fill={INK} />
      </>
    ),
  },
  {
    name: 'Island',
    art: (
      <>
        <ellipse cx="32" cy="53" rx="21" ry="5.5" fill="#fbe7a1" />
        <path d="M29 53c0-12 2-22 6-30l4 1c-4 8-5 18-4 29Z" fill="#c8946a" />
        <path d="M37 22c-6-6-15-6-21 0 7-1 13 0 21 0Z" fill="#8fbf7f" />
        <path d="M37 22c6-6 15-6 21 0-7-1-13 0-21 0Z" fill="#8fbf7f" />
        <path d="M37 22c-3-6-10-11-17-10 6 2 11 5 17 10Z" fill="#a9c4a1" />
        <path d="M37 22c3-6 10-11 17-10-6 2-11 5-17 10Z" fill="#a9c4a1" />
        <circle cx="34" cy="25" r="2.6" fill="#a0673f" />
        <circle cx="39" cy="26" r="2.6" fill="#a0673f" />
      </>
    ),
  },
  {
    name: 'Planet',
    art: (
      <g transform="rotate(-15 32 33)">
        <ellipse cx="32" cy="33" rx="27" ry="7.5" fill="none" stroke="#a88520" strokeWidth={2.4} />
        <circle cx="32" cy="32" r="15" fill="#c8bde0" />
        <path d="M5 33a27 7.5 0 0 0 54 0" fill="none" stroke="#fbd96a" strokeWidth={4.5} />
        <Face x={32} y={28} s={0.75} />
      </g>
    ),
  },
  {
    name: 'Balloon',
    art: (
      <>
        <path d="M32 44c2 4-3 6-1 10s-2 6 0 8" fill="none" strokeWidth={1.8} />
        <ellipse cx="32" cy="25" rx="15" ry="18" fill="#f7a8b8" />
        <path d="M29 44h6l-3-3Z" fill="#f7a8b8" />
        <ellipse cx="25" cy="17" rx="3" ry="5" fill="#fff" opacity={0.7} stroke="none" transform="rotate(20 25 17)" />
        <Face x={32} y={26} s={0.75} />
      </>
    ),
  },
];

export function StickerArt({ index, className = '' }: { index: number; className?: string }) {
  const s = STICKERS[index];
  return (
    <svg viewBox="0 0 64 64" className={`sticker ${className}`} role="img" aria-label={s.name}>
      <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round">
        {s.art}
      </g>
    </svg>
  );
}
