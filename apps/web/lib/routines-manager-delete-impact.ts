export type DeleteImpactPreview = {
  entityId: string;
};

export type RoutineDeleteImpactPreviewState<TPreview extends DeleteImpactPreview = DeleteImpactPreview> = {
  routine: TPreview | null;
  period: TPreview | null;
  task: TPreview | null;
};

export function createEmptyDeleteImpactPreviewState<TPreview extends DeleteImpactPreview = DeleteImpactPreview>() {
  return {
    routine: null,
    period: null,
    task: null,
  } satisfies RoutineDeleteImpactPreviewState<TPreview>;
}

export function applyRoutinePreviewSuccess<TPreview extends DeleteImpactPreview>(
  preview: TPreview,
): RoutineDeleteImpactPreviewState<TPreview> {
  return {
    routine: preview,
    period: null,
    task: null,
  };
}

export function applyPeriodPreviewSuccess<TPreview extends DeleteImpactPreview>(
  state: RoutineDeleteImpactPreviewState<TPreview>,
  preview: TPreview,
): RoutineDeleteImpactPreviewState<TPreview> {
  return {
    ...state,
    period: preview,
    task: null,
  };
}

export function applyTaskPreviewSuccess<TPreview extends DeleteImpactPreview>(
  state: RoutineDeleteImpactPreviewState<TPreview>,
  preview: TPreview,
): RoutineDeleteImpactPreviewState<TPreview> {
  return {
    ...state,
    period: null,
    task: preview,
  };
}

export function clearRoutinePreview<TPreview extends DeleteImpactPreview>(
  state: RoutineDeleteImpactPreviewState<TPreview>,
): RoutineDeleteImpactPreviewState<TPreview> {
  return {
    ...state,
    routine: null,
  };
}

export function clearPeriodPreview<TPreview extends DeleteImpactPreview>(
  state: RoutineDeleteImpactPreviewState<TPreview>,
): RoutineDeleteImpactPreviewState<TPreview> {
  return {
    ...state,
    period: null,
  };
}

export function clearTaskPreview<TPreview extends DeleteImpactPreview>(
  state: RoutineDeleteImpactPreviewState<TPreview>,
): RoutineDeleteImpactPreviewState<TPreview> {
  return {
    ...state,
    task: null,
  };
}

export function clearAllDeleteImpactPreviews<TPreview extends DeleteImpactPreview = DeleteImpactPreview>() {
  return createEmptyDeleteImpactPreviewState<TPreview>();
}

export function isRoutinePreviewFor(
  state: RoutineDeleteImpactPreviewState,
  routineId: string,
) {
  return state.routine?.entityId === routineId;
}

export function isPeriodPreviewFor(
  state: RoutineDeleteImpactPreviewState,
  periodId: string,
) {
  return state.period?.entityId === periodId;
}

export function isTaskPreviewFor(
  state: RoutineDeleteImpactPreviewState,
  taskId: string,
) {
  return state.task?.entityId === taskId;
}
