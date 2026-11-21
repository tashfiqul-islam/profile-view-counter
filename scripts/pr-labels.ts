/**
 * Labels for a pull request, derived from its title: `type: <type>` and `release: <impact>`.
 *
 * PRs are squash-merged, so the title becomes the commit semantic-release reads and the body becomes
 * its message. The release impact is computed from `.releaserc.json`'s own `releaseRules`, so the
 * label can never disagree with what the release job will do. Used by `.github/workflows/pr.yml`.
 *
 * @module
 */

import releaserc from "../.releaserc.json" with { type: "json" };

/** What a merge of this PR will release. */
export type ReleaseImpact = "major" | "minor" | "patch" | "none";

/** The two managed labels for a PR. */
export interface PrLabels {
  /** Conventional commit type, e.g. `feat`; becomes the `type: <type>` label. */
  readonly type: string;
  /** Becomes the `release: <impact>` label. */
  readonly release: ReleaseImpact;
}

/** One commit-analyzer release rule, as written in `.releaserc.json`. */
export interface ReleaseRule {
  readonly type?: string;
  readonly scope?: string;
  readonly breaking?: boolean;
  readonly release: Exclude<ReleaseImpact, "none"> | false;
}

/** `type(scope)!: subject`, the conventional commit header. */
const HEADER = /^(?<type>[a-z]+)(?:\((?<scope>[^)]*)\))?(?<bang>!)?: \S/;
/** A breaking-change note anywhere in the squash message, as conventional-commits-parser reads it. */
const BREAKING_FOOTER = /^[\s|*]*BREAKING[ -]CHANGE[:\s]+/im;
/** GitHub's default revert PR title, `Revert "…"`. */
const REVERT_TITLE = /^Revert "/;
/** The parser's revert pattern needs this line in the message to mark a revert. */
const REVERT_BODY = /This reverts commit \w+/;

/** commit-analyzer's `RELEASE_TYPES` precedence: a lower index is a bigger release. */
const PRECEDENCE: readonly (ReleaseRule["release"] & string)[] = ["major", "minor", "patch"];

/** commit-analyzer's built-in rules, used when no custom rule matches (conventional subset). */
const DEFAULT_RULES: readonly ReleaseRule[] = [
  { breaking: true, release: "major" },
  { type: "feat", release: "minor" },
  { type: "fix", release: "patch" },
  { type: "perf", release: "patch" },
];

/** The parsed header facts commit-analyzer matches rules against. */
interface Commit {
  readonly type: string;
  readonly scope: string | undefined;
  readonly breaking: boolean;
}

/**
 * Port of commit-analyzer's `analyzeCommit`: matching rules apply in order, each replacing the
 * result when nothing (or `false`) is set yet or when it ranks higher; `false` ranks highest of
 * all, so a later `release: false` rule overrides earlier matches. `major` stops the scan.
 */
function analyze(
  rules: readonly ReleaseRule[],
  commit: Commit,
): ReleaseRule["release"] | undefined {
  let release: ReleaseRule["release"] | undefined;
  for (const rule of rules) {
    const matches = rule.breaking
      ? commit.breaking
      : rule.type === commit.type && (rule.scope === undefined || rule.scope === commit.scope);
    if (!matches) continue;
    const outranks =
      !release ||
      rule.release === false ||
      PRECEDENCE.indexOf(rule.release) < PRECEDENCE.indexOf(release);
    if (outranks) release = rule.release;
    if (release === "major") break;
  }
  return release;
}

const RELEASES: ReadonlySet<unknown> = new Set([...PRECEDENCE, false]);

/** Accepts a rule only with a release commit-analyzer knows; a typo would silently outrank all. */
function isReleaseRule(value: unknown): value is ReleaseRule {
  if (typeof value !== "object" || value === null || !("release" in value)) return false;
  if (!RELEASES.has(value.release)) {
    throw new Error(`Unknown release ${JSON.stringify(value.release)} in .releaserc.json`);
  }
  return true;
}

/**
 * The commit-analyzer `releaseRules` of a semantic-release config.
 *
 * @param config - The parsed `.releaserc.json`.
 * @returns The rules in order; empty when the plugin or its rules are absent.
 * @throws Error when a rule names a release commit-analyzer does not know.
 */
export function releaseRulesFrom(config: { readonly plugins: readonly unknown[] }): ReleaseRule[] {
  return config.plugins.flatMap((plugin) => {
    if (!Array.isArray(plugin) || plugin[0] !== "@semantic-release/commit-analyzer") return [];
    const options: unknown = plugin[1];
    if (typeof options !== "object" || options === null || !("releaseRules" in options)) return [];
    const rules: unknown = options.releaseRules;
    return Array.isArray(rules) ? rules.filter(isReleaseRule) : [];
  });
}

/** The commit-analyzer `releaseRules` from this repo's `.releaserc.json`. */
export const RELEASE_RULES: readonly ReleaseRule[] = releaseRulesFrom(releaserc);

/**
 * Works out the labels for a PR exactly as commit-analyzer will judge its squash commit: the custom
 * rules first, in order (see `analyze`), then commit-analyzer's defaults if no custom rule matched.
 *
 * @param title - PR title, which becomes the squash commit header.
 * @param body - PR body, which becomes the squash commit message.
 * @param rules - Release rules; defaults to {@link RELEASE_RULES}.
 * @returns The labels, or `undefined` when the title is not a conventional commit header.
 * @example
 * ```ts
 * labelsFor('feat(badge): retina scaling', ''); // { type: 'feat', release: 'minor' }
 * labelsFor('chore(deps): update hono', '');     // { type: 'chore', release: 'patch' }
 * ```
 */
export function labelsFor(
  title: string,
  body: string,
  rules: readonly ReleaseRule[] = RELEASE_RULES,
): PrLabels | undefined {
  // GitHub's revert PRs: commit-analyzer patches them only when the message carries the
  // "This reverts commit" line its revert pattern needs; otherwise the commit releases nothing.
  if (REVERT_TITLE.test(title.trim())) {
    return { release: REVERT_BODY.test(body) ? "patch" : "none", type: "revert" };
  }
  const header = HEADER.exec(title.trim())?.groups;
  if (header?.["type"] === undefined) return undefined;
  const { type, scope, bang } = header;
  const commit: Commit = {
    type,
    scope,
    breaking: bang !== undefined || BREAKING_FOOTER.test(body),
  };
  const release = analyze(rules, commit) ?? analyze(DEFAULT_RULES, commit);
  return { type, release: release || "none" };
}

/**
 * CLI: reads `PR_TITLE` and `PR_BODY`, prints `type=…` and `release=…` lines for `$GITHUB_OUTPUT`.
 *
 * @param env - Environment to read; defaults to `Bun.env`.
 * @returns The output lines.
 * @throws Error when the title is not a conventional commit header.
 */
export function cli(env: Record<string, string | undefined> = Bun.env): string {
  const labels = labelsFor(env["PR_TITLE"] ?? "", env["PR_BODY"] ?? "");
  if (labels === undefined) {
    throw new Error(`Not a conventional commit title: ${env["PR_TITLE"] ?? "(empty)"}`);
  }
  return `type=${labels.type}\nrelease=${labels.release}\n`;
}

if (import.meta.main) process.stdout.write(cli());
