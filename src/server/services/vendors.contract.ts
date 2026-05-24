import type {
  ListResult,
  MutationResult,
  ServiceContext,
  ServiceResult,
} from "./_types"
import type {
  VendorBillCreateInput,
  VendorCreateInput,
  VendorListQuery,
  VendorPaymentCreateInput,
} from "@/shared/validation/dtos/vendors"
import type {
  Vendor,
  VendorBill,
  VendorPayment,
} from "@/server/db/schema/vendors"

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
