export interface ExtractResult {
  text: string;
  warning?: string;
}

const MAX_EXTRACTED_CHARS = 50_000;

/**
 * Best-effort text extraction for the file types Estadi can auto-read.
 * Returns an empty string (with a warning) for unsupported types rather
 * than throwing, so a file upload never fails the whole "save note" action.
 */
export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<ExtractResult> {
  const lowerName = filename.toLowerCase();

  try {
    if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
      const { PDFParse, PasswordException, InvalidPDFException } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        const text = truncate(stripPdfPageMarkers(result.text));
        if (!text) {
          return {
            text: "",
            warning:
              "This PDF has no extractable text — it's likely a scanned/photographed document with no text layer. Estadi can't OCR images yet, so paste the text in manually.",
          };
        }
        return { text };
      } catch (err) {
        if (err instanceof PasswordException) {
          return { text: "", warning: "This PDF is password-protected. Remove the password and re-upload, or paste the text manually." };
        }
        if (err instanceof InvalidPDFException) {
          return { text: "", warning: "This file doesn't look like a valid PDF — it may be corrupted. Try re-exporting it, or paste the text manually." };
        }
        throw err;
      } finally {
        await parser.destroy();
      }
    }

    if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      lowerName.endsWith(".docx")
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return { text: truncate(result.value) };
    }

    if (mimeType.startsWith("text/") || lowerName.endsWith(".txt") || lowerName.endsWith(".md")) {
      return { text: truncate(buffer.toString("utf-8")) };
    }

    return {
      text: "",
      warning:
        "Estadi can only auto-read PDF, DOCX, and TXT/MD files right now. The file was saved, but you'll need to paste the text manually to generate quizzes or flashcards from it.",
    };
  } catch (err) {
    return {
      text: "",
      warning: `Couldn't read text from this file: ${err instanceof Error ? err.message : "unknown error"}. Try re-saving/re-exporting it, or paste the text manually.`,
    };
  }
}

/** Strips pdf-parse's inter-page "-- N of M --" markers from extracted text. */
function stripPdfPageMarkers(text: string): string {
  return text.replace(/--\s*\d+\s+of\s+\d+\s*--/g, "");
}

function truncate(text: string): string {
  const cleaned = text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return cleaned.length > MAX_EXTRACTED_CHARS ? cleaned.slice(0, MAX_EXTRACTED_CHARS) : cleaned;
}
