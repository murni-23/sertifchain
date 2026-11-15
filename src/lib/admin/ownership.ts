import { createServiceClient } from "@/lib/supabase/server";

type ServiceClient = ReturnType<typeof createServiceClient>;

export async function getOwnedBatchIds(
  supabase: ServiceClient,
  adminId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("batches")
    .select("id")
    .eq("admin_id", adminId);

  if (error) {
    throw new Error(`Failed to load admin batches: ${error.message}`);
  }

  return (data || []).map((batch: { id: string }) => batch.id);
}
