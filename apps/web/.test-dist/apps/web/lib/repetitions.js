"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDisplayRepetitionsLabel = getDisplayRepetitionsLabel;
function getDisplayRepetitionsLabel(input) {
    const explicitLabel = input.repetitionsLabel?.trim();
    if (explicitLabel) {
        return explicitLabel;
    }
    const repetitionCount = typeof input.repetitionCount === "string"
        ? Number.parseInt(input.repetitionCount.trim(), 10)
        : input.repetitionCount ?? null;
    const repetitionUnitCount = typeof input.repetitionUnitCount === "string"
        ? Number.parseInt(input.repetitionUnitCount.trim(), 10)
        : input.repetitionUnitCount ?? null;
    const safeCount = repetitionCount && !Number.isNaN(repetitionCount) ? repetitionCount : null;
    const safeUnitCount = repetitionUnitCount && !Number.isNaN(repetitionUnitCount) ? repetitionUnitCount : null;
    if (safeCount && safeUnitCount) {
        return `${safeCount}x${safeUnitCount}`;
    }
    if (safeCount) {
        return `${safeCount}x`;
    }
    if (safeUnitCount) {
        return `${safeUnitCount}x`;
    }
    return "";
}
