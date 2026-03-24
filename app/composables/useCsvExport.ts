/**
 * Client-side CSV export composable.
 * Generates a CSV string from rows and triggers a browser download.
 */

function escapeCsvValue(value: unknown): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function useCsvExport() {
  function downloadCsv(filename: string, headers: string[], rows: (string | number | null)[][]) {
    const lines = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map(row => row.map(escapeCsvValue).join(',')),
    ]
    const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  return { downloadCsv }
}
