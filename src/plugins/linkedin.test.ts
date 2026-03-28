import { describe, it, expect } from "vitest";
import { linkedinPlugin } from "./linkedin.js";
import { IdeaDocument } from "../idea/types.js";
import { Persona } from "../personas/types.js";
import { LLMResponse } from "../llm/types.js";
import { ContentMeta } from "./types.js";

const validIdea: IdeaDocument = {
  topic: "Why AI teams need taste",
  theme: "Building taste like a record collection",
  goals: ["Explain why taste matters"],
  keyIdeas: ["Taste is pattern recognition"],
};

const persona: Persona = {
  id: "test-persona",
  name: "Test Person",
  description: "A test persona",
  style: { voice: [], domains: [], signature_devices: [], tone_rules: [] },
  system_prompt: "You are Test Person.",
};

const meta: ContentMeta = {
  author: "Test Person",
  date: "2026-03-24",
  theme: "Building taste like a record collection",
  persona,
};

describe("linkedinPlugin.validate", () => {
  it("returns valid for a complete idea", () => {
    expect(linkedinPlugin.validate(validIdea)).toEqual({ valid: true, errors: [] });
  });

  it("errors on missing topic", () => {
    const result = linkedinPlugin.validate({ ...validIdea, topic: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing topic");
  });

  it("errors on missing theme", () => {
    const result = linkedinPlugin.validate({ ...validIdea, theme: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing theme");
  });
});

describe("linkedinPlugin.formatOutline", () => {
  it("wraps title in bold", () => {
    const response: LLMResponse = { title: "Hook Line", subtitle: "", body: "Outline body" };
    const result = linkedinPlugin.formatOutline(response);
    expect(result).toContain("**Hook Line**");
  });

  it("includes body after title", () => {
    const response: LLMResponse = { title: "Hook", subtitle: "", body: "Main points here" };
    const result = linkedinPlugin.formatOutline(response);
    expect(result).toContain("Main points here");
  });

  it("omits bold when title is empty", () => {
    const response: LLMResponse = { title: "", subtitle: "", body: "Body only" };
    const result = linkedinPlugin.formatOutline(response);
    expect(result).not.toContain("**");
    expect(result).toContain("Body only");
  });
});

describe("linkedinPlugin.formatContent", () => {
  it("returns trimmed body with no frontmatter", () => {
    const response: LLMResponse = { title: "Hook", subtitle: "", body: "  Post content here.  " };
    const result = linkedinPlugin.formatContent(response, meta);
    expect(result).toBe("Post content here.");
    expect(result).not.toContain("---");
  });

  it("does not include title or author", () => {
    const response: LLMResponse = { title: "ignored", subtitle: "", body: "The post." };
    const result = linkedinPlugin.formatContent(response, meta);
    expect(result).toBe("The post.");
  });
});
