import { RuleConfigSeverity, type UserConfig } from "@commitlint/types";

const ERROR = RuleConfigSeverity.Error;

// Checks PR titles in CI (squash title = commit semantic-release reads) and local commit messages.
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      ERROR,
      "always",
      [
        "feat",
        "fix",
        "perf",
        "refactor",
        "test",
        "docs",
        "style",
        "build",
        "ci",
        "chore",
        "revert",
        "security",
      ],
    ],
    "scope-enum": [
      ERROR,
      "always",
      [
        "api",
        "badge",
        "counter",
        "db",
        "deps",
        "actions",
        "bun",
        "ci",
        "config",
        "docs",
        "release",
        "renovate",
        "test",
        "tooling",
      ],
    ],
    "header-max-length": [ERROR, "always", 100],
    "body-max-line-length": [ERROR, "always", 100],
  },
} satisfies UserConfig;
