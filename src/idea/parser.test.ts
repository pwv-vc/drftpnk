import { describe, it, expect } from 'vitest'
import { parseIdeaContent } from './parser.js'

const FULL_IDEA = `# Topic
Why AI teams need taste

## Theme / Metaphor
Building taste like building a record collection

## Goals
- Explain why taste matters
- Connect to venture judgment

## Key Ideas / Bullets
- Taste is pattern recognition
- Teams with taste compound
- You can't hire taste, but you can spot it

## Possible Titles
- Taste Compounds
- The Record Collection Theory

## References / Examples
- Daft Punk's approach to sampling

## Audience
Founders and investors

## Word Count Target
900 words
`

describe('parseIdeaContent', () => {
  it('parses a full valid idea document', () => {
    const doc = parseIdeaContent(FULL_IDEA)
    expect(doc.topic).toBe('Why AI teams need taste')
    expect(doc.theme).toBe('Building taste like building a record collection')
    expect(doc.goals).toEqual(['Explain why taste matters', 'Connect to venture judgment'])
    expect(doc.keyIdeas).toEqual([
      'Taste is pattern recognition',
      'Teams with taste compound',
      "You can't hire taste, but you can spot it",
    ])
    expect(doc.possibleTitles).toEqual(['Taste Compounds', 'The Record Collection Theory'])
    expect(doc.references).toEqual(["Daft Punk's approach to sampling"])
    expect(doc.audience).toBe('Founders and investors')
    expect(doc.wordCountTarget).toBe(900)
  })

  it('parses topic from h1 header', () => {
    const doc = parseIdeaContent(FULL_IDEA)
    expect(doc.topic).toBe('Why AI teams need taste')
  })

  it('parses bullets with - prefix', () => {
    const doc = parseIdeaContent(FULL_IDEA)
    expect(doc.goals[0]).toBe('Explain why taste matters')
  })

  it('parses bullets with * prefix', () => {
    const content = `# Topic
My topic

## Theme / Metaphor
My theme

## Goals
* Goal one
* Goal two

## Key Ideas / Bullets
* Idea one
`
    const doc = parseIdeaContent(content)
    expect(doc.goals).toEqual(['Goal one', 'Goal two'])
  })

  it('returns undefined for absent optional sections', () => {
    const minimal = `# Topic
My topic

## Theme / Metaphor
My theme

## Goals
- A goal

## Key Ideas / Bullets
- An idea
`
    const doc = parseIdeaContent(minimal)
    expect(doc.possibleTitles).toBeUndefined()
    expect(doc.references).toBeUndefined()
    expect(doc.audience).toBeUndefined()
    expect(doc.wordCountTarget).toBeUndefined()
  })

  it('parses word count from "900 words" format', () => {
    const doc = parseIdeaContent(FULL_IDEA)
    expect(doc.wordCountTarget).toBe(900)
  })

  it('parses word count from plain number', () => {
    const content = `# Topic
My topic

## Theme / Metaphor
My theme

## Goals
- A goal

## Key Ideas / Bullets
- An idea

## Word Count Target
1200
`
    const doc = parseIdeaContent(content)
    expect(doc.wordCountTarget).toBe(1200)
  })

  it('throws with exact message when Theme / Metaphor is missing', () => {
    const content = `# Topic
My topic

## Goals
- A goal

## Key Ideas / Bullets
- An idea
`
    expect(() => parseIdeaContent(content, 'idea.md')).toThrow(
      'Missing required section "Theme / Metaphor" in idea.md'
    )
  })

  it('throws when Goals is missing', () => {
    const content = `# Topic
My topic

## Theme / Metaphor
My theme

## Key Ideas / Bullets
- An idea
`
    expect(() => parseIdeaContent(content, 'idea.md')).toThrow(
      'Missing required section "Goals" in idea.md'
    )
  })

  it('throws when Key Ideas / Bullets is missing', () => {
    const content = `# Topic
My topic

## Theme / Metaphor
My theme

## Goals
- A goal
`
    expect(() => parseIdeaContent(content, 'idea.md')).toThrow(
      'Missing required section "Key Ideas / Bullets" in idea.md'
    )
  })

  it('throws when a required section is empty', () => {
    const content = `# Topic
My topic

## Theme / Metaphor

## Goals
- A goal

## Key Ideas / Bullets
- An idea
`
    expect(() => parseIdeaContent(content, 'idea.md')).toThrow(
      'Missing required section "Theme / Metaphor" in idea.md'
    )
  })

  it('uses provided filePath in error message', () => {
    const content = `# Topic
My topic

## Goals
- A goal

## Key Ideas / Bullets
- An idea
`
    expect(() => parseIdeaContent(content, 'my-custom-idea.md')).toThrow(
      'Missing required section "Theme / Metaphor" in my-custom-idea.md'
    )
  })
})
