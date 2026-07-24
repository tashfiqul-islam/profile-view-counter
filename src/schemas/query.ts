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
    string("Username must be a string"),
    minLength(1, "Username is required"),
    maxLength(39, "Username must be 1-39 characters"),
    regex(
      GITHUB_USERNAME_REGEX,
      "Username must be alphanumeric with hyphens, starting and ending with a letter or number"
    ),
    description("GitHub username (1-39 alphanumeric chars, hyphens allowed)")
  ),
});

export type QueryParams = InferOutput<typeof querySchema>;
