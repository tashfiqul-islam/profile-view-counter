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

describe("querySchema styling", () => {
  it("accepts every theme and lowercases hex colours", () => {
    expect(
      safeParse(querySchema, {
        color: "E11D48",
        label_color: "0F172A",
        theme: "aurora",
        username: "octocat",
      }).output,
    ).toEqual({ color: "e11d48", label_color: "0f172a", theme: "aurora", username: "octocat" });
  });

  it.each([
    [
      { theme: "neon" },
      "theme must be one of: graphite, aurora, mono, paper, contribution, adaptive",
    ],
    [{ color: "#0969da" }, "color must be a 6-digit hex colour like 0969da"],
    [{ color: "fff" }, "color must be a 6-digit hex colour like 0969da"],
    [{ label_color: "gggggg" }, "label_color must be a 6-digit hex colour like 0969da"],
  ])("rejects %j", (style, message) => {
    expect(safeParse(querySchema, { username: "octocat", ...style }).issues?.[0]?.message).toBe(
      message,
    );
  });
});

describe("querySchema input shape", () => {
  it("names a repeated username instead of calling it missing", () => {
    expect(safeParse(querySchema, { username: ["a", "b"] }).issues?.[0]?.message).toBe(
      "Username must be a single value",
    );
  });

  it("reports the username issue before a styling issue", () => {
    expect(safeParse(querySchema, { theme: "neon", username: "-bad" }).issues?.[0]?.message).toBe(
      "Username must be alphanumeric with hyphens, starting and ending with a letter or number",
    );
  });
});
