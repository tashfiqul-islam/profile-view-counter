import { describe, expect, it } from "bun:test";
import { safeParse } from "valibot";
import {
  escapeXml,
  formatNumber,
  generateModernBadge,
} from "../src/badge/generator";
import { querySchema } from "../src/schemas/query";

const WIDTH_REGEX = /width="\d+(\.\d+)?"/;
const HEIGHT_REGEX = /height="\d+(\.\d+)?"/;

describe("formatNumber", () => {
  it("returns plain number below 1000", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(1)).toBe("1");
    expect(formatNumber(999)).toBe("999");
  });

  it("formats thousands with K suffix", () => {
    expect(formatNumber(1000)).toBe("1K");
    expect(formatNumber(1200)).toBe("1.2K");
    expect(formatNumber(10_300)).toBe("10.3K");
    expect(formatNumber(115_400)).toBe("115.4K");
    expect(formatNumber(999_999)).toBe("1000K");
  });

  it("formats millions with M suffix", () => {
    expect(formatNumber(1_000_000)).toBe("1M");
    expect(formatNumber(1_200_000)).toBe("1.2M");
    expect(formatNumber(1_500_000)).toBe("1.5M");
    expect(formatNumber(999_999_999)).toBe("1000M");
  });

  it("formats billions with B suffix", () => {
    expect(formatNumber(1_000_000_000)).toBe("1B");
    expect(formatNumber(1_500_000_000)).toBe("1.5B");
    expect(formatNumber(2_000_000_000)).toBe("2B");
  });

  it("strips trailing .0 from formatted numbers", () => {
    expect(formatNumber(1000)).toBe("1K");
    expect(formatNumber(1_000_000)).toBe("1M");
    expect(formatNumber(1_000_000_000)).toBe("1B");
  });
});

