import {
  description,
  type InferOutput,
  maxLength,
  minLength,
  object,
  pipe,
  regex,
  string,
} from "valibot";

const GITHUB_USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

export const querySchema = object({
  username: pipe(
    string(),
    minLength(1, "Username is required"),
    maxLength(39, "Username too long"),
    regex(GITHUB_USERNAME_REGEX, "Invalid GitHub username"),
    description("GitHub username (1-39 alphanumeric chars, hyphens allowed)")
  ),
});

export type QueryParams = InferOutput<typeof querySchema>;
