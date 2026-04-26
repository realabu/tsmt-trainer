import { parseAdminCatalogMediaKind } from "./admin-media-kind";

export function buildAdminCatalogMediaCreate(
  media: {
    kind: "IMAGE" | "AUDIO" | "VIDEO" | "EXTERNAL_LINK";
    externalUrl?: string | null;
  },
  index: number,
) {
  return {
    sortOrder: index,
    mediaAsset: {
      create: {
        kind: parseAdminCatalogMediaKind(media.kind),
        externalUrl: media.externalUrl,
      },
    },
  };
}
