import type {
  ListResult,
  MutationResult,
  ServiceContext,
  ServiceResult,
} from "./_types"
import type {
  VendorBillCreateInput,
  VendorBillListQuery,
  VendorCreateInput,
  VendorListQuery,
  VendorPaymentCreateInput,
  VendorUpdateInput,
} from "@/shared/validation/dtos/vendors"
import type {
  Vendor,
  VendorBill,
  VendorBillItem,
  VendorPayment,
} from "@/server/db/schema/vendors"

export type VendorBillDetail = VendorBill & {
  items: VendorBillItem[]
  payments: VendorPayment[]
  paidCents: number
}

export interface VendorServiceContract {
  listVendors(
    ctx: ServiceContext,
    query: VendorListQuery,
  ): Promise<ListResult<Vendor>>
  getVendorById(
    ctx: ServiceContext,
    vendorId: string,
  ): Promise<ServiceResult<Vendor>>
  createVendor(
    ctx: ServiceContext,
    input: VendorCreateInput,
  ): Promise<MutationResult<Vendor>>
  updateVendor(
    ctx: ServiceContext,
    vendorId: string,
    input: VendorUpdateInput,
  ): Promise<MutationResult<Vendor>>
  listVendorBills(
    ctx: ServiceContext,
    vendorId: string,
    query: VendorBillListQuery,
  ): Promise<ListResult<VendorBill>>
  getVendorBillById(
    ctx: ServiceContext,
    billId: string,
  ): Promise<ServiceResult<VendorBillDetail>>
  createBill(
    ctx: ServiceContext,
    input: VendorBillCreateInput,
  ): Promise<MutationResult<VendorBill>>
  recordPayment(
    ctx: ServiceContext,
    input: VendorPaymentCreateInput,
  ): Promise<MutationResult<VendorPayment>>
}

export type { VendorServiceContract as VendorService }
