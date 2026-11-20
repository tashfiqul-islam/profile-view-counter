import { describe, expect, test } from "bun:test";
import { cli, labelsFor, RELEASE_RULES } from "./pr-labels";

describe("labelsFor (against the real .releaserc.json rules)", () => {
  test.each([
    ["feat(badge): retina scaling", "feat", "minor"],
    ["fix: handle empty arrays", "fix", "patch"],
    ["perf(badge): faster render", "perf", "patch"],
    ["security: rotate key handling", "security", "patch"],
    ["revert: undo the thing", "revert", "patch"],
    ["chore(deps): update zod", "chore", "patch"],
    ["chore(bun): update bun", "chore", "patch"],
    ["chore(tooling): bump hk", "chore", "none"],
    ["docs: rewrite readme", "docs", "none"],
    ["ci(actions): tweak workflow", "ci", "none"],
    ["refactor: tidy", "refactor", "none"],
  ] as const)("%s → type: %s, release: %s", (title, type, release) => {
    expect(labelsFor(title, "")).toEqual({ type, release });
  });

  test("a ! in the header is a major release", () => {
    expect(labelsFor("feat(badge)!: drop the logo", "")).toEqual({
      type: "feat",
      release: "major",
    });
  });

  test("a BREAKING CHANGE footer in the body is a major release", () => {
    expect(labelsFor("fix: rename env var", "Details.\n\nBREAKING CHANGE: renamed X")).toEqual({
      type: "fix",
      release: "major",
    });
  });

  test.each(["Update stuff", "feat:no space", "feat(): ", ""])(
    "rejects a non-conventional title: %p",
    (title) => {
      expect(labelsFor(title, "")).toBeUndefined();
    },
  );

  test("reads rules straight from .releaserc.json", () => {
    expect(RELEASE_RULES).toContainEqual({ type: "feat", release: "minor" });
    expect(RELEASE_RULES).toContainEqual({ breaking: true, release: "major" });
  });
});

/** Release impact of a title under the given rules. */
const release = (title: string, rules: Parameters<typeof labelsFor>[2]) =>
  labelsFor(title, "", rules)?.release;

describe("labelsFor (commit-analyzer semantics)", () => {
  test("regression: a later `false` rule overrides an earlier match (it hid dep releases)", () => {
    const rules = [
      { type: "chore", scope: "deps", release: "patch" },
      { type: "chore", release: false },
    ] as const;
    expect(release("chore(deps): lock file maintenance", rules)).toBe("none");
  });

  test("a match after `false` wins again", () => {
    expect(
      release("chore: x", [
        { type: "chore", release: false },
        { type: "chore", release: "minor" },
      ]),
    ).toBe("minor");
  });

  test("a higher earlier match is kept over a lower later one", () => {
    expect(
      release("chore: x", [
        { type: "chore", release: "minor" },
        { type: "chore", release: "patch" },
      ]),
    ).toBe("minor");
  });

  test("major stops the scan, so a later `false` cannot cancel it", () => {
    expect(
      release("feat!: x", [
        { breaking: true, release: "major" },
        { type: "feat", release: false },
      ]),
    ).toBe("major");
  });

  test("with no custom match, the plugin defaults apply", () => {
    expect(release("feat: x", [])).toBe("minor");
    expect(release("fix: x", [])).toBe("patch");
    expect(release("docs: x", [])).toBe("none");
  });

  test("a custom `false` match does not fall back to the defaults", () => {
    expect(release("feat: x", [{ type: "feat", release: false }])).toBe("none");
  });
});

describe("cli", () => {
  test("prints GITHUB_OUTPUT lines", () => {
    expect(cli({ PR_TITLE: "feat(badge): x", PR_BODY: "" })).toBe("type=feat\nrelease=minor\n");
  });

  test("throws on a non-conventional title", () => {
    expect(() => cli({ PR_TITLE: "Update stuff" })).toThrow("Not a conventional commit title");
    expect(() => cli({})).toThrow("(empty)");
  });
});
