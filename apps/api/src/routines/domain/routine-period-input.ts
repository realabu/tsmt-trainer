export type RoutinePeriodInput = {
  name?: string;
  startsOn: string;
  endsOn: string;
  weeklyTargetCount: number;
};

export function buildRoutinePeriodInputData(input: RoutinePeriodInput) {
  return {
    name: input.name,
    startsOn: new Date(input.startsOn),
    endsOn: new Date(input.endsOn),
    weeklyTargetCount: input.weeklyTargetCount,
  };
}

export function buildRoutinePeriodCreateData(
  routineId: string,
  input: RoutinePeriodInput,
) {
  return {
    routineId,
    ...buildRoutinePeriodInputData(input),
  };
}

export function buildRoutinePeriodUpdateData(input: RoutinePeriodInput) {
  return {
    ...buildRoutinePeriodInputData(input),
  };
}
