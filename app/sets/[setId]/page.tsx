import SetPageClient from "@/components/SetPageClient";

export default async function SetPage({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  const { setId } = await params;
  return <SetPageClient setId={setId} />;
}
