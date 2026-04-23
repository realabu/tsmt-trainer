export function normalizeRepetitionsLabel(
  repetitionsLabel?: string | null,
  repetitionCount?: number | null,
  repetitionUnitCount?: number | null,
) {
  const explicitLabel = repetitionsLabel?.trim();

  if (explicitLabel) {
    return explicitLabel;
  }

  if (repetitionCount && repetitionUnitCount) {
    return `${repetitionCount}x${repetitionUnitCount}`;
  }

  if (repetitionCount) {
    return `${repetitionCount}x`;
  }

  if (repetitionUnitCount) {
    return `${repetitionUnitCount}x`;
  }

  return null;
}
