import type { Metadata } from "next";
import CategoryIndexClient from "@/components/CategoryIndexClient";

export const metadata: Metadata = {
  title: "Categories",
  alternates: { canonical: "/categories" },
};

export default function CategoriesPage() {
  return <CategoryIndexClient />;
}
