export interface IdeaDocument {
  topic: string
  theme: string
  goals: string[]
  keyIdeas: string[]
  possibleTitles?: string[]
  references?: string[]
  audience?: string
  wordCountTarget?: number
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}
