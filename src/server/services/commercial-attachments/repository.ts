import { and, asc, eq } from "drizzle-orm"

import type { MeridianDb } from "@/server/db/client"
import { commercialAttachments } from "@/server/db/schema/commercial-attachments"
import { vendors } from "@/server/db/schema/vendors"
import type {
  CommercialDocumentInput,
  VendorQuoteAttachmentInput,
} from "@/shared/validation/dtos/commercial"
import { DEFAULT_CURRENCY } from "@/shared/currency"

export type CommercialEntityType = "quote" | "booking"

export type CommercialAttachmentRow = typeof commercialAttachments.$inferSelect & {
  vendorName: string | null
}

export function createCommercialAttachmentRepository(db: MeridianDb) {
  return {
    async listForEntity(
      agencyId: string,
      entityType: CommercialEntityType,
      entityId: string,
    ) {
      const rows = await db
        .select({
          attachment: commercialAttachments,
          vendorName: vendors.name,
        })
        .from(commercialAttachments)
        .leftJoin(vendors, eq(commercialAttachments.vendorId, vendors.id))
        .where(
          and(
            eq(commercialAttachments.agencyId, agencyId),
            eq(commercialAttachments.entityType, entityType),
            eq(commercialAttachments.entityId, entityId),
          ),
        )
        .orderBy(asc(commercialAttachments.sortOrder))

      return rows.map((row) => ({
        ...row.attachment,
        vendorName: row.vendorName,
      })) satisfies CommercialAttachmentRow[]
    },

    async insertDocuments(
      agencyId: string,
      entityType: CommercialEntityType,
      entityId: string,
      actorUserId: string,
      documents: CommercialDocumentInput[],
      sortOrderStart = 0,
    ) {
      if (documents.length === 0) {
        return
      }

      const now = new Date()
      let sortOrder = sortOrderStart

      for (const doc of documents) {
        await db.insert(commercialAttachments).values({
          id: crypto.randomUUID(),
          agencyId,
          entityType,
          entityId,
          kind: "document",
          label: doc.label.trim(),
          fileName: doc.fileName.trim(),
          storageKey: doc.storageKey?.trim() || null,
          mimeType: doc.mimeType?.trim() || null,
          notes: doc.notes?.trim() || null,
          uploadedByUserId: actorUserId,
          sortOrder,
          createdAt: now,
          updatedAt: now,
        })
        sortOrder += 1
      }
    },

    async insertVendorQuotes(
      agencyId: string,
      entityType: CommercialEntityType,
      entityId: string,
      actorUserId: string,
      vendorQuotes: VendorQuoteAttachmentInput[],
      sortOrderStart = 0,
    ) {
      if (vendorQuotes.length === 0) {
        return
      }

      const now = new Date()
      let sortOrder = sortOrderStart

      for (const quote of vendorQuotes) {
        await db.insert(commercialAttachments).values({
          id: crypto.randomUUID(),
          agencyId,
          entityType,
          entityId,
          kind: "vendor_quote",
          label: quote.label.trim(),
          fileName: quote.fileName?.trim() || null,
          storageKey: quote.storageKey?.trim() || null,
          vendorId: quote.vendorId,
          vendorReference: quote.vendorReference?.trim() || null,
          amountCents: quote.amountCents ?? null,
          currency: quote.currency ?? DEFAULT_CURRENCY,
          notes: quote.notes?.trim() || null,
          uploadedByUserId: actorUserId,
          sortOrder,
          createdAt: now,
          updatedAt: now,
        })
        sortOrder += 1
      }
    },

    async copyToEntity(
      agencyId: string,
      fromType: CommercialEntityType,
      fromId: string,
      toType: CommercialEntityType,
      toId: string,
      actorUserId: string,
    ) {
      const existing = await this.listForEntity(agencyId, fromType, fromId)
      if (existing.length === 0) {
        return
      }

      const now = new Date()
      let sortOrder = 0

      for (const row of existing) {
        await db.insert(commercialAttachments).values({
          id: crypto.randomUUID(),
          agencyId,
          entityType: toType,
          entityId: toId,
          kind: row.kind,
          label: row.label,
          fileName: row.fileName,
          storageKey: row.storageKey,
          mimeType: row.mimeType,
          vendorId: row.vendorId,
          vendorReference: row.vendorReference,
          amountCents: row.amountCents,
          currency: row.currency,
          notes: row.notes,
          uploadedByUserId: actorUserId,
          sortOrder,
          createdAt: now,
          updatedAt: now,
        })
        sortOrder += 1
      }
    },
  }
}
