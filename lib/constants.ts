// lib/constants.ts
import { OverlayEffect } from "./types";

export const tagColors = [
  "#AEC6CF", // pastel blue
  "#FFD1DC", // pastel pink
  "#B4E7CE", // pastel mint
  "#FFF5BA", // pastel yellow
  "#D7BDE2", // pastel purple
  "#FFDAB9", // pastel peach
  "#C7CEEA", // pastel periwinkle
  "#F8C8DC", // pastel rose
  "#B5EAD7", // pastel seafoam
  "#FFDFD3", // pastel coral
];

export const backgrounds = [
  "/bg.jpg",
  "/bg2.jpg",
  "/bg3.jpg",
  "/bg4.jpg",
  "/bg5.jpg",
];

export const overlayOptions: {
  id: OverlayEffect;
  label: string;
  icon: string;
}[] = [
  { id: "none", label: "None", icon: "🚫" },
  { id: "rain", label: "Rain", icon: "🌧️" },
  { id: "snow", label: "Snow", icon: "❄️" },
  { id: "sakura", label: "Sakura", icon: "🌸" },
  { id: "fire", label: "Embers", icon: "🔥" },
];
