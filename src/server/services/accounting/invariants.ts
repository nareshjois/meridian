import type { JournalLineInput } from "@/shared/validation/dtos/accounting"

export type JournalInvariantViolation = {
  code:
    | "MIN_LINES"
    | "LINE_AMOUNT"
    | "LINE_EXCLUSIVE"
    | "UNBALANCED"
    | "INACTIVE_ACCOUNT"
  message: string
}

export function sumDebits(lines: readonly JournalLineInput[]): number {
  return lines.reduce((sum, line) => sum + line.debitCents, 0)
}

export function sumCredits(lines: readonly JournalLineInput[]): number {
  return lines.reduce((sum, line) => sum + line.creditCents, 0)
}

/** Validates double-entry journal lines before persistence. */
export function validateJournalLines(
  lines: readonly JournalLineInput[],
): JournalInvariantViolation | null {
  if (lines.length < 2) {
    return {
      code: "MIN_LINES",
      message: "A journal entry must have at least two lines.",
    }
  }

  for (const [index, line] of lines.entries()) {
    if (line.debitCents < 0 || line.creditCents < 0) {
      return {
        code: "LINE_AMOUNT",
        message: `Line ${index + 1} cannot have negative amounts.`,
      }
    }

    const hasDebit = line.debitCents > 0
    const hasCredit = line.creditCents > 0
    if (hasDebit === hasCredit) {
      return {
        code: "LINE_EXCLUSIVE",
        message: `Line ${index + 1} must have either a debit or a credit, not both or neither.`,
      }
    }
  }

  const debits = sumDebits(lines)
  const credits = sumCredits(lines)
  if (debits !== credits) {
    return {
      code: "UNBALANCED",
      message: `Debits (${debits}) must equal credits (${credits}).`,
    }
  }

  if (debits === 0) {
    return {
      code: "UNBALANCED",
      message: "Journal entry total must be greater than zero.",
    }
  }

  return null
}
