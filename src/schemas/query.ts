import {
  description,
  type InferOutput,
  maxLength,
  minLength,
  object,
  pipe,
  regex,
  string,
  toLowerCase,
} from "valibot";

const GITHUB_USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

/**
 * Query string of `GET /api/view-counter`: a GitHub username, output lowercase because GitHub
 * logins are case-insensitive (`Octocat` and `octocat` are one account, so one counter).
 */
export const querySchema = object(
  {
    username: pipe(
      string("Username is required"),
      minLength(1, "Username is required"),
      maxLength(39, "Username must be 1-39 characters"),
      regex(
        GITHUB_USERNAME_REGEX,
        "Username must be alphanumeric with hyphens, starting and ending with a letter or number",
      ),
      toLowerCase(),
      description("GitHub username (1-39 alphanumeric chars, hyphens allowed), case-insensitive"),
    ),
  },
  "Username is required",
);

/** Validated query parameters of `GET /api/view-counter`. */
export type QueryParams = InferOutput<typeof querySchema>;
