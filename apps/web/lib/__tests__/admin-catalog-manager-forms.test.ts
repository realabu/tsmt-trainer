import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEquipmentCatalogSavePayload,
  buildSongCatalogSavePayload,
  buildTaskCatalogMediaLinks,
  buildTaskCatalogSavePayload,
  createEmptyEquipmentCatalogForm,
  createEmptySongCatalogForm,
  createEmptyTaskCatalogForm,
  createEquipmentCatalogFormFromRecord,
  createSongCatalogFormFromRecord,
  createTaskCatalogFormFromRecord,
  type AdminCatalogEquipmentRecord,
  type AdminCatalogSongRecord,
  type AdminCatalogTaskRecord,
  type AdminTaskCatalogFormState,
} from "../admin-catalog-manager-forms";

function equipmentRecord(
  overrides: Partial<AdminCatalogEquipmentRecord> = {},
): AdminCatalogEquipmentRecord {
  return {
    id: "equipment-1",
    name: "Labda",
    description: "Puha labda",
    isActive: true,
    iconMedia: {
      id: "media-equipment-1",
      externalUrl: "https://example.com/icon.png",
    },
    ...overrides,
  };
}

function songRecord(overrides: Partial<AdminCatalogSongRecord> = {}): AdminCatalogSongRecord {
  return {
    id: "song-1",
    title: "Tavaszi dal",
    lyrics: "La la",
    notes: "Lassan",
    isActive: true,
    audioMedia: {
      id: "media-audio-1",
      externalUrl: "https://example.com/audio.mp3",
    },
    videoMedia: {
      id: "media-video-1",
      externalUrl: "https://example.com/video.mp4",
    },
    ...overrides,
  };
}

function taskRecord(overrides: Partial<AdminCatalogTaskRecord> = {}): AdminCatalogTaskRecord {
  return {
    id: "task-1",
    title: "Labda guritas",
    summary: "Guritsd a labdat.",
    instructions: "Lassan guritsd.",
    focusPoints: "Hat egyenes.",
    demoVideoUrl: "https://example.com/demo.mp4",
    isActive: true,
    defaultSongId: "song-1",
    mediaLinks: [
      {
        id: "media-link-1",
        label: "Kep",
        mediaAsset: {
          id: "media-image-1",
          externalUrl: "https://example.com/image-1.png",
        },
      },
      {
        id: "media-link-2",
        label: "Ures kep",
        mediaAsset: {
          id: "media-image-2",
          externalUrl: null,
        },
      },
      {
        id: "media-link-3",
        label: "Masodik kep",
        mediaAsset: {
          id: "media-image-3",
          externalUrl: "https://example.com/image-2.png",
        },
      },
    ],
    equipmentLinks: [
      {
        equipmentCatalogItem: equipmentRecord({ id: "equipment-1" }),
      },
      {
        equipmentCatalogItem: equipmentRecord({ id: "equipment-2" }),
      },
    ],
    difficultyLevels: [
      {
        id: "level-1",
        name: "Konnyu",
        description: null,
        sortOrder: 10,
      },
      {
        id: "level-2",
        name: "Nehez",
        description: "Halado",
        sortOrder: 20,
      },
    ],
    ...overrides,
  };
}

function taskForm(overrides: Partial<AdminTaskCatalogFormState> = {}): AdminTaskCatalogFormState {
  return {
    title: "Labda guritas",
    summary: "Rovid",
    instructions: "Instrukcio",
    focusPoints: "Fokusz",
    demoVideoUrl: "https://example.com/demo.mp4",
    defaultSongId: "song-1",
    imageUrls: "https://example.com/image-1.png",
    equipmentIds: ["equipment-1"],
    difficultyLevels: [{ name: "Konnyu", description: "Leiras" }],
    isActive: true,
    ...overrides,
  };
}

test("task form defaults preserve current empty values", () => {
  assert.deepEqual(createEmptyTaskCatalogForm(), {
    title: "",
    summary: "",
    instructions: "",
    focusPoints: "",
    demoVideoUrl: "",
    defaultSongId: "",
    imageUrls: "",
    equipmentIds: [],
    difficultyLevels: [],
    isActive: true,
  });
});

test("song form defaults preserve current empty values", () => {
  assert.deepEqual(createEmptySongCatalogForm(), {
    title: "",
    lyrics: "",
    audioExternalUrl: "",
    videoExternalUrl: "",
    notes: "",
    isActive: true,
  });
});

test("equipment form defaults preserve current empty values", () => {
  assert.deepEqual(createEmptyEquipmentCatalogForm(), {
    name: "",
    description: "",
    iconExternalUrl: "",
    isActive: true,
  });
});

test("task form hydration preserves current selected task mapping", () => {
  const result = createTaskCatalogFormFromRecord(taskRecord());

  assert.deepEqual(result, {
    title: "Labda guritas",
    summary: "Guritsd a labdat.",
    instructions: "Lassan guritsd.",
    focusPoints: "Hat egyenes.",
    demoVideoUrl: "https://example.com/demo.mp4",
    defaultSongId: "song-1",
    imageUrls: "https://example.com/image-1.png\nhttps://example.com/image-2.png",
    equipmentIds: ["equipment-1", "equipment-2"],
    difficultyLevels: [
      { name: "Konnyu", description: "" },
      { name: "Nehez", description: "Halado" },
    ],
    isActive: true,
  });
});

