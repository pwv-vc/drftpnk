import { describe, it, expect } from 'vitest'
import { getOutputPath } from './writer.js'
import { join } from 'path'

describe('getOutputPath', () => {
  it('generates blog-post outline path', () => {
    expect(getOutputPath('idea.md', 'blog-post', 'outline')).toBe('idea.blog-post.outline.md')
  })

  it('generates blog-post content path', () => {
    expect(getOutputPath('idea.md', 'blog-post', 'content')).toBe('idea.blog-post.md')
  })

  it('generates tweet outline path', () => {
    expect(getOutputPath('idea.md', 'tweet', 'outline')).toBe('idea.tweet.outline.md')
  })

  it('generates tweet content path', () => {
    expect(getOutputPath('idea.md', 'tweet', 'content')).toBe('idea.tweet.md')
  })

  it('generates linkedin outline path', () => {
    expect(getOutputPath('idea.md', 'linkedin', 'outline')).toBe('idea.linkedin.outline.md')
  })

  it('generates linkedin content path', () => {
    expect(getOutputPath('idea.md', 'linkedin', 'content')).toBe('idea.linkedin.md')
  })

  it('preserves directory from input path', () => {
    const result = getOutputPath('/some/dir/idea.md', 'blog-post', 'outline')
    expect(result).toBe(join('/some/dir', 'idea.blog-post.outline.md'))
  })

  it('strips .md extension from base filename', () => {
    expect(getOutputPath('my-idea.md', 'blog-post', 'content')).toBe('my-idea.blog-post.md')
  })
})
