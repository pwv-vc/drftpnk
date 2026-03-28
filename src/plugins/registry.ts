import { ContentTypePlugin } from "./types.js";

export class PluginRegistry {
  private plugins: Map<string, ContentTypePlugin> = new Map();

  register(plugin: ContentTypePlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  get(id: string): ContentTypePlugin {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      const available = Array.from(this.plugins.keys()).join(", ");
      throw new Error(`Unknown content type "${id}". Available: ${available}`);
    }
    return plugin;
  }

  has(id: string): boolean {
    return this.plugins.has(id);
  }

  list(): ContentTypePlugin[] {
    return Array.from(this.plugins.values());
  }
}

export const pluginRegistry = new PluginRegistry();
