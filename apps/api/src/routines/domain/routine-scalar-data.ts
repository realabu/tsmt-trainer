export type RoutineCreateScalarInput = {
  childId: string;
  name: string;
  description?: string;
};

export function buildRoutineCreateScalarData(input: RoutineCreateScalarInput) {
  return {
    childId: input.childId,
    name: input.name,
    description: input.description,
  };
}

export type RoutineUpdateScalarInput = {
  name?: string;
  description?: string;
};

export function buildRoutineUpdateScalarData(input: RoutineUpdateScalarInput) {
  return {
    name: input.name,
    description: input.description,
  };
}
