import { MediaKind } from "@prisma/client";

export function parseRoutineTaskMediaKind(
  kind: "IMAGE" | "AUDIO" | "VIDEO" | "EXTERNAL_LINK",
) {
  return MediaKind[kind];
}
