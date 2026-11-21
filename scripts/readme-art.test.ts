import { describe, expect, test } from "bun:test";
import { architectureSvg, coverSvg, readmeArt, writeReadmeArt } from "./readme-art";

describe("coverSvg", () => {
  test.each([
    ["light", "#ffffff", "#0969da"],
    ["dark", "#0d1117", "#58a6ff"],
  ] as const)("paints the %s cover on GitHub's background with its accent", (mode, bg, accent) => {
    const svg = coverSvg(mode);
    expect(svg).toContain('width="1280" height="560" viewBox="0 0 1280 560"');
    expect(svg).toContain(`<rect width="1280" height="560" fill="${bg}"/>`);
    expect(svg).toContain(`fill="${accent}">counted.</text>`);
  });

  test("frames the cover the mdxcn way: dashed edge, corner marks, [ TITLE ]", () => {
    const svg = coverSvg("light");
    expect(svg).toContain('stroke-dasharray="6 6"');
    expect(svg.match(/<path d="M[\d.]+ [\d.]+h12M/g)).toHaveLength(4);
    expect(svg).toContain(">[ PROFILE VIEW COUNTER ]</text>");
  });

  test("shows five real badges at 1.5×, each with its own gradient ids", () => {
    const svg = coverSvg("dark");
    expect(svg.match(/<svg x=[^>]* height="42"/g)).toHaveLength(5);
    const ids = [...svg.matchAll(/<linearGradient id="([^"]+)"/g)].map(([, id]) => id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(svg).toContain("Profile visitors: 32.7K");
  });
});

describe("architectureSvg", () => {
  test("draws the request path from README to D1 inside a Worker frame", () => {
    const svg = architectureSvg("light");
    for (const name of ["readme", "github camo", "validate", "count", "render", "d1"]) {
      expect(svg).toContain(`>${name}</text>`);
    }
    expect(svg).toContain(">[ CLOUDFLARE WORKER ]</text>");
    expect(svg).toContain('<marker id="head"');
    expect(svg.match(/marker-end="url\(#head\)"/g)).toHaveLength(5);
  });

  test("uses the dark palette for dark mode", () => {
    expect(architectureSvg("dark")).toContain('fill="#161b22" stroke="#30363d"');
  });
});

describe("readmeArt", () => {
  test("matches every committed asset", async () => {
    const files = Object.entries(readmeArt());
    expect(files.map(([path]) => path)).toEqual([
      "assets/architecture-dark.svg",
      "assets/architecture-light.svg",
      "assets/cover-dark.svg",
      "assets/cover-light.svg",
    ]);
    const committed = await Promise.all(files.map(([path]) => Bun.file(path).text()));
    expect(committed).toEqual(files.map(([, svg]) => svg));
  });
});

describe("writeReadmeArt", () => {
  test("writes each art file once through the given writer", async () => {
    const written: string[] = [];
    await writeReadmeArt(async (path) => {
      written.push(path);
    });
    expect(written.toSorted()).toEqual(Object.keys(readmeArt()).toSorted());
  });
});
