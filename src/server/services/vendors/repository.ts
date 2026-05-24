import { and, count, desc, eq, sql, sum } from "drizzle-orm"

import type { MeridianDb } from "@/server/db/client"
import {
  vendorBillItems,
  vendorBills,
  vendorPayments,
  vendors,
} from "@/server/db/schema/vendors"
import type {
  VendorBillCreateInput,
  VendorBillListQuery,
  VendorCreateInput,
  VendorListQuery,
  VendorPaymentCreateInput,
  VendorUpdateInput,
} from "@/shared/validation/dtos/vendors"

import type { VendorBillDetail } from "../vendors.contract"

function lineTotalCents(quantity: number, unitCostCents: number) {
  return quantity * unitCostCents
}

export class VendorRepository {
  constructor(private readonly db: MeridianDb) {}

  async listVendors(agencyId: string, query: VendorListQuery) {
    const filters = [eq(vendors.agencyId, agencyId)]

    if (query.status) {
      filters.push(eq(vendors.status, query.status))
    }

    if (query.search) {
      const pattern = `%${query.search.trim()}%`
      filters.push(
        sql`(${vendors.name} LIKE ${pattern} OR ${vendors.email} LIKE ${pattern} OR ${vendors.phone} LIKE ${pattern})`,
      )
    }

    const whereClause = and(...filters)

    const [totalRow] = await this.db
      .select({ total: count() })
      .from(vendors)
      .where(whereClause)

    const rows = await this.db
      .select()
      .from(vendors)
      .where(whereClause)
      .orderBy(desc(vendors.createdAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize)

    return {
      items: rows,
      total: totalRow?.total ?? 0,
    }
  }

  async findVendorById(agencyId: string, vendorId: string) {
    const [row] = await this.db
      .select()
      .from(vendors)
      .where(and(eq(vendors.agencyId, agencyId), eq(vendors.id, vendorId)))
      .limit(1)

    return row ?? null
  }

  async createVendor(agencyId: string, input: VendorCreateInput) {
    const id = crypto.randomUUID()
    const now = new Date()

    await this.db.insert(vendors).values({
      id,
      agencyId,
      name: input.name.trim(),
      email: input.email?.trim().toLowerCase() ?? null,
      phone: input.phone?.trim() ?? null,
      status: "active",
      defaultExpenseAccountId: input.defaultExpenseAccountId ?? null,
      createdAt: now,
      updatedAt: now,
    })

    const created = await this.findVendorById(agencyId, id)
    if (!created) {
      throw new Error("Failed to create vendor")
    }

    return created
  }

  async updateVendor(
    agencyId: string,
    vendorId: string,
    input: VendorUpdateInput,
  ) {
    const existing = await this.findVendorById(agencyId, vendorId)
    if (!existing) {
      return null
    }

    await this.db
      .update(vendors)
      .set({
        name: input.name?.trim() ?? existing.name,
        email:
          input.email !== undefined
            ? (input.email?.trim().toLowerCase() ?? null)
            : existing.email,
        phone:
          input.phone !== undefined
            ? (input.phone?.trim() ?? null)
            : existing.phone,
        status: input.status ?? existing.status,
        defaultExpenseAccountId:
          input.defaultExpenseAccountId !== undefined
            ? input.defaultExpenseAccountId
            : existing.defaultExpenseAccountId,
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, vendorId))

    return this.findVendorById(agencyId, vendorId)
  }

  async listVendorBills(
    agencyId: string,
    vendorId: string,
    query: VendorBillListQuery,
  ) {
    const filters = [
      eq(vendorBills.agencyId, agencyId),
      eq(vendorBills.vendorId, vendorId),
    ]

    if (query.status) {
      filters.push(eq(vendorBills.status, query.status))
    }

    const whereClause = and(...filters)

    const [totalRow] = await this.db
      .select({ total: count() })
      .from(vendorBills)
      .where(whereClause)

    const rows = await this.db
      .select()
      .from(vendorBills)
      .where(whereClause)
      .orderBy(desc(vendorBills.createdAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize)

    return {
      items: rows,
      total: totalRow?.total ?? 0,
    }
  }

  async findBillById(agencyId: string, billId: string) {
    const [row] = await this.db
      .select()
      .from(vendorBills)
      .where(and(eq(vendorBills.agencyId, agencyId), eq(vendorBills.id, billId)))
      .limit(1)

    return row ?? null
  }

  async getBillDetail(agencyId: string, billId: string): Promise<VendorBillDetail | null> {
    const bill = await this.findBillById(agencyId, billId)
    if (!bill) {
      return null
    }

    const items = await this.db
      .select()
      .from(vendorBillItems)
      .where(eq(vendorBillItems.vendorBillId, billId))

    const payments = await this.db
      .select()
      .from(vendorPayments)
      .where(eq(vendorPayments.vendorBillId, billId))
      .orderBy(desc(vendorPayments.paidAt))

    const [paidRow] = await this.db
      .select({ paidCents: sum(vendorPayments.amountCents) })
      .from(vendorPayments)
      .where(eq(vendorPayments.vendorBillId, billId))

    return {
      ...bill,
      items,
      payments,
      paidCents: Number(paidRow?.paidCents ?? 0),
    }
  }

  async createBill(agencyId: string, input: VendorBillCreateInput) {
    const vendor = await this.findVendorById(agencyId, input.vendorId)
    if (!vendor) {
      return { error: "NOT_FOUND" as const }
    }

    const billId = crypto.randomUUID()
    const now = new Date()
    const totalCents = input.items.reduce(
      (acc, item) => acc + lineTotalCents(item.quantity, item.unitCostCents),
      0,
    )

    await this.db.insert(vendorBills).values({
      id: billId,
      agencyId,
      vendorId: input.vendorId,
      billNumber: input.billNumber.trim(),
      status: "draft",
      currency: input.currency,
      dueDate: input.dueDate ?? null,
      totalCents,
      createdAt: now,
      updatedAt: now,
    })

    await this.db.insert(vendorBillItems).values(
      input.items.map((item) => ({
        id: crypto.randomUUID(),
        agencyId,
        vendorBillId: billId,
        description: item.description.trim(),
        quantity: item.quantity,
        unitCostCents: item.unitCostCents,
        expenseAccountId: item.expenseAccountId ?? null,
        createdAt: now,
        updatedAt: now,
      })),
    )

    const bill = await this.findBillById(agencyId, billId)
    if (!bill) {
      throw new Error("Failed to create vendor bill")
    }

    return { bill, vendor }
  }

  async setBillStatus(
    agencyId: string,
    billId: string,
    status: (typeof vendorBills.$inferSelect)["status"],
  ) {
    await this.db
      .update(vendorBills)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(vendorBills.agencyId, agencyId), eq(vendorBills.id, billId)))

    return this.findBillById(agencyId, billId)
  }

