import { describe, expect, test } from "bun:test";
import { generateModernBadge } from "../src/badge/generator";
import { architectureSvg, coverSvg, readmeArt, writeReadmeArt } from "./readme-art";

describe("coverSvg", () => {
  test.each([
    ["light", "#ffffff", "#0969da"],
    ["dark", "#0d1117", "#58a6ff"],
  ] as const)("paints the %s cover on GitHub's background with its accent", (mode, bg, accent) => {
    const svg = coverSvg(mode);
    expect(svg).toContain('width="1280" height="600" viewBox="0 0 1280 600"');
    expect(svg).toContain(`<rect width="1280" height="600" fill="${bg}"/>`);
    expect(svg).toContain(`fill="${accent}">counted.</text>`);
    expect(svg).toContain(`<stop offset="0" stop-color="${accent}"`);
  });

  test("frames the cover the mdxcn way: dashed edges broken around [ TITLE ] labels, corner marks", () => {
    const svg = coverSvg("light");
    expect(svg.match(/stroke-dasharray="6 6"/g)).toHaveLength(2);
    expect(svg.match(/<path d="M[\d.]+ [\d.]+h12M/g)).toHaveLength(8);
    for (const label of ["[ PROFILE VIEW COUNTER ]", "[ OPEN SOURCE · MIT ]", "[ THEMES ]"]) {
      expect(svg).toContain(`>${label}</text>`);
    }
    // No background boxes behind labels: the glow and dot grid stay visible through the gaps.
    expect(svg).not.toContain('height="26" fill="#ffffff"');
  });

  test("lists six real themed badges at 1.25× with their names", () => {
    const svg = coverSvg("dark");
    expect(svg.match(/<svg x=[^>]* height="35"/g)).toHaveLength(6);
    for (const name of ["graphite", "aurora", "mono", "paper", "contribution", "#e11d48"]) {
      expect(svg).toContain(`>${name}</text>`);
    }
    const ids = [...svg.matchAll(/<linearGradient id="([^"]+)"/g)].map(([, id]) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("shows the stat row: pill height, themes, coverage", () => {
    const svg = coverSvg("light");
    for (const value of [">28 px<", ">6<", ">100 %<", ">pill height<", ">test coverage<"]) {
      expect(svg).toContain(value);
    }
  });
});

describe("architectureSvg", () => {
  test("draws the five numbered steps from README to render inside a Worker frame", () => {
    const svg = architectureSvg("light");
    for (const [step, name] of [
      ["01", "readme"],
      ["02", "github camo"],
      ["03", "validate"],
      ["04", "count"],
      ["05", "render"],
    ]) {
      expect(svg).toContain(`>${step}</text>`);
      expect(svg).toContain(`>${name}</text>`);
    }
    expect(svg).toContain(">[ CLOUDFLARE WORKER ]</text>");
    expect(svg).toContain(">d1</text>");
    expect(svg).toContain("<ellipse ");
  });

  test("draws the request solid and the response lane dashed, with a legend", () => {
    const svg = architectureSvg("dark");
    expect(svg.match(/marker-end="url\(#head\)"/g)).toHaveLength(6);
    expect(svg).toContain(
      'd="M1088 244V440H162V246" fill="none" stroke="#58a6ff" stroke-width="1.5" stroke-dasharray="5 5"',
    );
    expect(svg).toContain(">request</text>");
    expect(svg).toContain(">response</text>");
    expect(svg).toContain('fill="#151b23" stroke="#30363d"');
  });
});

describe("readmeArt", () => {
  test("matches every committed asset, including the sample badge", async () => {
    const files = Object.entries(readmeArt());
    expect(files.map(([path]) => path)).toEqual([
      "assets/architecture-dark.svg",
      "assets/architecture-light.svg",
      "assets/badge-32.7k.svg",
      "assets/cover-dark.svg",
      "assets/cover-light.svg",
    ]);
    expect(readmeArt()["assets/badge-32.7k.svg"]).toBe(`${generateModernBadge(32_700)}\n`);
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
