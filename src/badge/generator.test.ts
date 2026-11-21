import { describe, expect, it } from "vitest";
import {
  escapeXml,
  formatNumber,
  generateModernBadge,
  readableText,
  resolvePalette,
  textWidth,
  THEME_NAMES,
  THEMES,
} from "./generator";

/** The numbers the layout depends on, read back from the rendered SVG. */
function geometry(svg: string) {
  const number = (pattern: RegExp): number => {
    const match = pattern.exec(svg);
    if (match?.[1] === undefined) throw new Error(`no match for ${pattern}`);
    return Number(match[1]);
  };
  const texts = [
    ...svg.matchAll(
      /<text(?: class="[^"]*")? x="([\d.]+)"[^>]*textLength="([\d.]+)"[^>]*>([^<]*)</g,
    ),
  ];
  const [label, count] = texts.map(([, x, length, content]) => ({
    content,
    length: Number(length),
    x: Number(x),
  }));
  if (label === undefined || count === undefined) throw new Error("expected two text runs");
  return {
    count,
    height: number(/<svg[^>]* height="([\d.]+)"/),
    label,
    // The edge leans like `/`: its midpoint is the segment boundary.
    labelSegment:
      (number(/<path(?: class="pvc-label")? d="M[\d.]+ 0H([\d.]+)L/) +
        number(/<path(?: class="pvc-label")? d="M[\d.]+ 0H[\d.]+L([\d.]+) /)) /
      2,
    edge: {
      bottom: number(/<path(?: class="pvc-label")? d="M[\d.]+ 0H[\d.]+L([\d.]+) /),
      top: number(/<path(?: class="pvc-label")? d="M[\d.]+ 0H([\d.]+)L/),
    },
    viewBoxWidth: number(/viewBox="0 0 ([\d.]+) /),
    width: number(/<svg[^>]* width="([\d.]+)"/),
  };
}

const COUNTS = [0, 7, 42, 999, 1000, 32_700, 999_499, 999_999, 1_234_567, 1_500_000_000, 2.5e15];

describe("formatNumber", () => {
  it.each([
    [0, "0"],
    [999, "999"],
    [1000, "1K"],
    [1200, "1.2K"],
    [10_300, "10.3K"],
    [115_400, "115.4K"],
    [999_499, "999.5K"],
    [999_999, "1M"],
    [1_234_567, "1.2M"],
    [999_999_999, "1B"],
    [1_500_000_000, "1.5B"],
    [1e12, "1T"],
  ])("formats %d as %s", (input, expected) => {
    expect(formatNumber(input)).toBe(expected);
  });
});

describe("escapeXml", () => {
  it("escapes all five XML special characters", () => {
    expect(escapeXml(`<a&b"c'd>`)).toBe("&lt;a&amp;b&quot;c&apos;d&gt;");
  });

  it("leaves plain text and the empty string unchanged", () => {
    expect(escapeXml("hello world")).toBe("hello world");
    expect(escapeXml("")).toBe("");
  });
});

describe("textWidth", () => {
  const style = { size: 10, tracking: 1, weight: 700 } as const;

  it("is zero for an empty run", () => {
    expect(textWidth("", style)).toBe(0);
  });

  it("adds the advances and the tracking between glyphs (Arial Bold metrics)", () => {
    // "1K": (556 + 722) / 1000 × 10 px + one gap of 1 px.
    expect(textWidth("1K", style)).toBe(13.8);
  });

  it("counts gaps between code points, not UTF-16 units", () => {
    expect(textWidth("😀😀", style)).toBe(textWidth("PP", style));
  });

  it("falls back to an average capital width for glyphs it has no metrics for", () => {
    expect(textWidth("é", style)).toBe(textWidth("P", style));
  });
});

describe("generateModernBadge", () => {
  it("is sized 1:1 to its viewBox at a fixed 28 px height", () => {
    for (const count of COUNTS) {
      const g = geometry(generateModernBadge(count));
      expect(g.width).toBe(g.viewBoxWidth);
      expect(g.height).toBe(28);
    }
  });

  it("pins every text run to its measured width, so no font can push it out", () => {
    for (const count of COUNTS) {
      const svg = generateModernBadge(count);
      const g = geometry(svg);
      expect(g.label.length).toBe(
        textWidth("PROFILE VISITORS", { size: 10, tracking: 0.9, weight: 600 }),
      );
      expect(g.count.length).toBe(
        textWidth(formatNumber(count), { size: 12, tracking: 0.4, weight: 700 }),
      );
      expect(svg.match(/lengthAdjust="spacing"/g)).toHaveLength(2);
    }
  });

  it("keeps the count centred in its segment with padding on both sides", () => {
    for (const count of COUNTS) {
      const g = geometry(generateModernBadge(count));
      const countSegment = g.width - g.labelSegment;
      // Coordinates are rounded to 0.1 px in the SVG.
      expect(Math.abs(g.count.x - (g.labelSegment + countSegment / 2))).toBeLessThanOrEqual(0.1);
      expect(g.count.length + 2 * 11).toBeLessThanOrEqual(countSegment + 0.1);
    }
  });

  it("starts the label after the icon and ends it inside the label segment", () => {
    const g = geometry(generateModernBadge(42));
    expect(g.label.x).toBe(31);
    expect(g.label.x + g.label.length + 11).toBeCloseTo(g.labelSegment, 1);
  });

  it("grows only as wide as the count needs, with a minimum segment for short counts", () => {
    const widths = [7, 42, 1_234_567, 32_700].map((c) => geometry(generateModernBadge(c)).width);
    expect(widths[0]).toBe(widths[1]);
    expect(widths[2]).toBeGreaterThan(widths[1] ?? 0);
    expect(widths[3]).toBeGreaterThan(widths[2] ?? 0);
  });

  it("shows the formatted count and names it for screen readers", () => {
    const svg = generateModernBadge(1200);
    expect(geometry(svg).count.content).toBe("1.2K");
    expect(svg).toContain('role="img" aria-label="Profile visitors: 1.2K"');
    expect(svg).toContain("<title>Profile visitors: 1.2K</title>");
    expect(svg).toContain('<path aria-hidden="true"');
  });

  it("is self-contained: system fonts only, no filters, no external references", () => {
    const svg = generateModernBadge(42);
    expect(svg).toContain("'Segoe UI'");
    expect(svg).not.toMatch(/@import|<filter|<image|href=/);
    expect(svg.match(/https?:\/\/[^"]+/g)).toEqual(["http://www.w3.org/2000/svg"]);
  });

  it("never emits NaN, Infinity or undefined", () => {
    for (const count of COUNTS) {
      expect(generateModernBadge(count)).not.toMatch(/NaN|Infinity|undefined/);
    }
  });
});

/** Fill colours of the four themed parts, read back from the SVG. */
const fills = (svg: string) => ({
  count: /<rect width="[\d.]+" height="28" rx="14" fill="([^"]+)"\/>/.exec(svg)?.[1],
  countText: /<text x="[\d.]+" y="[\d.]+" fill="([^"]+)"[^>]*text-anchor="middle"/.exec(svg)?.[1],
  label: /<path(?: class="pvc-label")? d="M[^"]+" fill="([^"]+)"/.exec(svg)?.[1],
  labelText: /<text(?: class="pvc-label-text")? x="31" y="[\d.]+" fill="([^"]+)"/.exec(svg)?.[1],
});

describe("themes and custom colours", () => {
  it("defaults to graphite: GitHub ink label, GitHub blue count, white text", () => {
    expect(fills(generateModernBadge(42))).toEqual({
      count: "#0969da",
      countText: "#ffffff",
      label: "#1f2328",
      labelText: "#ffffff",
    });
    expect(generateModernBadge(42)).toBe(generateModernBadge(42, { theme: "graphite" }));
  });

  it.each(THEME_NAMES)("renders the %s theme with its own palette and the same layout", (theme) => {
    const svg = generateModernBadge(32_700, { theme });
    const palette = THEMES[theme];
    const f = fills(svg);
    expect(f.label).toBe(palette.label);
    expect(f.labelText).toBe(palette.labelText);
    expect(f.countText).toBe(palette.countText);
    expect(geometry(svg).width).toBe(geometry(generateModernBadge(32_700)).width);
  });

  it("draws aurora's count as a left-to-right gradient", () => {
    const svg = generateModernBadge(7, { theme: "aurora" });
    expect(fills(svg).count).toBe("url(#pvc-accent)");
    expect(svg).toContain('<linearGradient id="pvc-accent">');
    expect(svg).toContain('stop-color="#2f81f7"');
    expect(svg).toContain('stop-color="#a371f7"');
    expect(generateModernBadge(7)).not.toContain("pvc-accent");
  });

  it("separates same-coloured segments with a divider in the label text colour", () => {
    expect(generateModernBadge(7, { theme: "mono" })).toMatch(/ 21L[\d.]+ 7" stroke="#ffffff"/);
    expect(generateModernBadge(7, { color: "ffffff", theme: "paper" })).toMatch(
      / 21L[\d.]+ 7" stroke="#1f2328"/,
    );
    expect(generateModernBadge(7)).not.toContain(" 21L");
  });

  it("leans the segment edge and the divider like a slash", () => {
    for (const count of COUNTS) {
      const { edge } = geometry(generateModernBadge(count));
      expect(edge.top - edge.bottom).toBeCloseTo(6, 1);
    }
    const divider = /M([\d.]+) 21L([\d.]+) 7"/.exec(generateModernBadge(7, { theme: "mono" }));
    expect(Number(divider?.[2]) - Number(divider?.[1])).toBeCloseTo(3, 1);
  });

  it("gives paper a visible hairline edge for light pages", () => {
    expect(generateModernBadge(7, { theme: "paper" })).toContain(
      'stroke="#d0d7de" stroke-opacity="1"',
    );
  });

  it("switches adaptive's label to light for viewers who prefer a light scheme", () => {
    const svg = generateModernBadge(7, { theme: "adaptive" });
    expect(svg).toContain("@media (prefers-color-scheme: light)");
    expect(svg).toContain('<path class="pvc-label" d=');
    expect(svg).toContain('<text class="pvc-label-text" x="31"');
    expect(svg).toContain(".pvc-edge{stroke:#d0d7de;stroke-opacity:1}");
    expect(svg).toContain('fill="none" class="pvc-edge"');
  });

  it("drops the adaptive switch when the caller sets the label colour", () => {
    const svg = generateModernBadge(7, { labelColor: "000000", theme: "adaptive" });
    expect(svg).not.toContain("prefers-color-scheme");
    expect(fills(svg).label).toBe("#000000");
  });

  it("applies custom colours over the theme and picks readable text for each", () => {
    expect(fills(generateModernBadge(7, { color: "fde047", labelColor: "0f172a" }))).toEqual({
      count: "#fde047",
      countText: "#1f2328",
      label: "#0f172a",
      labelText: "#ffffff",
    });
    expect(fills(generateModernBadge(7, { color: "e11d48", theme: "aurora" })).count).toBe(
      "#e11d48",
    );
  });

  it.each(['"/><script>', "0969d", "0969dag", "#0969da"])(
    "rejects the colour %j before it reaches the SVG",
    (color) => {
      expect(() => generateModernBadge(7, { color })).toThrow("color must be a 6-digit hex colour");
      expect(() => generateModernBadge(7, { labelColor: color })).toThrow("labelColor must be");
    },
  );

  it("lowercases custom colours", () => {
    expect(fills(generateModernBadge(7, { color: "E11D48" })).count).toBe("#e11d48");
  });

  it("keeps the divider only while both segments share one colour", () => {
    expect(generateModernBadge(7, { color: "e11d48", theme: "mono" })).not.toContain(" 21L");
  });
});

describe("readableText", () => {
  it.each([
    ["#000000", "#ffffff"],
    ["#0969da", "#ffffff"],
    ["#ffffff", "#1f2328"],
    ["#fde047", "#1f2328"],
    ["#1a7f37", "#ffffff"],
  ])("puts %s under %s text", (background, text) => {
    expect(readableText(background)).toBe(text);
  });
});

describe("resolvePalette", () => {
  it("returns the graphite palette when nothing is set", () => {
    expect(resolvePalette()).toEqual(THEMES.graphite);
  });
});
