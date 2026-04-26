import { MediaKind } from "@prisma/client";

export function parseAdminCatalogMediaKind(
  kind: "IMAGE" | "AUDIO" | "VIDEO" | "EXTERNAL_LINK",
) {
  return MediaKind[kind];
}
