import { describe, expect, test } from "bun:test";
import { cli, labelsFor, RELEASE_RULES, releaseRulesFrom } from "./pr-labels";

describe("labelsFor (against the real .releaserc.json rules)", () => {
  test.each([
    ["feat(badge): retina scaling", "feat", "minor"],
    ["fix: handle empty arrays", "fix", "patch"],
    ["perf(badge): faster render", "perf", "patch"],
    ["security: rotate key handling", "security", "patch"],
    ["revert: undo the thing", "revert", "patch"],
    ["chore(deps): update hono", "chore", "patch"],
    ["chore(bun): update bun", "chore", "none"],
    ["chore(tooling): bump hk", "chore", "none"],
    ["chore(actions): update checkout", "chore", "none"],
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

  test.each([
    "Details.\n\nBREAKING CHANGE: renamed X",
    "BREAKING-CHANGE: renamed X",
    "BREAKING CHANGE renamed X",
    "* BREAKING CHANGE: renamed X",
    "breaking change: renamed X",
  ])("a breaking-change note in the body is a major release: %p", (body) => {
    expect(labelsFor("fix: rename env var", body)).toEqual({ type: "fix", release: "major" });
  });

  test("mentioning breaking changes in prose is not a note", () => {
    expect(labelsFor("fix: x", "No BREAKING CHANGE here.")).toEqual({
      type: "fix",
      release: "patch",
    });
  });

  test("a GitHub revert PR releases a patch only with the parser's revert line", () => {
    expect(labelsFor('Revert "feat: x"', "This reverts commit abc1234.")).toEqual({
      type: "revert",
      release: "patch",
    });
    expect(labelsFor('Revert "feat: x"', "Reverts owner/repo#55")).toEqual({
      type: "revert",
      release: "none",
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

/** A semantic-release config whose commit-analyzer has the given rules. */
const analyzer = (releaseRules: unknown) => ({
  plugins: ["@semantic-release/github", ["@semantic-release/commit-analyzer", { releaseRules }]],
});

describe("releaseRulesFrom", () => {
  test("keeps rules in order and skips entries without a release", () => {
    expect(
      releaseRulesFrom(analyzer([{ type: "fix", release: "patch" }, { note: 1 }, null])),
    ).toEqual([{ type: "fix", release: "patch" }]);
  });

  test("is empty without the analyzer plugin or its rules", () => {
    expect(releaseRulesFrom({ plugins: ["@semantic-release/github"] })).toEqual([]);
    expect(releaseRulesFrom({ plugins: [["@semantic-release/commit-analyzer"]] })).toEqual([]);
    expect(releaseRulesFrom(analyzer("not a list"))).toEqual([]);
  });

  test("throws on a release commit-analyzer does not know", () => {
    expect(() => releaseRulesFrom(analyzer([{ type: "fix", release: "Patch" }]))).toThrow(
      'Unknown release "Patch" in .releaserc.json',
    );
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
