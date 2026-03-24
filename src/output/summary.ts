import pc from 'picocolors'
import { LLMUsage } from '../llm/types.js'

export interface SummaryFile {
  path: string
  sizeBytes: number
}

export interface ImageSummaryInfo {
  model: string
  width: number
  height: number
  aspectRatio: string
  contentType: string
  elapsedMs: number
  falFileSize?: number
}

export interface SummaryData {
  files: SummaryFile[]
  usage?: LLMUsage
  imageInfo?: ImageSummaryInfo
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  return `${kb.toFixed(1)} KB`
}

export function formatCost(amount: number): string {
  if (amount === 0) return '$0.0000'
  if (amount < 0.0001) return `$${amount.toExponential(2)}`
  return `$${amount.toFixed(4)}`
}

export function formatTokens(n: number): string {
  return n.toLocaleString('en-US')
}

export function printSummary(data: SummaryData): void {
  const divider = pc.dim('  ─────────────────────────────────────────')
  console.log()
  console.log(pc.white('  Summary'))
  console.log(divider)

  for (const file of data.files) {
    const size = pc.dim(`(${formatFileSize(file.sizeBytes)})`)
    console.log(`  ${pc.dim('file')}    ${pc.white(file.path)}  ${size}`)
  }

  if (data.imageInfo) {
    const img = data.imageInfo
    const elapsed = (img.elapsedMs / 1000).toFixed(1)
    const dims = img.width && img.height ? `${img.width}×${img.height}` : 'unknown'
    console.log(`  ${pc.dim('image')}   ${pc.white(img.model)}`)
    console.log(`  ${pc.dim('type')}    ${pc.white(img.contentType)}`)
    console.log(`  ${pc.dim('dims')}    ${pc.white(dims)}  ${pc.dim(`(${img.aspectRatio})`)}`)
    console.log(`  ${pc.dim('time')}    ${pc.white(`${elapsed}s`)}`)
  }

  if (data.usage) {
    const u = data.usage
    console.log(`  ${pc.dim('model')}   ${pc.white(u.model)}`)
    console.log(
      `  ${pc.dim('tokens')}  ${pc.white(formatTokens(u.inputTokens))} in · ${pc.white(formatTokens(u.outputTokens))} out · ${pc.white(formatTokens(u.totalTokens))} total`
    )
    console.log(
      `  ${pc.dim('cost')}    ${pc.white(formatCost(u.inputCost))} in · ${pc.white(formatCost(u.outputCost))} out · ${pc.white(formatCost(u.totalCost))} total`
    )
  }

  console.log(divider)
}
