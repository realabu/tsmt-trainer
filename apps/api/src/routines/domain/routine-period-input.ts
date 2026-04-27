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
