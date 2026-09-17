import { ImageResponse } from "next/og";
import { ALL_WORDS, getSetIds } from "@/lib/vocab";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";
export const OG_ALT =
  "Wordhoard — an illustrated vocabulary deck of 810 words across 27 sets";

const PAPER = "#EFE9DA";
const INK = "#23231F";
const STAMP = "#8C3B2E";
const LEDGER = "#3E5C4E";
const HAIRLINE = "#D8CFB8";

/**
 * The card social platforms unfurl. Built with next/og at build time so it
 * always reflects the real deck size and needs no binary asset in the repo.
 */
export function renderOgImage() {
  const words = ALL_WORDS.length;
  const sets = getSetIds().length;
  const sample = ["capricious", "laconic", "ephemeral", "austere"];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: PAPER,
          padding: "70px 78px",
          border: `2px solid ${HAIRLINE}`,
          borderRadius: 0,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: STAMP,
            }}
          >
            Vocabulary deck
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 18,
              fontSize: 132,
              fontWeight: 700,
              color: INK,
              letterSpacing: -3,
            }}
          >
            Wordhoard
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 10,
              fontSize: 40,
              color: "rgba(35, 35, 31, 0.62)",
            }}
          >
            {words} words · {sets} illustrated sets
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 14 }}>
            {sample.map((word) => (
              <div
                key={word}
                style={{
                  display: "flex",
                  padding: "10px 26px",
                  borderRadius: 999,
                  border: `2px solid rgba(62, 92, 78, 0.35)`,
                  color: LEDGER,
                  fontSize: 30,
                }}
              >
                {word}
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "rgba(35, 35, 31, 0.45)",
            }}
          >
            naimurrahman.dev
          </div>
        </div>
      </div>
    ),
    OG_SIZE
  );
}
