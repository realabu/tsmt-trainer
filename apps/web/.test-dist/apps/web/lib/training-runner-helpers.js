"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDuration = formatDuration;
exports.buildRingStyle = buildRingStyle;
exports.initialsFromTitle = initialsFromTitle;
function formatDuration(totalSeconds) {
    const safe = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
function buildRingStyle(value, max, color) {
    const safeMax = Math.max(max, 1);
    const progress = Math.min(100, Math.max(0, (value / safeMax) * 100));
    return {
        background: `conic-gradient(${color} ${progress}%, rgba(255,255,255,0.18) ${progress}% 100%)`,
    };
}
function initialsFromTitle(value) {
    return value
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}
