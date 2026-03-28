import { describe, it, expect } from "vitest";
import { BaseLLMProvider } from "./base.js";

class TestProvider extends BaseLLMProvider {
  public parse(raw: string) {
    return this.parseJsonResponse(raw);
  }
}

const provider = new TestProvider();

describe("BaseLLMProvider.parseJsonResponse", () => {
  it("parses clean JSON", () => {
    const raw = JSON.stringify({ title: "My Title", subtitle: "My Subtitle", body: "My body" });
    expect(provider.parse(raw)).toEqual({
      title: "My Title",
      subtitle: "My Subtitle",
      body: "My body",
    });
  });

  it("strips ```json fences", () => {
    const raw = '```json\n{"title":"T","subtitle":"S","body":"B"}\n```';
    expect(provider.parse(raw)).toEqual({ title: "T", subtitle: "S", body: "B" });
  });

  it("strips plain ``` fences", () => {
    const raw = '```\n{"title":"T","subtitle":"S","body":"B"}\n```';
    expect(provider.parse(raw)).toEqual({ title: "T", subtitle: "S", body: "B" });
  });

  it("extracts JSON embedded in prose", () => {
    const raw = 'Here is the result: {"title":"T","subtitle":"S","body":"B"} done.';
    expect(provider.parse(raw)).toEqual({ title: "T", subtitle: "S", body: "B" });
  });

  it("defaults missing fields to empty string", () => {
    const raw = '{"title":"T"}';
    expect(provider.parse(raw)).toEqual({ title: "T", subtitle: "", body: "" });
  });

  it("falls back to raw text when no JSON found", () => {
    const raw = "This is just plain text with no JSON.";
    expect(provider.parse(raw)).toEqual({ title: "", subtitle: "", body: raw });
  });

  it("falls back to raw text on invalid JSON", () => {
    const raw = "{invalid json here}";
    expect(provider.parse(raw)).toEqual({ title: "", subtitle: "", body: raw });
  });

  it("falls back on empty string", () => {
    expect(provider.parse("")).toEqual({ title: "", subtitle: "", body: "" });
  });
});
