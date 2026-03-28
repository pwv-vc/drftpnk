import { describe, it, expect, beforeEach } from "vitest";
import { PluginRegistry } from "./registry.js";
import { ContentTypePlugin } from "./types.js";

function makePlugin(id: string): ContentTypePlugin {
  return {
    id,
    name: `Plugin ${id}`,
    description: `Description for ${id}`,
    structure: { sections: [], wordCountTarget: 100 },
    defaultAspectRatio: "landscape_4_3",
    validate: () => ({ valid: true, errors: [] }),
    defaultOutlinePrompt: () => ({ system: "", user: "" }),
    defaultContentPrompt: () => ({ system: "", user: "" }),
    formatOutline: () => "",
    formatContent: () => "",
  };
}

describe("PluginRegistry", () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  it("registers and retrieves a plugin", () => {
    const plugin = makePlugin("blog-post");
    registry.register(plugin);
    expect(registry.get("blog-post")).toBe(plugin);
  });

  it("has() returns true for registered plugin", () => {
    registry.register(makePlugin("tweet"));
    expect(registry.has("tweet")).toBe(true);
  });

  it("has() returns false for unregistered plugin", () => {
    expect(registry.has("newsletter")).toBe(false);
  });

  it("list() returns all registered plugins", () => {
    registry.register(makePlugin("blog-post"));
    registry.register(makePlugin("tweet"));
    registry.register(makePlugin("linkedin"));
    expect(registry.list()).toHaveLength(3);
    expect(registry.list().map((p) => p.id)).toEqual(["blog-post", "tweet", "linkedin"]);
  });

  it("get() throws for unknown content type", () => {
    registry.register(makePlugin("blog-post"));
    expect(() => registry.get("newsletter")).toThrow('Unknown content type "newsletter"');
  });

  it("get() error message includes available types", () => {
    registry.register(makePlugin("blog-post"));
    registry.register(makePlugin("tweet"));
    expect(() => registry.get("newsletter")).toThrow("blog-post");
  });

  it("registering same id overwrites previous plugin", () => {
    const first = makePlugin("blog-post");
    const second = { ...makePlugin("blog-post"), name: "Updated" };
    registry.register(first);
    registry.register(second);
    expect(registry.get("blog-post").name).toBe("Updated");
  });
});
