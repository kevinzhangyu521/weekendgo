import { AdminEditDestinationClient } from "@/components/admin/admin-edit-destination-client";

export default async function AdminEditDestinationPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminEditDestinationClient id={id} />;
}
