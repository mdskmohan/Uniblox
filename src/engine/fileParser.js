/**
 * fileParser.js
 *
 * Browser-side file parsing utilities. Converts uploaded broker submission
 * files (PDF, Word, Excel, CSV, plain text) into a plain text string that
 * can be passed to the Claude AI analysis pipeline in ai.js.
 *
 * No server required — all parsing runs entirely in the browser using:
 *  - pdfjs-dist  → PDF text extraction
 *  - mammoth     → Word (.docx) text extraction
 *  - xlsx        → Excel (.xlsx / .xls) and CSV parsing
 *
 * Scanned PDFs (image-only, no embedded text) will return an empty or
 * near-empty string — the caller should detect this and warn the user.
 *
 * Exports:
 *  parseFile(file)  → Promise<string>  extracted plain text
 *  getFileIcon(ext) → string           emoji icon for the file type
 *  ACCEPTED_TYPES   → string           accept attribute string for <input type="file">
 */

import * as pdfjsLib from 'pdfjs-dist'
import mammoth       from 'mammoth'
import * as XLSX     from 'xlsx'

// ─── pdfjs worker setup (required by pdfjs-dist in browser) ──────────────────
// Using the bundled worker via Vite's URL import so it gets fingerprinted
// correctly in production builds.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).href

// ─── Accepted MIME / extension list for the file input ───────────────────────
export const ACCEPTED_TYPES =
  '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns a file's extension (lowercase, no dot). */
function ext(file) {
  return file.name.split('.').pop().toLowerCase()
}

/** Reads a File object into an ArrayBuffer. */
function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = (e) => resolve(e.target.result)
    reader.onerror = ()  => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

/** Reads a File object as plain text (UTF-8). */
function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = (e) => resolve(e.target.result)
    reader.onerror = ()  => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

// ─── Parsers ─────────────────────────────────────────────────────────────────

async function parsePDF(file) {
  const buffer   = await readAsArrayBuffer(file)
  const pdf      = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages    = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map((item) => item.str).join(' ')
    pages.push(pageText)
  }

  return pages.join('\n\n').trim()
}

async function parseWord(file) {
  const buffer = await readAsArrayBuffer(file)
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value.trim()
}

function parseExcel(file) {
  return readAsArrayBuffer(file).then((buffer) => {
    const workbook  = XLSX.read(buffer, { type: 'array' })
    const lines     = []

    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName]
      const rows  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

      if (rows.length > 0) {
        lines.push(`=== Sheet: ${sheetName} ===`)
        rows.forEach((row) => {
          const cells = row.map(String).filter((c) => c.trim())
          if (cells.length) lines.push(cells.join(' | '))
        })
        lines.push('')
      }
    })

    return lines.join('\n').trim()
  })
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Parses an uploaded file and returns its content as plain text.
 *
 * @param {File} file  - The File object from a file input or drop event
 * @returns {Promise<string>}  Extracted text content
 * @throws {Error}  If the file type is unsupported or parsing fails
 */
export async function parseFile(file) {
  const extension = ext(file)

  switch (extension) {
    case 'pdf':
      return parsePDF(file)

    case 'doc':
    case 'docx':
      return parseWord(file)

    case 'xls':
    case 'xlsx':
    case 'csv':
      return parseExcel(file)

    case 'txt':
      return readAsText(file)

    default:
      throw new Error(`Unsupported file type: .${extension}. Please upload a PDF, Word, Excel, CSV, or text file.`)
  }
}

/**
 * Returns a display icon for a given file extension.
 * Used in the upload UI to show what type of file was loaded.
 *
 * @param {string} extension  - File extension (lowercase, no dot)
 * @returns {string}  Emoji icon
 */
export function getFileIcon(extension) {
  const icons = {
    pdf:  '📄',
    doc:  '📝', docx: '📝',
    xls:  '📊', xlsx: '📊',
    csv:  '📋',
    txt:  '📃',
  }
  return icons[extension] ?? '📁'
}
