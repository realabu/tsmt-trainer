import { TrainerAssignmentDetail } from "../../../../components/trainer-assignment-detail";

export default async function TrainerAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TrainerAssignmentDetail assignmentId={id} />;
}
