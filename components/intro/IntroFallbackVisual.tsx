'use client';

import { motion } from 'framer-motion';

interface IntroFallbackVisualProps {
  activeScene: number;
  compact?: boolean;
  reducedMotion?: boolean;
}

export default function IntroFallbackVisual({
  activeScene,
  compact = false,
  reducedMotion = false,
}: IntroFallbackVisualProps) {
  const safeScene = Math.min(3, Math.max(0, activeScene));

  const floatTransition = (delay = 0, duration = 4) =>
    reducedMotion
      ? undefined
      : {
          duration,
          delay,
          repeat: Infinity,
          repeatType: 'reverse' as const,
          ease: 'easeInOut' as const,
        };

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[26px]"
      aria-hidden="true"
    >
      {/* Grounded Subtle Stage Shadow */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 h-8 w-[64%] -translate-x-1/2 rounded-full bg-white/85 blur-md" />

      <div
        className={`relative flex h-full w-full items-center justify-center ${
          compact ? 'p-3' : 'p-4 sm:p-6'
        }`}
      >
        {safeScene === 0 && (
          <motion.div
            key="fallback-scene-0"
            initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="relative flex h-full w-full items-center justify-center"
          >
            <svg
              viewBox="0 0 460 360"
              className="h-full max-h-[340px] w-full max-w-[440px] drop-shadow-sm"
            >
              <defs>
                <radialGradient id="claySkinCobalt" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#FFE2C8" />
                  <stop offset="65%" stopColor="#F0BE98" />
                  <stop offset="100%" stopColor="#D79B71" />
                </radialGradient>
                <linearGradient id="hoodieCobalt" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8F73EE" />
                  <stop offset="55%" stopColor="#7655E8" />
                  <stop offset="100%" stopColor="#3979F6" />
                </linearGradient>
              </defs>

              <ellipse cx="230" cy="316" rx="92" ry="18" fill="#EAE3FF" />

              {/* White Sneakers with Purple/Blue Soles & Deep Indigo Trousers */}
              <rect x="195" y="256" width="26" height="50" rx="13" fill="#242044" />
              <rect x="239" y="256" width="26" height="50" rx="13" fill="#3979F6" />
              <rect x="187" y="294" width="38" height="20" rx="10" fill="#FFFFFF" stroke="#7655E8" strokeWidth="3" />
              <rect x="236" y="294" width="38" height="20" rx="10" fill="#FFFFFF" stroke="#3979F6" strokeWidth="3" />

              {/* Backpack peek behind shoulders */}
              <rect x="170" y="168" width="120" height="62" rx="22" fill="#FFFFFF" stroke="#3979F6" strokeWidth="2.5" />

              {/* Royal Purple Hoodie Torso + Pocket */}
              <path
                d="M174 202 C174 168 196 154 230 154 C264 154 286 168 286 202 L279 266 C277 278 267 284 254 284 L206 284 C193 284 183 278 181 266 Z"
                fill="url(#hoodieCobalt)"
              />
              <rect x="196" y="232" width="68" height="32" rx="12" fill="#6040D4" />
              <line x1="216" y1="164" x2="216" y2="190" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="244" y1="164" x2="244" y2="190" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />

              {/* Curious Raised Arms */}
              <path
                d="M180 184 Q146 212 162 238"
                stroke="url(#hoodieCobalt)"
                strokeWidth="24"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="163" cy="242" r="12" fill="url(#claySkinCobalt)" />
              <path
                d="M280 184 Q314 166 306 140"
                stroke="url(#hoodieCobalt)"
                strokeWidth="24"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="305" cy="136" r="12" fill="url(#claySkinCobalt)" />

              {/* Head & Dark Natural Hair */}
              <rect x="218" y="138" width="24" height="22" rx="10" fill="url(#claySkinCobalt)" />
              <circle cx="230" cy="110" r="46" fill="url(#claySkinCobalt)" />
              <path
                d="M182 104 C180 62 214 52 246 58 C272 64 282 86 276 112 C264 90 236 82 210 92 C196 98 188 106 182 104 Z"
                fill="#2A221F"
              />
              <circle cx="215" cy="112" r="5" fill="#242044" />
              <circle cx="245" cy="112" r="5" fill="#242044" />
              <circle cx="216.5" cy="110.5" r="1.8" fill="#FFFFFF" />
              <circle cx="246.5" cy="110.5" r="1.8" fill="#FFFFFF" />
              <circle cx="204" cy="122" r="6" fill="#E8A694" opacity="0.45" />
              <circle cx="256" cy="122" r="6" fill="#E8A694" opacity="0.45" />
              <path
                d="M222 128 Q230 133 238 128"
                stroke="#9E5F50"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />

              {/* Recognizable Object 1: Electric Blue Coding Laptop with Lavender Code Details */}
              <motion.g
                animate={reducedMotion ? undefined : { y: [-6, 6] }}
                transition={floatTransition(0, 3.2)}
              >
                <rect x="44" y="64" width="76" height="48" rx="9" fill="#3979F6" />
                <rect x="50" y="70" width="64" height="36" rx="5" fill="#242044" />
                <text
                  x="82"
                  y="94"
                  textAnchor="middle"
                  fill="#EAE3FF"
                  fontSize="18"
                  fontWeight="800"
                  fontFamily="ui-monospace, monospace"
                >
                  &lt;/&gt;
                </text>
                <path d="M38 113 H126 L132 124 H32 Z" fill="#F5F1FF" stroke="#7655E8" strokeWidth="1.5" />
              </motion.g>

              {/* Recognizable Object 2: Purple, Blue & White Design Palette + Pencil */}
              <motion.g
                animate={reducedMotion ? undefined : { y: [6, -7] }}
                transition={floatTransition(0.4, 3.6)}
              >
                <ellipse cx="372" cy="92" rx="40" ry="30" fill="#FFFFFF" stroke="#E8E5F5" strokeWidth="2.5" />
                <circle cx="352" cy="84" r="6" fill="#7655E8" />
                <circle cx="372" cy="76" r="6" fill="#3979F6" />
                <circle cx="390" cy="86" r="6" fill="#9B82F3" />
                <circle cx="382" cy="105" r="6" fill="#E1EBFF" />
                <circle cx="354" cy="104" r="6" fill="#EAE3FF" />
                <rect x="384" y="54" width="10" height="58" rx="4" transform="rotate(32 384 54)" fill="#7655E8" stroke="#3979F6" strokeWidth="1.5" />
              </motion.g>

              {/* Recognizable Object 3: Royal Purple Camera */}
              <motion.g
                animate={reducedMotion ? undefined : { y: [-5, 5] }}
                transition={floatTransition(0.7, 3.4)}
              >
                <rect x="46" y="220" width="76" height="50" rx="12" fill="#7655E8" />
                <rect x="48" y="216" width="72" height="14" rx="6" fill="#FFFFFF" />
                <rect x="72" y="208" width="24" height="10" rx="4" fill="#3979F6" />
                <circle cx="84" cy="245" r="16" fill="#3979F6" stroke="#E1EBFF" strokeWidth="3" />
                <circle cx="84" cy="245" r="9" fill="#242044" />
                <circle cx="81" cy="242" r="2.5" fill="#FFFFFF" />
              </motion.g>

              {/* Recognizable Object 4: Electric Blue & Purple Headphones */}
              <motion.g
                animate={reducedMotion ? undefined : { y: [5, -6] }}
                transition={floatTransition(0.2, 3.8)}
              >
                <path d="M346 244 A28 28 0 0 1 402 244" stroke="#3979F6" strokeWidth="9" strokeLinecap="round" fill="none" />
                <rect x="336" y="236" width="16" height="28" rx="8" fill="#7655E8" stroke="#3979F6" strokeWidth="3" />
                <rect x="396" y="236" width="16" height="28" rx="8" fill="#7655E8" stroke="#3979F6" strokeWidth="3" />
              </motion.g>
            </svg>
          </motion.div>
        )}

        {safeScene === 1 && (
          <motion.div
            key="fallback-scene-1"
            initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="flex h-full w-full items-center justify-center"
          >
            <svg
              viewBox="0 0 460 360"
              className="h-full max-h-[340px] w-full max-w-[440px] drop-shadow-sm"
            >
              <defs>
                <radialGradient id="claySkinB" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#FFE1C6" />
                  <stop offset="100%" stopColor="#E5A87D" />
                </radialGradient>
                <radialGradient id="claySkinWarm" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#F5CBB0" />
                  <stop offset="100%" stopColor="#D79E76" />
                </radialGradient>
                <radialGradient id="connectGlowBlue" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#EAE3FF" stopOpacity="0.95" />
                  <stop offset="55%" stopColor="#7655E8" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#3979F6" stopOpacity="0" />
                </radialGradient>
              </defs>

              <ellipse cx="230" cy="316" rx="150" ry="20" fill="#E1EBFF" />

              {/* Lavender-Blue Light Connection Halo with Particle Accents */}
              <motion.circle
                cx="230"
                cy="184"
                r="62"
                fill="url(#connectGlowBlue)"
                animate={reducedMotion ? undefined : { scale: [0.94, 1.1] }}
                transition={floatTransition(0, 1.8)}
              />
              <circle cx="195" cy="136" r="5" fill="#7655E8" />
              <circle cx="265" cy="136" r="5" fill="#3979F6" />
              <circle cx="230" cy="118" r="4" fill="#EAE3FF" />

              {/* Left Student in Crisp Lavender-White Knit */}
              <g>
                <rect x="78" y="250" width="22" height="52" rx="11" fill="#3979F6" />
                <rect x="110" y="250" width="22" height="52" rx="11" fill="#242044" />
                <rect
                  x="70"
                  y="160"
                  width="70"
                  height="96"
                  rx="30"
                  fill="#F5F1FF"
                  stroke="#7655E8"
                  strokeWidth="2.5"
                />
                <circle cx="105" cy="122" r="34" fill="url(#claySkinB)" />
                <path
                  d="M71 118 C71 84 102 78 134 94 C142 104 140 120 135 124 C122 104 94 100 71 118 Z"
                  fill="#25201D"
                />
                <circle cx="114" cy="124" r="4" fill="#242044" />
                <circle cx="96" cy="124" r="4" fill="#242044" />
              </g>

              {/* Right Student in Pale Blue Jacket */}
              <g>
                <rect x="328" y="250" width="22" height="52" rx="11" fill="#242044" />
                <rect x="360" y="250" width="22" height="52" rx="11" fill="#3979F6" />
                <rect x="320" y="160" width="70" height="96" rx="30" fill="#E1EBFF" stroke="#3979F6" strokeWidth="2.5" />
                <circle cx="355" cy="122" r="34" fill="url(#claySkinWarm)" />
                <path
                  d="M321 118 C321 82 356 76 388 94 C392 108 389 122 384 126 C369 102 341 102 321 118 Z"
                  fill="#3B302A"
                />
                <circle cx="346" cy="124" r="4" fill="#242044" />
                <circle cx="364" cy="124" r="4" fill="#242044" />
              </g>

              {/* Royal Purple & Electric Blue Interlocking Puzzle Pieces */}
              <motion.g
                animate={reducedMotion ? undefined : { x: [-8, 2] }}
                transition={floatTransition(0, 2.2)}
              >
                <path
                  d="M138 144 H216 V168 C236 168 236 202 216 202 V226 H138 Z"
                  fill="#7655E8"
                  stroke="#5B3DC9"
                  strokeWidth="3"
                />
              </motion.g>

              <motion.g
                animate={reducedMotion ? undefined : { x: [8, -2] }}
                transition={floatTransition(0, 2.2)}
              >
                <path
                  d="M234 144 H322 V226 H234 V202 C254 202 254 168 234 168 Z"
                  fill="#3979F6"
                  stroke="#2B64D6"
                  strokeWidth="3"
                />
              </motion.g>
            </svg>
          </motion.div>
        )}

        {safeScene === 2 && (
          <motion.div
            key="fallback-scene-2"
            initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="flex h-full w-full items-center justify-center"
          >
            <svg
              viewBox="0 0 460 360"
              className="h-full max-h-[340px] w-full max-w-[440px] drop-shadow-sm"
            >
              <ellipse cx="230" cy="316" rx="158" ry="20" fill="#EAE3FF" />

              {/* Teacher (Left - Royal Purple) */}
              <rect x="74" y="156" width="76" height="92" rx="30" fill="#7655E8" />
              <circle cx="112" cy="118" r="35" fill="#F0BE98" />
              <path
                d="M77 112 C80 76 116 74 144 92 C150 104 147 118 142 120 C128 100 96 100 77 112 Z"
                fill="#2A221F"
              />
              <circle cx="122" cy="118" r="4" fill="#242044" />
              <circle cx="104" cy="118" r="4" fill="#242044" />

              {/* Learner (Right - White Lavender Knit) */}
              <rect
                x="310"
                y="156"
                width="76"
                height="92"
                rx="30"
                fill="#F5F1FF"
                stroke="#3979F6"
                strokeWidth="2.5"
              />
              <circle cx="348" cy="118" r="35" fill="#F5C9AC" />
              <path
                d="M313 114 C315 78 352 74 380 94 C384 106 382 118 377 122 C363 102 331 100 313 114 Z"
                fill="#3B302A"
              />
              <circle cx="338" cy="118" r="4" fill="#242044" />
              <circle cx="356" cy="118" r="4" fill="#242044" />

              {/* White & Lavender-Blue Study Table */}
              <rect x="134" y="216" width="192" height="22" rx="11" fill="#FFFFFF" stroke="#E8E5F5" strokeWidth="2.5" />
              <rect x="154" y="238" width="14" height="68" rx="7" fill="#3979F6" />
              <rect x="292" y="238" width="14" height="68" rx="7" fill="#7655E8" />

              {/* Purple Tablet & Electric Blue Knowledge Orb */}
              <rect x="196" y="196" width="68" height="20" rx="6" fill="#7655E8" />
              <motion.circle
                cx="230"
                cy="168"
                r="16"
                fill="#3979F6"
                stroke="#E1EBFF"
                strokeWidth="3"
                animate={
                  reducedMotion
                    ? undefined
                    : {
                        x: [-54, 0, 56, 56, 56],
                        y: [0, -18, 0, 0, 0],
                        scale: [0.2, 1, 0.9, 0, 0],
                        opacity: [0, 1, 1, 0, 0],
                      }
                }
                transition={{
                  duration: 3.8,
                  times: [0, 0.22, 0.42, 0.48, 1],
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Flying Golden Yellow Credit Coins with Subtle Blue Accents (appear only after orb arrives right) */}
              {[0, 1, 2].map((idx) => (
                <motion.g
                  key={idx}
                  initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0 }}
                  animate={
                    reducedMotion
                      ? undefined
                      : {
                          x: [148, 148, 70, 0, 0],
                          y: [64, 64, -18, 0, 0],
                          scale: [0, 0, 1, 1, 0.95],
                          opacity: [0, 0, 1, 1, 0],
                        }
                  }
                  transition={{
                    duration: 3.8,
                    times: [0, 0.44 + idx * 0.04, 0.62 + idx * 0.04, 0.84 + idx * 0.03, 1],
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <circle
                    cx={138 + idx * 32}
                    cy={106 - (idx % 2) * 14}
                    r="15"
                    fill="#EAE3FF"
                    stroke="#7655E8"
                    strokeWidth="4"
                  />
                  <text
                    x={138 + idx * 32}
                    y={112 - (idx % 2) * 14}
                    textAnchor="middle"
                    fill="#242044"
                    fontSize="14"
                    fontWeight="800"
                  >
                    +1
                  </text>
                </motion.g>
              ))}
            </svg>
          </motion.div>
        )}

        {safeScene === 3 && (
          <motion.div
            key="fallback-scene-3"
            initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="flex h-full w-full items-center justify-center"
          >
            <svg
              viewBox="0 0 460 360"
              className="h-full max-h-[340px] w-full max-w-[440px] drop-shadow-sm"
            >
              <ellipse
                cx="230"
                cy="306"
                rx="166"
                ry="26"
                fill="#F5F1FF"
                stroke="#E8E5F5"
                strokeWidth="3"
              />

              {/* Royal Purple & Electric Blue Network Arcs */}
              <path d="M95 160 Q230 56 365 160" stroke="#EAE3FF" strokeWidth="4" fill="none" />
              <path d="M95 190 Q160 250 230 220" stroke="#7655E8" strokeWidth="3.5" fill="none" />
              <path d="M365 190 Q300 250 230 220" stroke="#3979F6" strokeWidth="3.5" fill="none" />

              {/* Five Diverse Visible Peers */}
              <g>
                <rect x="66" y="182" width="56" height="80" rx="24" fill="#E1EBFF" stroke="#3979F6" strokeWidth="2" />
                <circle cx="94" cy="148" r="27" fill="#F2C19E" />
                <circle cx="94" cy="126" r="20" fill="#2A221F" />
              </g>

              <g>
                <rect x="136" y="114" width="52" height="72" rx="22" fill="#F5F1FF" stroke="#7655E8" strokeWidth="2" />
                <circle cx="162" cy="84" r="25" fill="#DFA178" />
                <circle cx="162" cy="64" r="19" fill="#25201D" />
              </g>

              <g>
                <rect x="200" y="92" width="60" height="74" rx="24" fill="#7655E8" />
                <circle cx="230" cy="60" r="27" fill="#F6CDB2" />
                <path
                  d="M203 58 C207 32 243 30 257 52 C257 60 252 64 246 62 C234 48 217 48 203 58 Z"
                  fill="#3B302A"
                />
              </g>

              <g>
                <rect x="272" y="114" width="52" height="72" rx="22" fill="#3979F6" />
                <circle cx="298" cy="84" r="25" fill="#E6AE89" />
                <circle cx="298" cy="64" r="18" fill="#2A221F" />
              </g>

              <g>
                <rect x="338" y="182" width="56" height="80" rx="24" fill="#EAE3FF" stroke="#7655E8" strokeWidth="2" />
                <circle cx="366" cy="148" r="27" fill="#F1BE9B" />
                <path
                  d="M339 146 C342 120 377 118 393 140 C384 134 353 134 339 146 Z"
                  fill="#25201D"
                />
              </g>

              {/* Center SwapStudy Logo Badge Reveal */}
              <motion.g
                animate={reducedMotion ? undefined : { scale: [0.97, 1.04] }}
                transition={floatTransition(0, 2.4)}
              >
                <rect
                  x="188"
                  y="198"
                  width="84"
                  height="84"
                  rx="24"
                  fill="#FFFFFF"
                  stroke="#E8E5F5"
                  strokeWidth="2.5"
                />
                <rect x="196" y="206" width="68" height="68" rx="19" fill="#7655E8" />
                <path
                  d="M214 230h30l-7-7M246 250h-30l7 7"
                  stroke="#FFFFFF"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </motion.g>
            </svg>
          </motion.div>
        )}
      </div>
    </div>
  );
}
