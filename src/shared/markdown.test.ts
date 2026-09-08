import { describe, expect, it } from 'vitest'
import { applyMarkdownFormat, applyMarkdownIndent, applyMarkdownList, plainTextFromMarkdown, renderMarkdown } from './markdown'

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

describe('applyMarkdownList', () => {
  it('inserts numeric list for multiple lines', () => {
    const result = applyMarkdownList('prefix\n', 7, 7, 'numeric')
    expect(result.value).toBe('prefix\n1. item')
  })

  it('inserts alpha list for selected lines', () => {
    const result = applyMarkdownList('um\ndois', 0, 7, 'alpha')
    expect(result.value).toBe('a) um\nb) dois')
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
