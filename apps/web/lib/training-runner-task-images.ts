type TrainingRunnerTaskMediaLink = {
  id: string;
  label?: string | null;
  mediaAsset: {
    kind: string;
    externalUrl?: string | null;
  };
};

type TrainingRunnerTaskForImages = {
  id: string;
  customImageMedia?: {
    externalUrl?: string | null;
  } | null;
  mediaLinks?: TrainingRunnerTaskMediaLink[];
  catalogTask?: {
    mediaLinks: TrainingRunnerTaskMediaLink[];
  } | null;
};

export type TrainingRunnerTaskImage = {
  key: string;
  label: string;
  url: string;
};

export function buildCurrentTaskImages(
  currentTask: TrainingRunnerTaskForImages | null,
): TrainingRunnerTaskImage[] {
  if (!currentTask) {
    return [];
  }

  const images: TrainingRunnerTaskImage[] = [];

  if (currentTask.customImageMedia?.externalUrl) {
    images.push({
      key: `${currentTask.id}-custom-image`,
      label: "Feladatkep",
      url: currentTask.customImageMedia.externalUrl,
    });
  }

  for (const media of currentTask.mediaLinks ?? []) {
    if (media.mediaAsset.kind === "IMAGE" && media.mediaAsset.externalUrl) {
      images.push({
        key: media.id,
        label: media.label ?? "Kep",
        url: media.mediaAsset.externalUrl,
      });
    }
  }

  for (const media of currentTask.catalogTask?.mediaLinks ?? []) {
    if (media.mediaAsset.kind === "IMAGE" && media.mediaAsset.externalUrl) {
      images.push({
        key: `${media.id}-catalog`,
        label: media.label ?? "Mintakep",
        url: media.mediaAsset.externalUrl,
      });
    }
  }

  return images;
}
