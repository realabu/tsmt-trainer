export function getBadgeTriggerThreshold(triggerConfig: { threshold?: number } | null) {
  return Number(triggerConfig?.threshold ?? 0);
}
