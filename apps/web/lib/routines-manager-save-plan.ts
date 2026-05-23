import type { TaskDraft } from "../components/task-builder";
import { buildRoutinePeriodPayload, buildRoutineTaskPayload } from "./routines-manager-payloads";

export type RoutineEditorPeriodDraft = {
  id?: string;
  name: string;
  startsOn: string;
  endsOn: string;
  weeklyTargetCount: string;
};

export type RoutineEditorSaveOperation =
  | {
      type: "updateRoutine";
      endpoint: string;
      method: "PATCH";
      payload: {
        name: string;
        description: string;
      };
    }
  | {
      type: "deleteTask";
      endpoint: string;
      method: "DELETE";
      taskId: string;
    }
  | {
      type: "updateTask";
      endpoint: string;
      method: "PATCH";
      taskId: string;
      payload: ReturnType<typeof buildRoutineTaskPayload>;
    }
  | {
      type: "createTask";
      endpoint: string;
      method: "POST";
      payload: ReturnType<typeof buildRoutineTaskPayload>;
    }
  | {
      type: "deletePeriod";
      endpoint: string;
      method: "DELETE";
      periodId: string;
    }
  | {
      type: "updatePeriod";
      endpoint: string;
      method: "PATCH";
      periodId: string;
      payload: ReturnType<typeof buildRoutinePeriodPayload>;
    }
  | {
      type: "createPeriod";
      endpoint: string;
      method: "POST";
      payload: ReturnType<typeof buildRoutinePeriodPayload>;
    };

export function buildRoutineEditorSavePlan(input: {
  routineId: string;
  name: string;
  description: string;
  tasks: TaskDraft[];
  periods: RoutineEditorPeriodDraft[];
  originalTaskIds: string[];
  originalPeriodIds: string[];
}) {
  const currentTaskIds = input.tasks.map((task) => task.id).filter((value): value is string => Boolean(value));
  const removedTaskIds = input.originalTaskIds.filter((id) => !currentTaskIds.includes(id));
  const currentPeriodIds = input.periods.map((period) => period.id).filter((value): value is string => Boolean(value));
  const removedPeriodIds = input.originalPeriodIds.filter((id) => !currentPeriodIds.includes(id));

  const operations: RoutineEditorSaveOperation[] = [
    {
      type: "updateRoutine",
      endpoint: `/api/routines/${input.routineId}`,
      method: "PATCH",
      payload: {
        name: input.name,
        description: input.description,
      },
    },
    ...removedTaskIds.map(
      (taskId): RoutineEditorSaveOperation => ({
        type: "deleteTask",
        endpoint: `/api/routines/tasks/${taskId}`,
        method: "DELETE",
        taskId,
      }),
    ),
    ...input.tasks.map((task, index): RoutineEditorSaveOperation => {
      const payload = buildRoutineTaskPayload(task, index + 1);

      if (task.id) {
        return {
          type: "updateTask",
          endpoint: `/api/routines/tasks/${task.id}`,
          method: "PATCH",
          taskId: task.id,
          payload,
        };
      }

      return {
        type: "createTask",
        endpoint: `/api/routines/${input.routineId}/tasks`,
        method: "POST",
        payload,
      };
    }),
    ...removedPeriodIds.map(
      (periodId): RoutineEditorSaveOperation => ({
        type: "deletePeriod",
        endpoint: `/api/routines/periods/${periodId}`,
        method: "DELETE",
        periodId,
      }),
    ),
    ...input.periods.map((period): RoutineEditorSaveOperation => {
      const payload = buildRoutinePeriodPayload(period);

      if (period.id) {
        return {
          type: "updatePeriod",
          endpoint: `/api/routines/periods/${period.id}`,
          method: "PATCH",
          periodId: period.id,
          payload,
        };
      }

      return {
        type: "createPeriod",
        endpoint: `/api/routines/${input.routineId}/periods`,
        method: "POST",
        payload,
      };
    }),
  ];

  return {
    removedTaskIds,
    removedPeriodIds,
    operations,
  };
}
