import { describe, expect, it } from "vitest";
import { escapeXml, formatNumber, generateModernBadge, textWidth } from "./generator";

/** The numbers the layout depends on, read back from the rendered SVG. */
function geometry(svg: string) {
  const number = (pattern: RegExp): number => {
    const match = pattern.exec(svg);
    if (match?.[1] === undefined) throw new Error(`no match for ${pattern}`);
    return Number(match[1]);
  };
  const texts = [...svg.matchAll(/<text x="([\d.]+)"[^>]*textLength="([\d.]+)"[^>]*>([^<]*)</g)];
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
    labelSegment: number(/<path d="M[\d.]+ 0H([\d.]+)V/),
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
