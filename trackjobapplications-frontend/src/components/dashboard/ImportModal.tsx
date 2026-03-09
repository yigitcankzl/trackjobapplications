import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { importApplications } from '../../services/applications'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import Button from '../ui/Button'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ImportModal({ open, onClose, onSuccess }: Props) {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number; errors: Array<{ row: number; errors: Record<string, string[]> }> } | null>(null)

  useEscapeKey(onClose, open)

  const FIELDS = ['company', 'position', 'status', 'applied_date', 'url', 'source', 'notes']

  function handleFileSelect(f: File) {
    setFile(f)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(l => l.trim())
      const parsed = lines.slice(0, 6).map(l => {
        const cells: string[] = []
        let current = ''
        let inQuotes = false
        for (const ch of l) {
          if (ch === '"') { inQuotes = !inQuotes; continue }
          if (ch === ',' && !inQuotes) { cells.push(current.trim()); current = ''; continue }
          current += ch
        }
        cells.push(current.trim())
        return cells
      })
      if (parsed.length > 0) {
        setHeaders(parsed[0])
        setPreview(parsed.slice(1))
        // Auto-map matching column names
        const autoMap: Record<string, string> = {}
        parsed[0].forEach(h => {
          const lower = h.toLowerCase().replace(/[^a-z_]/g, '')
          if (FIELDS.includes(lower)) autoMap[h] = lower
        })
        setMapping(autoMap)
      }
    }
    if (f.name.endsWith('.csv')) {
      reader.readAsText(f)
    } else {
      // For xlsx just show file name, skip preview
      setHeaders([])
      setPreview([])
      setMapping({})
    }
  }

  async function handleImport() {
    if (!file) return
    setLoading(true)
    try {
      const res = await importApplications(file, Object.keys(mapping).length > 0 ? mapping : undefined)
      setResult(res)
      if (res.created > 0) onSuccess()
    } catch {
      setResult({ created: 0, errors: [{ row: 0, errors: { file: ['Import failed'] } }] })
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setFile(null)
    setPreview([])
    setHeaders([])
    setMapping({})
    setResult(null)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-labelledby="import-modal-title">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto p-6">
        <h2 id="import-modal-title" className="text-lg font-semibold mb-4 dark:text-white">Import Applications</h2>

        {!file ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 transition-colors"
          >
            <p className="text-gray-500 dark:text-gray-400">Click to select a CSV or Excel file</p>
            <p className="text-xs text-gray-400 mt-1">.csv, .xlsx supported</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
          </div>
        ) : result ? (
          <div className="space-y-3">
            <p className="text-sm dark:text-gray-200">
              <span className="font-medium text-emerald-600">{result.created}</span> application(s) imported.
              {result.errors.length > 0 && (
                <span className="ml-2 text-red-500">{result.errors.length} error(s).</span>
              )}
            </p>
            {result.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto text-xs bg-red-50 dark:bg-red-900/20 rounded-lg p-3 space-y-1">
                {result.errors.slice(0, 10).map((err, i) => (
                  <p key={i} className="text-red-600 dark:text-red-400">
                    Row {err.row}: {JSON.stringify(err.errors)}
                  </p>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={handleClose}>Close</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              File: <span className="font-medium">{file.name}</span>
            </p>

            {headers.length > 0 && (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium dark:text-gray-200">Column Mapping</p>
                  <div className="grid grid-cols-2 gap-2">
                    {headers.map(h => (
                      <div key={h} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-28 truncate">{h}</span>
                        <select
                          value={mapping[h] || ''}
                          onChange={e => setMapping(prev => ({ ...prev, [h]: e.target.value }))}
                          className="flex-1 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100"
                        >
                          <option value="">-- skip --</option>
                          {FIELDS.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {preview.length > 0 && (
                  <div className="overflow-x-auto">
                    <p className="text-xs text-gray-400 mb-1">Preview (first {preview.length} rows)</p>
                    <table className="text-xs w-full border-collapse">
                      <thead>
                        <tr>
                          {headers.map(h => (
                            <th key={h} className="border border-gray-200 dark:border-gray-700 px-2 py-1 text-left text-gray-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td key={j} className="border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-600 dark:text-gray-300 truncate max-w-[120px]">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleImport} disabled={loading}>
                {loading ? 'Importing...' : 'Import'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
