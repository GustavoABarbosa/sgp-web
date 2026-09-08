export type MarkdownFormat = 'bold' | 'italic' | 'code' | 'codeBlock'
export type ListStyle = 'numeric' | 'alpha'

const INDENT = '  '
const NUMERIC_LIST = /^(\d+)\.\s+(.*)$/
const ALPHA_LIST = /^([a-z])\)\s+(.*)$/i

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderInlineMarkdown(text: string): string {
  let html = escapeHtml(text)
  html = html.replace(/`([^`\n]+?)`/g, '<code>$1</code>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  return html
}

function renderLines(lines: string[]): string {
  const parts: string[] = []
  const textBuffer: string[] = []
  let index = 0

  const flushTextLines = () => {
    if (!textBuffer.length) return
    parts.push(textBuffer.map((line) => renderInlineMarkdown(line)).join('<br>'))
    textBuffer.length = 0
  }

  while (index < lines.length) {
    const line = lines[index]
    const numericMatch = line.match(NUMERIC_LIST)
    const alphaMatch = line.match(ALPHA_LIST)

    if (numericMatch) {
      flushTextLines()
      const items: string[] = []

      while (index < lines.length) {
        const match = lines[index].match(NUMERIC_LIST)
        if (!match) break
        items.push(`<li>${renderInlineMarkdown(match[2])}</li>`)
        index++
      }

      parts.push(`<ol class="markdown-list markdown-list-numeric">${items.join('')}</ol>`)
      continue
    }

    if (alphaMatch) {
      flushTextLines()
      const items: string[] = []

      while (index < lines.length) {
        const match = lines[index].match(ALPHA_LIST)
        if (!match) break
        items.push(
          `<li><span class="markdown-list-marker">${match[1].toLowerCase()})</span>${renderInlineMarkdown(match[2])}</li>`,
        )
        index++
      }

      parts.push(`<ol class="markdown-list markdown-list-alpha">${items.join('')}</ol>`)
      continue
    }

    textBuffer.push(line)
    index++
  }

  flushTextLines()
  return parts.join('<br>')
}

export function renderMarkdown(text: string): string {
  if (!text) return ''

  const codeBlocks: string[] = []
  const placeholder = (blockIndex: number) => `__CODE_BLOCK_${blockIndex}__`

  let processed = text.replace(/```([\s\S]*?)```/g, (_, code: string) => {
    const index = codeBlocks.length
    codeBlocks.push(
      `<pre class="markdown-code-block"><code>${escapeHtml(code.trim())}</code></pre>`,
    )
    return placeholder(index)
  })

  const html = renderLines(processed.split('\n'))

  return codeBlocks.reduce(
    (result, block, blockIndex) => result.replace(placeholder(blockIndex), block),
    html,
  )
}

export function plainTextFromMarkdown(text: string): string {
  if (!text) return ''

  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`\n]+?)`/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*[a-z]\)\s+/gim, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function applyMarkdownFormat(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  format: MarkdownFormat,
): { value: string; selectionStart: number; selectionEnd: number } {
  const selected = value.slice(selectionStart, selectionEnd)

  let before = ''
  let after = ''
  let replacement = selected

  switch (format) {
    case 'bold':
      before = '**'
      after = '**'
      replacement = selected || 'texto em negrito'
      break
    case 'italic':
      before = '*'
      after = '*'
      replacement = selected || 'texto em itálico'
      break
    case 'code':
      before = '`'
      after = '`'
      replacement = selected || 'código'
      break
    case 'codeBlock':
      before = '```\n'
      after = '\n```'
      replacement = selected || 'código'
      break
  }

  const nextValue = value.slice(0, selectionStart) + before + replacement + after + value.slice(selectionEnd)
  const nextSelectionStart = selectionStart + before.length
  const nextSelectionEnd = nextSelectionStart + replacement.length

  return {
    value: nextValue,
    selectionStart: nextSelectionStart,
    selectionEnd: nextSelectionEnd,
  }
}

export function applyMarkdownList(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  style: ListStyle,
): { value: string; selectionStart: number; selectionEnd: number } {
  const selected = value.slice(selectionStart, selectionEnd)
  const lines = selected ? selected.split('\n') : ['item']

  const formatted = lines
    .map((line, index) => {
      const content = line.trim() ? line : 'item'
      if (style === 'numeric') return `${index + 1}. ${content}`
      const letter = String.fromCharCode('a'.charCodeAt(0) + index)
      return `${letter}) ${content}`
    })
    .join('\n')

  const nextValue = value.slice(0, selectionStart) + formatted + value.slice(selectionEnd)
  const nextSelectionStart = selectionStart
  const nextSelectionEnd = selectionStart + formatted.length

  return {
    value: nextValue,
    selectionStart: nextSelectionStart,
    selectionEnd: nextSelectionEnd,
  }
}

function getAffectedLineRange(value: string, selectionStart: number, selectionEnd: number) {
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
  const lineEndIndex = value.indexOf('\n', selectionEnd)
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex

  return { lineStart, lineEnd }
}

export function applyMarkdownIndent(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  direction: 'indent' | 'outdent',
): { value: string; selectionStart: number; selectionEnd: number } {
  const { lineStart, lineEnd } = getAffectedLineRange(value, selectionStart, selectionEnd)
  const block = value.slice(lineStart, lineEnd)
  const lines = block.split('\n')

  const indentedLines = lines.map((line) => {
    if (direction === 'indent') return INDENT + line

    if (line.startsWith(INDENT)) return line.slice(INDENT.length)
    if (line.startsWith('\t')) return line.slice(1)
    return line
  })

  const indented = indentedLines.join('\n')
  const nextValue = value.slice(0, lineStart) + indented + value.slice(lineEnd)

  let selectionStartDelta = 0
  let selectionEndDelta = 0
  let offset = lineStart

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    let lineDelta = 0

    if (direction === 'indent') lineDelta = INDENT.length
    else if (line.startsWith(INDENT)) lineDelta = -INDENT.length
    else if (line.startsWith('\t')) lineDelta = -1

    if (selectionStart >= offset) selectionStartDelta += lineDelta
    if (selectionEnd > offset) selectionEndDelta += lineDelta

    offset += line.length + (index < lines.length - 1 ? 1 : 0)
  }

  return {
    value: nextValue,
    selectionStart: selectionStart + selectionStartDelta,
    selectionEnd: selectionEnd + selectionEndDelta,
  }
}
