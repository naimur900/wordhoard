import SetPageClient from "@/components/SetPageClient";
import { getSetIds } from "@/lib/vocab";

// Prerender every set at build time, so each page is a static file the
// service worker can cache for offline use.
export function generateStaticParams() {
  return getSetIds().map((id) => ({ setId: String(id) }));
}

export default async function SetPage({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  const { setId } = await params;
  return <SetPageClient setId={setId} />;
}
