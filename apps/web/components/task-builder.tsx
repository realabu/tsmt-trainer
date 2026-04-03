"use client";

export interface TaskDraft {
  sortOrder: number;
  title: string;
  details: string;
  repetitionsLabel: string;
  mediaImageUrl: string;
  mediaAudioUrl: string;
  mediaVideoUrl: string;
}

export function TaskBuilder({
  tasks,
  onChange,
}: {
  tasks: TaskDraft[];
  onChange: (tasks: TaskDraft[]) => void;
}) {
  function updateTask(index: number, patch: Partial<TaskDraft>) {
    onChange(tasks.map((task, taskIndex) => (taskIndex === index ? { ...task, ...patch } : task)));
  }

  function addTask() {
    onChange([
      ...tasks,
      {
        sortOrder: tasks.length + 1,
        title: "",
        details: "",
        repetitionsLabel: "",
        mediaImageUrl: "",
        mediaAudioUrl: "",
        mediaVideoUrl: "",
      },
    ]);
  }

  return (
    <div className="list">
      {tasks.map((task, index) => (
        <div className="list-item" key={`${task.sortOrder}-${index}`}>
          <strong>{index + 1}. feladat</strong>
          <div className="list" style={{ marginTop: 12 }}>
            <input
              value={task.title}
              onChange={(event) => updateTask(index, { title: event.target.value })}
              placeholder="Feladat neve"
            />
            <textarea
              value={task.details}
              onChange={(event) => updateTask(index, { details: event.target.value })}
              placeholder="Feladat leirasa"
            />
            <input
              value={task.repetitionsLabel}
              onChange={(event) => updateTask(index, { repetitionsLabel: event.target.value })}
              placeholder="Ismetles, pl. 2x"
            />
            <input
              value={task.mediaImageUrl}
              onChange={(event) => updateTask(index, { mediaImageUrl: event.target.value })}
              placeholder="Kep URL (opcionalis)"
            />
            <input
              value={task.mediaAudioUrl}
              onChange={(event) => updateTask(index, { mediaAudioUrl: event.target.value })}
              placeholder="Hang URL (opcionalis)"
            />
            <input
              value={task.mediaVideoUrl}
              onChange={(event) => updateTask(index, { mediaVideoUrl: event.target.value })}
              placeholder="Video URL (opcionalis)"
            />
          </div>
        </div>
      ))}
      <button className="button secondary" onClick={addTask} type="button">
        Uj feladat
      </button>
    </div>
  );
}
