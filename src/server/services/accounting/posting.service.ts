import type { MeridianDb } from "@/server/db/client"
import type { JournalEntry } from "@/server/db/schema/accounting"
import {
  serviceErr,
  serviceOk,
  type ServiceContext,
  type ServiceResult,
} from "@/server/services/_types"
import type { JournalLineInput } from "@/shared/validation/dtos/accounting"

import { validateJournalLines } from "./invariants"
import { createAccountingRepository } from "./repository"

export type PostJournalInput = {
  entryDate: Date
  memo?: string
  lines: JournalLineInput[]
  sourceType: string
  sourceId: string
  eventType: string
  reversalOfEntryId?: string
}

export function createPostingService(db: MeridianDb) {
  const repo = createAccountingRepository(db)

  return {
    async postJournal(
      ctx: ServiceContext,
      input: PostJournalInput,
    ): Promise<ServiceResult<JournalEntry>> {
      const violation = validateJournalLines(input.lines)
      if (violation) {
        return serviceErr({
          code: "INVARIANT_VIOLATION",
          message: violation.message,
        })
      }

      if (!input.reversalOfEntryId) {
        const existing = await repo.findPostingSource(
          ctx.agencyId,
          input.sourceType,
          input.sourceId,
          input.eventType,
        )
        if (existing) {
          const entry = await repo.getEntryById(
            ctx.agencyId,
            existing.journalEntryId,
          )
          if (entry) {
            return serviceOk(entry)
          }
        }
      }

      const accountIds = [...new Set(input.lines.map((line) => line.accountId))]
      const accountRows = await repo.findAccountsByIds(
        ctx.agencyId,
        accountIds,
      )
      if (accountRows.length !== accountIds.length) {
        return serviceErr({
          code: "VALIDATION_ERROR",
          message: "One or more accounts were not found.",
        })
      }

      const inactive = accountRows.find((account) => !account.isActive)
      if (inactive) {
        return serviceErr({
          code: "INVARIANT_VIOLATION",
          message: `Account ${inactive.code} is inactive and cannot be posted to.`,
        })
      }

      const entry = await repo.insertPostedEntry({
        agencyId: ctx.agencyId,
        postedByUserId: ctx.actorUserId,
        entryDate: input.entryDate,
        memo: input.memo,
        reversalOfEntryId: input.reversalOfEntryId,
        lines: input.lines,
        source: {
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          eventType: input.eventType,
        },
      })

      return serviceOk(entry)
    },

    async reverseJournal(
      ctx: ServiceContext,
      entryId: string,
      memo?: string,
    ): Promise<ServiceResult<JournalEntry>> {
      const original = await repo.getEntryById(ctx.agencyId, entryId)
      if (!original) {
        return serviceErr({
          code: "NOT_FOUND",
          message: "Journal entry not found.",
        })
      }

      const existingReversal = await repo.findReversalForEntry(
        ctx.agencyId,
        entryId,
      )
      if (existingReversal) {
        return serviceErr({
          code: "CONFLICT",
          message: "This entry has already been reversed.",
        })
      }

      const lines = await repo.getEntryLines(ctx.agencyId, entryId)
      const reversedLines: JournalLineInput[] = lines.map((line) => ({
        accountId: line.accountId,
        debitCents: line.creditCents,
        creditCents: line.debitCents,
        memo: line.memo ?? undefined,
      }))

      const source = await repo.findPostingSourceForEntry(
        ctx.agencyId,
        entryId,
      )

      return this.postJournal(ctx, {
        entryDate: new Date(),
        memo: memo ?? `Reversal of ${original.entryNumber}`,
        lines: reversedLines,
        sourceType: source?.sourceType ?? "journal_entry",
        sourceId: source?.sourceId ?? original.id,
        eventType: `reversal.${source?.eventType ?? "manual"}`,
        reversalOfEntryId: entryId,
      })
    },
  }
}
