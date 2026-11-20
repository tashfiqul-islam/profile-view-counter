/**
 * Keeps the agent docs a router: `AGENTS.md` stays small, every guide in `docs/agents/` stays
 * small, opens with a `Read when:` trigger and is linked from `AGENTS.md`. Run by `bun run check`.
 *
 * @module
 */

/** Byte limit for `AGENTS.md`, which every agent loads on every turn. */
export const ROUTER_MAX_BYTES = 8192;
/** Byte limit for each guide in `docs/agents/`, loaded only when its trigger fires. */
export const GUIDE_MAX_BYTES = 6144;

/** A Markdown file, by repo-relative path with forward slashes. */
export interface Doc {
  /** Repo-relative path, e.g. `docs/agents/testing.md`. */
  readonly path: string;
  /** File contents. */
  readonly content: string;
}

const OPENING = /^# .+\n\nRead when: \S/;

const bytes = (doc: Doc): number => new TextEncoder().encode(doc.content).length;

/**
 * Checks the router and its guides against the size, opening and linking rules.
 *
 * @param router - `AGENTS.md`.
 * @param guides - Every Markdown file in `docs/agents/`.
 * @returns One message per violation; empty when everything holds.
 */
export function checkAgentDocs(router: Doc, guides: readonly Doc[]): string[] {
  const errors: string[] = [];
  if (bytes(router) > ROUTER_MAX_BYTES) {
    errors.push(`${router.path} is ${bytes(router)} bytes; the limit is ${ROUTER_MAX_BYTES}`);
  }
  for (const guide of guides) {
    if (bytes(guide) > GUIDE_MAX_BYTES) {
      errors.push(`${guide.path} is ${bytes(guide)} bytes; the limit is ${GUIDE_MAX_BYTES}`);
    }
    if (!OPENING.test(guide.content)) {
      errors.push(`${guide.path} must open with a "# Title" line, a blank line and "Read when: …"`);
    }
    if (!router.content.includes(`](${guide.path})`)) {
      errors.push(`${guide.path} is not linked from ${router.path}`);
    }
  }
  return errors;
}

/**
 * CLI: reads `AGENTS.md` and `docs/agents/*.md` under `root`, prints violations to stderr.
 *
 * @param root - Repository root; defaults to the current directory.
 * @returns The exit code: 0 when everything holds, 1 otherwise.
 */
export async function cli(root = "."): Promise<number> {
  const router: Doc = { content: await Bun.file(`${root}/AGENTS.md`).text(), path: "AGENTS.md" };
  const paths = await Array.fromAsync(new Bun.Glob("docs/agents/*.md").scan({ cwd: root }));
  const guides = await Promise.all(
    paths
      .map((path) => path.replaceAll("\\", "/"))
      .toSorted()
      .map(async (path): Promise<Doc> => ({
        content: await Bun.file(`${root}/${path}`).text(),
        path,
      })),
  );
  const errors = checkAgentDocs(router, guides);
  for (const error of errors) console.error(error);
  if (errors.length === 0) console.log(`agent docs ok: AGENTS.md + ${guides.length} guides`);
  return errors.length === 0 ? 0 : 1;
}

if (import.meta.main) process.exitCode = await cli();
