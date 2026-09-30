import { describe, expect, it } from 'vitest'
import {
  applyMarkdownFormat,
  applyMarkdownIndent,
  plainTextFromMarkdown,
  renderMarkdown,
  shouldIndentOnTab,
} from './markdown'

describe('renderMarkdown', () => {
  it('renders bold, italic and inline code', () => {
    const html = renderMarkdown('**negrito** *itálico* `code`')
    expect(html).toContain('<strong>negrito</strong>')
    expect(html).toContain('<em>itálico</em>')
    expect(html).toContain('<code>code</code>')
  })

  it('renders fenced code blocks', () => {
    const html = renderMarkdown('```\nconst x = 1\n```')
    expect(html).toContain('<pre class="markdown-code-block">')
    expect(html).toContain('const x = 1')
  })

  it('renders numeric and alpha lists', () => {
    const numeric = renderMarkdown('1. primeiro\n2. segundo')
    expect(numeric).toContain('<ol class="markdown-list markdown-list-numeric">')
    expect(numeric).toContain('<li>primeiro</li>')

    const alpha = renderMarkdown('a) alternativa A\nb) alternativa B')
    expect(alpha).toContain('<ol class="markdown-list markdown-list-alpha">')
    expect(alpha).toContain('<span class="markdown-list-marker">a)</span>')
  })

  it('escapes html in content', () => {
    const html = renderMarkdown('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it.each([
    '<img src=x onerror=alert(1)>',
    '**<img src=x onerror=alert(1)>**',
    '`<svg onload=alert(1)>`',
    '```\n<script>alert(1)</script>\n```',
    '1. <a href="javascript:alert(1)">x</a>',
    'a) <iframe src="//evil"></iframe>',
    '"><script>alert(1)</script>',
  ])('never emits raw tags from user input: %s', (input) => {
    const container = document.createElement('div')
    container.innerHTML = renderMarkdown(input)
    const allowed = new Set(['STRONG', 'EM', 'CODE', 'PRE', 'OL', 'LI', 'SPAN', 'BR'])
    for (const el of container.querySelectorAll('*')) {
      expect(allowed.has(el.tagName)).toBe(true)
      expect([...el.attributes].every((attr) => attr.name === 'class')).toBe(true)
    }
  })

  it('does not let code block placeholders be injected from content', () => {
    const html = renderMarkdown('__CODE_BLOCK_0__\n```\nx\n```')
    expect(html.startsWith('__CODE_BLOCK_0__')).toBe(true)
    expect(html.match(/<pre/g)).toHaveLength(1)
  })
})

describe('plainTextFromMarkdown', () => {
  it('strips markdown into a single-line excerpt', () => {
    const text = plainTextFromMarkdown('**negrito**\n```\nconst x = 1\n```\nresto')
    expect(text).toBe('negrito resto')
    expect(text).not.toContain('```')
    expect(text).not.toContain('const x')
  })
})

describe('applyMarkdownFormat', () => {
  it('wraps selection in bold markers', () => {
    const result = applyMarkdownFormat('hello world', 0, 5, 'bold')
    expect(result.value).toBe('**hello** world')
    expect(result.selectionStart).toBe(2)
    expect(result.selectionEnd).toBe(7)
  })

  it('inserts code block template when nothing is selected', () => {
    const result = applyMarkdownFormat('texto', 5, 5, 'codeBlock')
    expect(result.value).toBe('texto```\ncódigo\n```')
  })
})

describe('shouldIndentOnTab', () => {
  it('indents multi-line selections', () => {
    expect(shouldIndentOnTab('um\ndois', 0, 7)).toBe(true)
  })

  it('indents list lines', () => {
    expect(shouldIndentOnTab('1. item', 3, 3)).toBe(true)
    expect(shouldIndentOnTab('texto\n  a) item', 12, 12)).toBe(true)
  })

  it('lets Tab move focus on plain text', () => {
    expect(shouldIndentOnTab('texto comum', 3, 3)).toBe(false)
    expect(shouldIndentOnTab('', 0, 0)).toBe(false)
  })
})

describe('applyMarkdownIndent', () => {
  it('indents current line with two spaces on tab', () => {
    const result = applyMarkdownIndent('  texto', 4, 4, 'indent')
    expect(result.value).toBe('    texto')
    expect(result.selectionStart).toBe(6)
  })

  it('outdents line when shift+tab is used', () => {
    const result = applyMarkdownIndent('    texto', 6, 6, 'outdent')
    expect(result.value).toBe('  texto')
    expect(result.selectionStart).toBe(4)
  })

  it('indents all selected lines', () => {
    const result = applyMarkdownIndent('linha1\nlinha2', 0, 11, 'indent')
    expect(result.value).toBe('  linha1\n  linha2')
  })
})
