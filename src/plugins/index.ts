import { pluginRegistry } from './registry.js'
import { blogPostPlugin } from './blog-post.js'
import { tweetPlugin } from './tweet.js'
import { linkedinPlugin } from './linkedin.js'

pluginRegistry.register(blogPostPlugin)
pluginRegistry.register(tweetPlugin)
pluginRegistry.register(linkedinPlugin)

export { pluginRegistry }
export { blogPostPlugin } from './blog-post.js'
export { tweetPlugin } from './tweet.js'
export { linkedinPlugin } from './linkedin.js'
export type { ContentTypePlugin, ContentMeta, PluginStructure } from './types.js'
