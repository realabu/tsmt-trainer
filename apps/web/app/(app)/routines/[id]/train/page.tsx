import { TrainingRunner } from "../../../../../components/training-runner";

export default async function RoutineTrainingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TrainingRunner routineId={id} />;
}
