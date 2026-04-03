import { AdminRoutineDetail } from "../../../../../components/admin-routine-detail";

export default async function AdminRoutinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminRoutineDetail routineId={id} />;
}
