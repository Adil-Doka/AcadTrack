import React from 'react';
import { motion } from 'framer-motion';

export const HeroIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-2xl mx-auto flex items-center justify-center py-6 select-none">
      {/* ────────────────── FLOATING CARD 1: "Completed" (Top Left) ────────────────── */}
      <motion.div
        animate={{
          y: [0, -10, 0],
          rotate: [-4, -2, -4],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-12 left-4 sm:left-12 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-[0_12px_36px_rgba(0,0,0,0.08)] border border-slate-100 w-44 sm:w-52"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h4 className="text-sm sm:text-base font-extrabold text-slate-800">Completed</h4>
        </div>
        <div className="space-y-1.5">
          <div className="h-2 bg-slate-200 rounded-full w-4/5" />
          <div className="h-2 bg-slate-100 rounded-full w-3/5" />
        </div>
      </motion.div>

      {/* ────────────────── FLOATING CARD 2: "120+ Milestones" (Bottom Left) ────────────────── */}
      <motion.div
        animate={{
          y: [0, 8, 0],
          rotate: [0, 2, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.6,
        }}
        className="absolute bottom-14 left-2 sm:left-10 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 shadow-[0_10px_30px_rgba(0,0,0,0.07)] border border-slate-100 flex items-center gap-3"
      >
        <div className="w-9 h-9 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20">
          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <div>
          <h5 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">120+ Tracks</h5>
          <p className="text-[10px] text-slate-400">Verified & Approved</p>
        </div>
      </motion.div>

      {/* ────────────────── FLOATING CARD 3: Emojis Pill (Middle Right) ────────────────── */}
      <motion.div
        animate={{
          y: [0, -12, 0],
          rotate: [3, 1, 3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.3,
        }}
        className="absolute top-44 right-2 sm:right-10 z-20 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.08)] border border-slate-100 flex items-center gap-2"
      >
        <span className="text-xl sm:text-2xl hover:scale-125 transition-transform cursor-pointer">😊</span>
        <span className="text-xl sm:text-2xl hover:scale-125 transition-transform cursor-pointer">😂</span>
        <span className="text-xl sm:text-2xl hover:scale-125 transition-transform cursor-pointer">🚀</span>
      </motion.div>

      {/* ────────────────── DOODLE PARTICLES ────────────────── */}
      {/* Orange Diamond Particle (Bottom Right) */}
      <motion.div
        animate={{
          rotate: [45, 65, 45],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-10 right-24 z-10 w-4 h-4 bg-amber-500 rounded-sm shadow-sm"
      />

      {/* Purple Dot Particle (Bottom Center-Left) */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
        }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-6 left-56 z-10 w-3 h-3 rounded-full bg-[#20144d]"
      />

      {/* Indigo Dot Particle (Top Right of board) */}
      <div className="absolute top-24 right-44 z-10 w-2.5 h-2.5 rounded-full bg-indigo-500" />

      {/* Sparkle Star (Top Right) */}
      <motion.svg
        animate={{ rotate: 360, scale: [0.9, 1.15, 0.9] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="absolute top-6 right-28 w-5 h-5 text-amber-400"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
      </motion.svg>

      {/* ────────────────── MAIN VECTOR ILLUSTRATION ────────────────── */}
      <div className="relative z-10 w-full max-w-lg">
        <svg
          viewBox="0 0 540 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto drop-shadow-sm"
        >
          {/* Ground shadow beneath character and board */}
          <ellipse cx="230" cy="385" rx="140" ry="8" fill="#f1f5f9" />
          <ellipse cx="370" cy="380" rx="90" ry="6" fill="#f1f5f9" />

          {/* ────── DASHBOARD WHITEBOARD ────── */}
          <g id="dashboard-board">
            {/* Whiteboard main surface */}
            <rect
              x="220"
              y="90"
              width="240"
              height="180"
              rx="8"
              fill="#ffffff"
              stroke="#1e293b"
              strokeWidth="2.5"
            />
            {/* Whiteboard top header banner in amber */}
            <path
              d="M221.5 99C221.5 94.0294 225.529 90 230.5 90H449.5C454.471 90 458.5 94.0294 458.5 99V106H221.5V99Z"
              fill="#f59e0b"
            />

            {/* Folder icon on top left of board */}
            <g transform="translate(190, 70)">
              <path
                d="M5 10C5 7.23858 7.23858 5 10 5H22L28 11H50C52.7614 11 55 13.2386 55 16V42C55 44.7614 52.7614 47 50 47H10C7.23858 47 5 44.7614 5 42V10Z"
                fill="#38bdf8"
                stroke="#1e293b"
                strokeWidth="2.2"
              />
              <path
                d="M5 19H55V42C55 44.7614 52.7614 47 50 47H10C7.23858 47 5 44.7614 5 42V19Z"
                fill="#0284c7"
                fillOpacity="0.15"
              />
            </g>

            {/* Bar charts inside board */}
            <rect x="238" y="152" width="14" height="26" rx="3" fill="#f59e0b" />
            <rect x="258" y="132" width="14" height="46" rx="3" fill="#f59e0b" />
            <rect x="278" y="146" width="14" height="32" rx="3" fill="#f59e0b" />
            <rect x="298" y="138" width="14" height="40" rx="3" fill="#f59e0b" />

            {/* Checklist / Milestone rows on right of board */}
            {/* Row 1 */}
            <rect x="330" y="124" width="94" height="20" rx="3" fill="#f0f9ff" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="340" y1="134" x2="380" y2="134" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
            <circle cx="414" cy="134" r="3" fill="#38bdf8" />

            {/* Row 2 */}
            <rect x="330" y="150" width="94" height="20" rx="3" fill="#f0f9ff" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="340" y1="160" x2="390" y2="160" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
            <circle cx="414" cy="160" r="3" fill="#38bdf8" />

            {/* Row 3 */}
            <rect x="330" y="176" width="94" height="20" rx="3" fill="#f0f9ff" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="340" y1="186" x2="370" y2="186" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
            <circle cx="414" cy="186" r="3" fill="#38bdf8" />

            {/* Divider shelf line */}
            <line x1="230" y1="210" x2="310" y2="210" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="230" y1="220" x2="280" y2="220" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />

            {/* Bottom floating micro card on the whiteboard */}
            <g transform="translate(225, 230)">
              <rect
                x="0"
                y="0"
                width="88"
                height="32"
                rx="4"
                fill="#ffffff"
                stroke="#1e293b"
                strokeWidth="2"
              />
              {/* Dollar/Score icon */}
              <text x="8" y="21" fontFamily="sans-serif" fontSize="13" fontWeight="bold" fill="#1e293b">
                $
              </text>
              {/* Pill badge */}
              <rect x="22" y="8" width="28" height="6" rx="3" fill="#38bdf8" />
              <rect x="22" y="18" width="18" height="6" rx="3" fill="#38bdf8" />
              {/* Orange circle dot */}
              <circle cx="68" cy="16" r="7" fill="#f59e0b" />
            </g>

            {/* Target Bullseye on board bottom right */}
            <g transform="translate(350, 246)">
              <circle cx="20" cy="20" r="18" fill="#e0f2fe" stroke="#0284c7" strokeWidth="3" />
              <circle cx="20" cy="20" r="10" fill="#ffffff" stroke="#0284c7" strokeWidth="3" />
              <circle cx="20" cy="20" r="4" fill="#0284c7" />
              {/* Arrow going into target */}
              <line x1="-8" y1="-8" x2="16" y2="16" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
              <polygon points="17,14 17,20 11,20" fill="#1e293b" />
            </g>
          </g>

          {/* ────── CHARACTER DOODLE (Professional with white shirt & purple trousers) ────── */}
          <g id="character-doodle">
            {/* Feet / Shoes */}
            {/* Left foot */}
            <path
              d="M174 372H192C195 372 196 374 196 378V382H174V372Z"
              fill="#ffffff"
              stroke="#1e293b"
              strokeWidth="2.5"
            />
            {/* Right foot */}
            <path
              d="M200 372H218C221 372 222 374 222 378V382H200V372Z"
              fill="#ffffff"
              stroke="#1e293b"
              strokeWidth="2.5"
            />

            {/* Pants / Trousers in deep purple #20144d */}
            <path
              d="M182 255L174 372H192L197 300L202 372H220L212 255H182Z"
              fill="#20144d"
              stroke="#1e293b"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Torso / White Collared Shirt */}
            <path
              d="M178 190L168 255H226L216 190H178Z"
              fill="#ffffff"
              stroke="#1e293b"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Belt */}
            <line x1="168" y1="255" x2="226" y2="255" stroke="#1e293b" strokeWidth="3" />

            {/* Collar & Tie */}
            <path d="M192 190L197 206L202 190" stroke="#1e293b" strokeWidth="2.5" fill="#f8fafc" />
            <polygon points="197,206 194,222 197,226 200,222" fill="#20144d" stroke="#1e293b" strokeWidth="1.5" />

            {/* Left Arm (relaxed at side) */}
            <path
              d="M178 194L160 248L172 258L186 210"
              fill="#ffffff"
              stroke="#1e293b"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Left Hand in pocket / hip */}
            <circle cx="170" cy="264" r="5" fill="#fef08a" stroke="#1e293b" strokeWidth="2" />

            {/* Right Arm (pointing towards whiteboard) */}
            <path
              d="M216 194L248 234L266 230L222 190"
              fill="#ffffff"
              stroke="#1e293b"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Right Hand gesturing towards board */}
            <path
              d="M266 230L278 226C280 225 282 227 280 230L270 236L266 230Z"
              fill="#fef08a"
              stroke="#1e293b"
              strokeWidth="2"
            />

            {/* Neck */}
            <rect x="193" y="180" width="8" height="12" fill="#fef08a" stroke="#1e293b" strokeWidth="2" />

            {/* Head */}
            <circle cx="197" cy="166" r="14" fill="#fef08a" stroke="#1e293b" strokeWidth="2.5" />

            {/* Face profile features */}
            {/* Eye */}
            <circle cx="203" cy="164" r="1.5" fill="#1e293b" />
            {/* Smile */}
            <path d="M201 172C204 173 207 172 208 170" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />

            {/* Modern Hair (Side parting, stylish blue-dark shade) */}
            <path
              d="M185 166C185 154 192 150 204 150C214 150 216 156 214 162C210 159 203 158 196 161C194 164 190 167 185 166Z"
              fill="#0284c7"
              stroke="#1e293b"
              strokeWidth="2"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
