import type { Metadata } from "next";
import TestClient from "@/components/TestClient";

export const metadata: Metadata = {
  title: "Test",
  description:
    "Test yourself on the deck: a word with no picture, and every synonym or antonym to pick out of six choices.",
  alternates: { canonical: "/test" },
  openGraph: {
    url: "/test",
    title: "Test — Wordhoard",
    description:
      "Test yourself on the deck: a word with no picture, and every synonym or antonym to pick out of six choices.",
  },
};

export default function TestPage() {
  return <TestClient />;
}