test("task form hydration maps nullish optional fields to empty strings", () => {
  const result = createTaskCatalogFormFromRecord(
    taskRecord({
      summary: null,
      instructions: undefined,
      focusPoints: null,
      demoVideoUrl: undefined,
      defaultSongId: null,
      mediaLinks: [],
      equipmentLinks: [],
      difficultyLevels: [],
      isActive: false,
    }),
  );

  assert.equal(result.summary, "");
  assert.equal(result.instructions, "");
  assert.equal(result.focusPoints, "");
  assert.equal(result.demoVideoUrl, "");
  assert.equal(result.defaultSongId, "");
  assert.equal(result.imageUrls, "");
  assert.deepEqual(result.equipmentIds, []);
  assert.deepEqual(result.difficultyLevels, []);
  assert.equal(result.isActive, false);
});

test("song form hydration preserves current selected song mapping", () => {
  assert.deepEqual(createSongCatalogFormFromRecord(songRecord()), {
    title: "Tavaszi dal",
    lyrics: "La la",
    audioExternalUrl: "https://example.com/audio.mp3",
    videoExternalUrl: "https://example.com/video.mp4",
    notes: "Lassan",
    isActive: true,
  });
});

test("song form hydration maps missing media and optional text to empty strings", () => {
  assert.deepEqual(
    createSongCatalogFormFromRecord(
      songRecord({
        lyrics: null,
        notes: undefined,
        audioMedia: null,
        videoMedia: undefined,
        isActive: false,
      }),
    ),
    {
      title: "Tavaszi dal",
      lyrics: "",
      audioExternalUrl: "",
      videoExternalUrl: "",
      notes: "",
      isActive: false,
    },
  );
});

test("equipment form hydration preserves current selected equipment mapping", () => {
  assert.deepEqual(createEquipmentCatalogFormFromRecord(equipmentRecord()), {
    name: "Labda",
    description: "Puha labda",
    iconExternalUrl: "https://example.com/icon.png",
    isActive: true,
  });
});

test("equipment form hydration maps missing icon and description to empty strings", () => {
  assert.deepEqual(
    createEquipmentCatalogFormFromRecord(
      equipmentRecord({
        description: null,
        iconMedia: undefined,
        isActive: false,
      }),
    ),
    {
      name: "Labda",
      description: "",
      iconExternalUrl: "",
      isActive: false,
    },
  );
});

test("task image URLs convert to current mediaLinks payload shape", () => {
  assert.deepEqual(
    buildTaskCatalogMediaLinks(`
      https://example.com/image-1.png

      https://example.com/image-2.png
    `),
    [
      {
        kind: "IMAGE",
        externalUrl: "https://example.com/image-1.png",
        label: "Alapertelmezett kep",
      },
      {
        kind: "IMAGE",
        externalUrl: "https://example.com/image-2.png",
        label: "Alapertelmezett kep",
      },
    ],
  );
});

test("task save payload preserves scalar and optional-field behavior", () => {
  assert.deepEqual(
    buildTaskCatalogSavePayload(
      taskForm({
        summary: "",
        instructions: "",
        focusPoints: "",
        demoVideoUrl: "",
      }),
    ),
    {
      title: "Labda guritas",
      summary: undefined,
      instructions: undefined,
      focusPoints: undefined,
      demoVideoUrl: undefined,
      defaultSongId: "song-1",
      isActive: true,
      equipmentIds: ["equipment-1"],
      mediaLinks: [
        {
          kind: "IMAGE",
          externalUrl: "https://example.com/image-1.png",
          label: "Alapertelmezett kep",
        },
      ],
      difficultyLevels: [
        {
          name: "Konnyu",
          description: "Leiras",
          sortOrder: 0,
        },
      ],
    },
  );
});

test("task save payload preserves equipment IDs and defaultSongId optional behavior", () => {
  const result = buildTaskCatalogSavePayload(
    taskForm({
      defaultSongId: "",
      equipmentIds: ["equipment-2", "equipment-1"],
    }),
  );

  assert.equal(result.defaultSongId, undefined);
  assert.deepEqual(result.equipmentIds, ["equipment-2", "equipment-1"]);
});

test("task difficulty rows are filtered, trimmed, and re-sorted in current order", () => {
  const result = buildTaskCatalogSavePayload(
    taskForm({
      difficultyLevels: [
        { name: "  Konnyu  ", description: "  Lassu  " },
        { name: "   ", description: "Kimarad" },
        { name: "Nehez", description: "   " },
      ],
    }),
  );

  assert.deepEqual(result.difficultyLevels, [
    {
      name: "Konnyu",
      description: "Lassu",
      sortOrder: 0,
    },
    {
      name: "Nehez",
      description: undefined,
      sortOrder: 1,
    },
  ]);
});

test("song save payload preserves empty-string-to-undefined behavior", () => {
  assert.deepEqual(
    buildSongCatalogSavePayload({
      title: "Tavaszi dal",
      lyrics: "",
      audioExternalUrl: "",
      videoExternalUrl: "https://example.com/video.mp4",
      notes: "",
      isActive: false,
    }),
    {
      title: "Tavaszi dal",
      lyrics: undefined,
      audioExternalUrl: undefined,
      videoExternalUrl: "https://example.com/video.mp4",
      notes: undefined,
      isActive: false,
    },
  );
});

test("equipment save payload preserves empty-string-to-undefined behavior", () => {
  assert.deepEqual(
    buildEquipmentCatalogSavePayload({
      name: "Labda",
      description: "",
      iconExternalUrl: "https://example.com/icon.png",
      isActive: false,
    }),
    {
      name: "Labda",
      description: undefined,
      iconExternalUrl: "https://example.com/icon.png",
      isActive: false,
    },
  );
});
