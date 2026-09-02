export function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR')
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: 'Rascunho',
    ready: 'Pronta',
    closed: 'Arquivada',
    generated: 'PDF gerado',
    active: 'Ativa',
    archived: 'Arquivada',
    synced: 'Sincronizada',
    pending: 'Pendente',
    error: 'Erro',
  }
  return map[status] ?? status
}

export function downloadText(content: string, filename: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function copyToClipboard(text: string) {
  return navigator.clipboard.writeText(text)
}
