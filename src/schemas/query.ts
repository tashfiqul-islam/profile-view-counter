import {
  description,
  type InferOutput,
  maxLength,
  maxValue,
  minLength,
  object,
  optional,
  picklist,
  pipe,
  regex,
  string,
  toLowerCase,
  toNumber,
} from "valibot";
import { THEME_NAMES } from "../badge/generator";

const GITHUB_USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
const HEX_COLOR_REGEX = /^[0-9a-fA-F]{6}$/;
/** Largest `base`: a billion views is past any real profile and far inside safe integers. */
const MAX_BASE = 1_000_000_000;
const BASE_ERROR = `base must be a whole number from 0 to ${MAX_BASE}`;

/** A 6-digit hex colour without `#` (a `#` would start the URL fragment), output lowercase. */
const hexColor = (name: string) =>
  optional(
    pipe(
      string(`${name} must be a 6-digit hex colour like 0969da`),
      regex(HEX_COLOR_REGEX, `${name} must be a 6-digit hex colour like 0969da`),
      toLowerCase(),
    ),
  );

/**
 * Query string of `GET /api/view-counter`: a GitHub username, output lowercase because GitHub
 * logins are case-insensitive (`Octocat` and `octocat` are one account, so one counter), plus
 * optional styling and a `base` offset, neither of which changes the stored count.
 */
export const querySchema = object(
  {
    // username first: Valibot reports issues in entry order, and it is the one that matters most.
    username: pipe(
      string("Username must be a single value"),
      minLength(1, "Username is required"),
      maxLength(39, "Username must be 1-39 characters"),
      regex(
        GITHUB_USERNAME_REGEX,
        "Username must be alphanumeric with hyphens, starting and ending with a letter or number",
      ),
      toLowerCase(),
      description("GitHub username (1-39 alphanumeric chars, hyphens allowed), case-insensitive"),
    ),
    color: hexColor("color"),
    label_color: hexColor("label_color"),
    theme: optional(picklist(THEME_NAMES, `theme must be one of: ${THEME_NAMES.join(", ")}`)),
    // Views carried over from another counter: shown on the badge, never stored, so switching
    // keeps a profile's history. Same name other GitHub profile view counters use.
    base: optional(
      pipe(
        string(BASE_ERROR),
        regex(/^\d{1,10}$/, BASE_ERROR),
        toNumber(BASE_ERROR),
        maxValue(MAX_BASE, BASE_ERROR),
      ),
    ),
  },
  "Username is required",
);

/** Validated query parameters of `GET /api/view-counter`. */
export type QueryParams = InferOutput<typeof querySchema>;