  async sumPaymentsForBill(billId: string) {
    const [row] = await this.db
      .select({ paidCents: sum(vendorPayments.amountCents) })
      .from(vendorPayments)
      .where(eq(vendorPayments.vendorBillId, billId))

    return Number(row?.paidCents ?? 0)
  }

  async createPayment(agencyId: string, input: VendorPaymentCreateInput) {
    const id = crypto.randomUUID()
    const now = new Date()

    await this.db.insert(vendorPayments).values({
      id,
      agencyId,
      vendorId: input.vendorId,
      vendorBillId: input.vendorBillId ?? null,
      amountCents: input.amountCents,
      paidAt: input.paidAt,
      paymentMethod: input.paymentMethod ?? null,
      reference: input.reference ?? null,
      createdAt: now,
      updatedAt: now,
    })

    const [payment] = await this.db
      .select()
      .from(vendorPayments)
      .where(eq(vendorPayments.id, id))
      .limit(1)

    if (!payment) {
      throw new Error("Failed to record vendor payment")
    }

    return payment
  }

  async refreshBillPaymentStatus(agencyId: string, billId: string) {
    const bill = await this.findBillById(agencyId, billId)
    if (!bill || bill.status === "void" || bill.status === "draft") {
      return bill
    }

    const paidCents = await this.sumPaymentsForBill(billId)
    let status = bill.status

    if (paidCents <= 0) {
      status = "open"
    } else if (paidCents < bill.totalCents) {
      status = "partially_paid"
    } else {
      status = "paid"
    }

    if (status !== bill.status) {
      return this.setBillStatus(agencyId, billId, status)
    }

    return bill
  }
}

export function createVendorRepository(db: MeridianDb) {
  return new VendorRepository(db)
}