describe("escapeXml", () => {
  it("escapes ampersands", () => {
    expect(escapeXml("a&b")).toBe("a&amp;b");
  });

  it("escapes angle brackets", () => {
    expect(escapeXml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes quotes", () => {
    expect(escapeXml('"test"')).toBe("&quot;test&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeXml("'test'")).toBe("&apos;test&apos;");
  });

  it("returns unchanged string with no special chars", () => {
    expect(escapeXml("hello world")).toBe("hello world");
  });

  it("handles empty string", () => {
    expect(escapeXml("")).toBe("");
  });

  it("escapes multiple special characters in one string", () => {
    expect(escapeXml("<a&b\"c'd>")).toBe("&lt;a&amp;b&quot;c&apos;d&gt;");
  });
});

describe("querySchema", () => {
  it("accepts valid GitHub usernames", () => {
    expect(safeParse(querySchema, { username: "tashfiq61" }).success).toBe(
      true
    );
    expect(safeParse(querySchema, { username: "a" }).success).toBe(true);
    expect(safeParse(querySchema, { username: "a".repeat(39) }).success).toBe(
      true
    );
    expect(safeParse(querySchema, { username: "my-org" }).success).toBe(true);
    expect(safeParse(querySchema, { username: "org-name" }).success).toBe(true);
  });

  it("rejects empty username", () => {
    const result = safeParse(querySchema, { username: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing username", () => {
    const result = safeParse(querySchema, {});
    expect(result.success).toBe(false);
  });

  it("rejects 40-char username (over max length)", () => {
    const result = safeParse(querySchema, { username: "a".repeat(40) });
    expect(result.success).toBe(false);
  });

  it("rejects username starting with dash", () => {
    const result = safeParse(querySchema, { username: "-invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects username ending with dash", () => {
    const result = safeParse(querySchema, { username: "invalid-" });
    expect(result.success).toBe(false);
  });

  it("rejects username with special characters", () => {
    expect(safeParse(querySchema, { username: "user@name" }).success).toBe(
      false
    );
    expect(safeParse(querySchema, { username: "user name" }).success).toBe(
      false
    );
    expect(safeParse(querySchema, { username: "user.name" }).success).toBe(
      false
    );
  });

  it("returns specific error messages", () => {
    const empty = safeParse(querySchema, { username: "" });
    expect(empty.success).toBe(false);
    if (!empty.success) {
      expect(empty.issues[0].message).toBeTruthy();
    }

    const tooLong = safeParse(querySchema, { username: "a".repeat(40) });
    expect(tooLong.success).toBe(false);
    if (!tooLong.success) {
      expect(tooLong.issues[0].message).toBeTruthy();
    }
  });

  it("returns valid output type with username field", () => {
    const result = safeParse(querySchema, { username: "test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.username).toBe("test");
    }
  });
});

describe("generateModernBadge", () => {
  it("generates valid SVG with view count", () => {
    const svg = generateModernBadge(42);

    expect(svg).toContain("<svg");
    expect(svg).toContain("PROFILE VISITORS");
    expect(svg).toContain("42");
    expect(svg).toContain("</svg>");
  });

  it("formats large numbers correctly in SVG", () => {
    expect(generateModernBadge(1200)).toContain("1.2K");
    expect(generateModernBadge(10_300)).toContain("10.3K");
    expect(generateModernBadge(115_400)).toContain("115.4K");
    expect(generateModernBadge(1_200_000)).toContain("1.2M");
    expect(generateModernBadge(1_500_000_000)).toContain("1.5B");
  });

  it("includes 3D design elements", () => {
    const svg = generateModernBadge(100);

    expect(svg).toContain('filter="url(#logo-shadow)"');
    expect(svg).toContain('filter="url(#text-3d)"');
    expect(svg).toContain("<circle");
    expect(svg).toContain('stroke="#fff"');
  });

  it("includes GitHub icon", () => {
    const svg = generateModernBadge(1);

    expect(svg).toContain("<path");
    expect(svg).toContain('fill="#fff"');
  });

  it("has accessible attributes", () => {
    const svg = generateModernBadge(999);

    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-labelledby="badge-title badge-desc"');
    expect(svg).toContain('<title id="badge-title">');
    expect(svg).toContain('<desc id="badge-desc">');
  });

  it("is responsive with viewBox and preserveAspectRatio", () => {
    const svg = generateModernBadge(42);

    expect(svg).toContain("viewBox=");
    expect(svg).toContain('preserveAspectRatio="xMinYMid meet"');
    expect(svg).toMatch(WIDTH_REGEX);
    expect(svg).toMatch(HEIGHT_REGEX);
  });

  it("uses system font stack for GitHub README compatibility", () => {
    const svg = generateModernBadge(42);

    expect(svg).toContain("-apple-system");
    expect(svg).toContain("BlinkMacSystemFont");
    expect(svg).toContain("Segoe UI");
    expect(svg).not.toContain("@import");
  });

  it("has geometricPrecision text rendering", () => {
    const svg = generateModernBadge(42);

    expect(svg).toContain('text-rendering="geometricPrecision"');
  });

  it("has tabular-nums on count for alignment", () => {
    const svg = generateModernBadge(42);

    expect(svg).toContain('font-variant-numeric="tabular-nums"');
  });

  it("marks logo group as aria-hidden", () => {
    const svg = generateModernBadge(42);

    expect(svg).toContain('aria-hidden="true"');
  });

  it("uses correct theme colors", () => {
    const svg = generateModernBadge(42);

    expect(svg).toContain('fill="#444444"');
    expect(svg).toContain('fill="#007ec6"');
    expect(svg).toContain('fill="#24292e"');
    expect(svg).toContain('fill="#ffffff"');
  });

  it("has negative viewBox minX for logo overflow", () => {
    const svg = generateModernBadge(42);

    expect(svg).toContain('viewBox="-');
  });

  it("single-digit count has letter-spacing 0", () => {
    const svg = generateModernBadge(1);

    expect(svg).toContain('letter-spacing="0"');
  });

  it("multi-digit count has letter-spacing 2", () => {
    const svg = generateModernBadge(42);

    expect(svg).toContain('letter-spacing="2"');
  });

  it("escapes XML in count (defense in depth)", () => {
    const svg = generateModernBadge(42);

    expect(svg).not.toContain("<script>");
    expect(svg).not.toContain("javascript:");
  });

  it("always produces valid SVG with xmlns", () => {
    for (const count of [0, 1, 42, 999, 1000, 1_000_000, 1_000_000_000]) {
      const svg = generateModernBadge(count);
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain("</svg>");
    }
  });
});
