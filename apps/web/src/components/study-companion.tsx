"use client";

import { motion, useReducedMotion } from "framer-motion";

export type StudyCompanionState =
  | "idle"
  | "focus"
  | "paused"
  | "resting"
  | "completed";

export function StudyCompanion({ state }: { state: StudyCompanionState }) {
  const reducedMotion = useReducedMotion();
  const studying = state === "focus";
  const resting = state === "resting" || state === "paused";
  const celebrating = state === "completed";
  const repeat = reducedMotion ? 0 : Infinity;

  return (
    <motion.div
      className="study-companion"
      aria-hidden="true"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: "easeOut" }}
    >
      <svg viewBox="0 0 220 144" role="presentation">
        <path className="companion-desk" d="M30 106h160l-8 22H38z" />
        <path className="companion-desk-line" d="M47 128v8m126-8v8" />
        <path className="companion-book" d="M82 99h60l13 18H69z" />
        <path className="companion-book-page" d="M112 101v14" />
        <text className="companion-book-mark" x="106" y="113">
          K
        </text>
        <motion.g
          animate={
            reducedMotion
              ? undefined
              : celebrating
                ? { y: [0, -7, 0] }
                : studying
                  ? { y: [0, -1.4, 0] }
                  : { y: 0 }
          }
          transition={
            celebrating
              ? { duration: 0.8, ease: "easeOut" }
              : { duration: 2.8, repeat, ease: "easeInOut" }
          }
        >
          <path className="companion-shirt" d="M88 85q22-13 44 0l6 24H82z" />
          <motion.path
            className="companion-arm"
            d="M94 90c-10 5-13 12-18 17"
            style={{ transformBox: "fill-box", transformOrigin: "80% 10%" }}
            animate={
              celebrating && !reducedMotion
                ? { rotate: [0, -48, -18] }
                : { rotate: 0 }
            }
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
          <motion.path
            className="companion-arm"
            d="M127 91c9 4 13 10 18 15"
            style={{ transformBox: "fill-box", transformOrigin: "20% 10%" }}
            animate={
              celebrating && !reducedMotion
                ? { rotate: [0, 48, 18] }
                : resting
                  ? { y: -4, rotate: -8 }
                  : studying && !reducedMotion
                    ? { x: [0, 2.5, 0], y: [0, 1.5, 0], rotate: [0, 2, 0] }
                    : { x: 0, y: 0, rotate: 0 }
            }
            transition={
              celebrating
                ? { duration: 0.7, ease: "easeOut" }
                : { duration: 1.9, repeat, ease: "easeInOut" }
            }
          />
          <motion.g
            animate={
              studying && !reducedMotion
                ? { x: [0, 2.5, 0], y: [0, 1.5, 0], rotate: [-2, 2, -2] }
                : resting
                  ? { x: 8, y: -5, rotate: -17 }
                  : { x: 0, y: 0, rotate: -2 }
            }
            transition={{ duration: 1.9, repeat, ease: "easeInOut" }}
          >
            <path className="companion-pencil" d="m144 105 18-13" />
            <path className="companion-pencil-tip" d="m161 92 3-3" />
          </motion.g>
          <circle className="companion-face" cx="110" cy="62" r="25" />
          <path
            className="companion-hair"
            d="M84 63q0-31 27-31 27 0 25 31l-8-10q-18 7-36-1z"
          />
          <path className="companion-hair" d="M84 67q1 20 11 25l-5-24z" />
          <motion.g
            animate={
              reducedMotion ? { scaleY: 1 } : { scaleY: [1, 1, 0.14, 1, 1] }
            }
            transition={{
              duration: 5.8,
              repeat,
              times: [0, 0.56, 0.59, 0.62, 1],
            }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          >
            <circle className="companion-eye" cx="101" cy="64" r="1.8" />
            <circle className="companion-eye" cx="119" cy="64" r="1.8" />
          </motion.g>
          <path
            className="companion-smile"
            d={celebrating ? "M103 75q7 7 14 0" : "M104 75q6 4 12 0"}
          />
        </motion.g>
        <motion.g
          className="companion-cup"
          animate={{ opacity: resting ? 1 : 0.58 }}
          transition={{ duration: 0.2 }}
        >
          <path d="M157 95h15v11h-15z" />
          <path d="M172 98h5c2 0 2 5 0 5h-5" />
        </motion.g>
      </svg>
    </motion.div>
  );
}
