import * as v from 'valibot'

const GITHUB_USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/

export const querySchema = v.object({
  username: v.pipe(
    v.string(),
    v.minLength(1, 'Username is required'),
    v.maxLength(39, 'Username too long'),
    v.regex(GITHUB_USERNAME_REGEX, 'Invalid GitHub username'),
  ),
})

export type QueryParams = v.InferOutput<typeof querySchema>
