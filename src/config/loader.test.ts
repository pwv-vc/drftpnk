import { describe, it, expect, vi, afterEach } from "vitest";
import { getDefaultConfig, resolveApiKey } from "./loader.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getDefaultConfig", () => {
  it("returns david-thyresson as default persona", () => {
    expect(getDefaultConfig().default_persona).toBe("david-thyresson");
  });

  it("returns blog-post as default content type", () => {
    expect(getDefaultConfig().default_content_type).toBe("blog-post");
  });

  it("returns openai as default LLM provider", () => {
    expect(getDefaultConfig().llm.provider).toBe("openai");
  });

  it("returns gpt-4o as default model", () => {
    expect(getDefaultConfig().llm.model).toBe("gpt-4o");
  });

  it("returns 0.7 as default temperature", () => {
    expect(getDefaultConfig().llm.temperature).toBe(0.7);
  });

  it("returns 4000 as default maxTokens", () => {
    expect(getDefaultConfig().llm.maxTokens).toBe(4000);
  });

  it("returns auto_save true for outline config", () => {
    expect(getDefaultConfig().outline.auto_save).toBe(true);
  });
});

describe("resolveApiKey", () => {
  it("returns OPENAI_API_KEY env var when set", () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-from-env");
    const config = getDefaultConfig();
    expect(resolveApiKey(config)).toBe("sk-from-env");
  });

  it("returns config apiKey when env var is not set", () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const config = {
      ...getDefaultConfig(),
      llm: { ...getDefaultConfig().llm, apiKey: "sk-from-config" },
    };
    expect(resolveApiKey(config)).toBe("sk-from-config");
  });

  it("throws when neither env var nor config key is set", () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const config = getDefaultConfig();
    expect(() => resolveApiKey(config)).toThrow("No API key found");
  });

  it("error message mentions OPENAI_API_KEY", () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const config = getDefaultConfig();
    expect(() => resolveApiKey(config)).toThrow("OPENAI_API_KEY");
  });

  it("prefers env var over config apiKey", () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-env-wins");
    const config = {
      ...getDefaultConfig(),
      llm: { ...getDefaultConfig().llm, apiKey: "sk-config" },
    };
    expect(resolveApiKey(config)).toBe("sk-env-wins");
  });
});
