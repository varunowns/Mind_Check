import { motion } from "framer-motion";

export const BreathingOrb = ({ phase }: { phase: "inhale" | "hold" | "exhale" }) => {
  const scale = phase === "inhale" ? 1.18 : phase === "hold" ? 1.18 : 0.88;
  return (
    <motion.div
      animate={{ scale }}
      transition={{ duration: 1, ease: "easeInOut" }}
      className="mx-auto h-48 w-48 rounded-full bg-gradient-to-br from-lavender via-sky to-mint shadow-soft"
    />
  );
};
