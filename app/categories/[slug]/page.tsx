import type { Metadata } from "next";
import CategoryPageClient from "@/components/CategoryPageClient";
import { CATEGORIES, getCategory } from "@/lib/categories";

// Prerender every category at build time, like the sets, so the service
// worker can cache each one for offline use.
export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  return {
    title: category?.name ?? "Category",
    alternates: { canonical: `/categories/${slug}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CategoryPageClient slug={slug} />;
}
