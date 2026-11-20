import { safeParse } from "valibot";
import { describe, expect, it } from "vitest";
import { querySchema } from "./query";

describe("querySchema", () => {
  it("accepts valid GitHub usernames", () => {
    expect(safeParse(querySchema, { username: "tashfiq61" }).success).toBe(true);
    expect(safeParse(querySchema, { username: "a" }).success).toBe(true);
    expect(safeParse(querySchema, { username: "a".repeat(39) }).success).toBe(true);
    expect(safeParse(querySchema, { username: "my-org" }).success).toBe(true);
    expect(safeParse(querySchema, { username: "org-name" }).success).toBe(true);
  });

  it("rejects empty username", () => {
    const result = safeParse(querySchema, { username: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing username", () => {
    const result = safeParse(querySchema, {});
    expect(result.success).toBe(false);
  });

  it("rejects 40-char username (over max length)", () => {
    const result = safeParse(querySchema, { username: "a".repeat(40) });
    expect(result.success).toBe(false);
  });

  it("rejects username starting with dash", () => {
    const result = safeParse(querySchema, { username: "-invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects username ending with dash", () => {
    const result = safeParse(querySchema, { username: "invalid-" });
    expect(result.success).toBe(false);
  });

  it("rejects username with special characters", () => {
    expect(safeParse(querySchema, { username: "user@name" }).success).toBe(false);
    expect(safeParse(querySchema, { username: "user name" }).success).toBe(false);
    expect(safeParse(querySchema, { username: "user.name" }).success).toBe(false);
  });

  it.each([
    ["", "Username is required"],
    ["a".repeat(40), "Username must be 1-39 characters"],
    [
      "-dash",
      "Username must be alphanumeric with hyphens, starting and ending with a letter or number",
    ],
  ])("rejects %j with a specific message", (username, message) => {
    expect(safeParse(querySchema, { username }).issues?.[0]?.message).toBe(message);
  });

  it("returns the username as output", () => {
    expect(safeParse(querySchema, { username: "test" }).output).toEqual({ username: "test" });
  });

  it("lowercases the username, since GitHub logins are case-insensitive", () => {
    expect(safeParse(querySchema, { username: "Octo-Cat" }).output).toEqual({
      username: "octo-cat",
    });
  });

  it("reports a missing username as required", () => {
    expect(safeParse(querySchema, {}).issues?.[0]?.message).toBe("Username is required");
  });
});
