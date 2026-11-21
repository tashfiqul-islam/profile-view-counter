import { describe, expect, test } from "bun:test";
import { THEME_NAMES } from "../src/badge/generator";
import { GALLERY_ROWS, gallerySvg } from "./badge-gallery";

describe("gallerySvg", () => {
  const svg = gallerySvg();

  test("shows every built-in theme with the query that selects it", () => {
    for (const theme of THEME_NAMES) expect(svg).toContain(`>${theme}</text>`);
    for (const theme of THEME_NAMES.filter((name) => name !== "graphite")) {
      expect(svg).toContain(`&amp;theme=${theme}`);
    }
    // graphite is the default, so its row shows no query at all.
    expect(svg).toContain(">(no parameters)</text>");
  });

  test("includes the custom-colour examples", () => {
    expect(svg).toContain("&amp;color=e11d48&amp;label_color=0f172a");
    expect(svg).toContain('fill="#fde047"');
  });

  test("draws each row on a light and a dark panel plus three counts", () => {
    expect(svg.match(/fill="#0d1117" stroke="#30363d"/g)).toHaveLength(GALLERY_ROWS.length);
    expect(svg.match(/<svg x=/g)).toHaveLength(GALLERY_ROWS.length * 5);
  });

  test("gives every nested badge its own gradient ids", () => {
    const ids = [...svg.matchAll(/<linearGradient id="([^"]+)"/g)].map(([, id]) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("sizes the sheet to its rows", () => {
    const [first] = GALLERY_ROWS;
    if (first === undefined) throw new Error("gallery has no rows");
    expect(gallerySvg([first])).toContain('height="138"');
  });

  test("matches the committed asset", async () => {
    expect(await Bun.file("assets/badge-themes.svg").text()).toBe(svg);
  });
});
