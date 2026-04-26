import assert from "node:assert/strict";
import test from "node:test";
import { buildCurrentTaskImages } from "../training-runner-task-images";

test("null current task returns an empty image list", () => {
  assert.deepEqual(buildCurrentTaskImages(null), []);
});

test("custom image is included first", () => {
  const result = buildCurrentTaskImages({
    id: "task-1",
    customImageMedia: {
      externalUrl: "https://example.com/custom.png",
    },
    mediaLinks: [],
    catalogTask: {
      mediaLinks: [],
    },
  });

  assert.deepEqual(result, [
    {
      key: "task-1-custom-image",
      label: "Feladatkep",
      url: "https://example.com/custom.png",
    },
  ]);
});

test("task IMAGE media are included and non-IMAGE media are ignored", () => {
  const result = buildCurrentTaskImages({
    id: "task-1",
    mediaLinks: [
      {
        id: "media-image",
        label: null,
        mediaAsset: {
          kind: "IMAGE",
          externalUrl: "https://example.com/task-image.png",
        },
      },
      {
        id: "media-audio",
        label: "Hang",
        mediaAsset: {
          kind: "AUDIO",
          externalUrl: "https://example.com/task-audio.mp3",
        },
      },
    ],
    catalogTask: {
      mediaLinks: [],
    },
  });

  assert.deepEqual(result, [
    {
      key: "media-image",
      label: "Kep",
      url: "https://example.com/task-image.png",
    },
  ]);
});

test("catalog IMAGE media are included after task media", () => {
  const result = buildCurrentTaskImages({
    id: "task-1",
    mediaLinks: [
      {
        id: "task-media-1",
        label: "Sajat",
        mediaAsset: {
          kind: "IMAGE",
          externalUrl: "https://example.com/task-image.png",
        },
      },
    ],
    catalogTask: {
      mediaLinks: [
        {
          id: "catalog-media-1",
          label: null,
          mediaAsset: {
            kind: "IMAGE",
            externalUrl: "https://example.com/catalog-image.png",
          },
        },
      ],
    },
  });

  assert.deepEqual(result, [
    {
      key: "task-media-1",
      label: "Sajat",
      url: "https://example.com/task-image.png",
    },
    {
      key: "catalog-media-1-catalog",
      label: "Mintakep",
      url: "https://example.com/catalog-image.png",
    },
  ]);
});

test("missing externalUrl values are ignored", () => {
  const result = buildCurrentTaskImages({
    id: "task-1",
    customImageMedia: {
      externalUrl: null,
    },
    mediaLinks: [
      {
        id: "task-media-1",
        label: "Sajat",
        mediaAsset: {
          kind: "IMAGE",
          externalUrl: null,
        },
      },
    ],
    catalogTask: {
      mediaLinks: [
        {
          id: "catalog-media-1",
          label: "Minta",
          mediaAsset: {
            kind: "IMAGE",
            externalUrl: undefined,
          },
        },
      ],
    },
  });

  assert.deepEqual(result, []);
});

test("preserves exact keys and labels across all image sources", () => {
  const result = buildCurrentTaskImages({
    id: "task-9",
    customImageMedia: {
      externalUrl: "https://example.com/custom.png",
    },
    mediaLinks: [
      {
        id: "task-media-9",
        label: "Felirat",
        mediaAsset: {
          kind: "IMAGE",
          externalUrl: "https://example.com/task.png",
        },
      },
    ],
    catalogTask: {
      mediaLinks: [
        {
          id: "catalog-media-9",
          label: null,
          mediaAsset: {
            kind: "IMAGE",
            externalUrl: "https://example.com/catalog.png",
          },
        },
      ],
    },
  });

  assert.deepEqual(result, [
    {
      key: "task-9-custom-image",
      label: "Feladatkep",
      url: "https://example.com/custom.png",
    },
    {
      key: "task-media-9",
      label: "Felirat",
      url: "https://example.com/task.png",
    },
    {
      key: "catalog-media-9-catalog",
      label: "Mintakep",
      url: "https://example.com/catalog.png",
    },
  ]);
});
