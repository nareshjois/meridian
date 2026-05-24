import type { ServiceFieldValues } from "@/shared/commercial/service-fields"

export type CommercialLineItemDraft = {
  id: string
  bookingServiceId: string
  description: string
  quantity: number
  unitPrice: string
  fieldValues: ServiceFieldValues
}

export function createEmptyLineItem(
  defaultServiceId: string,
): CommercialLineItemDraft {
  return {
    id: crypto.randomUUID(),
    bookingServiceId: defaultServiceId,
    description: "",
    quantity: 1,
    unitPrice: "100.00",
    fieldValues: {},
  }
}
