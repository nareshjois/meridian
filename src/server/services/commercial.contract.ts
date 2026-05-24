import type {
  ListResult,
  MutationResult,
  ServiceContext,
  ServiceResult,
} from "./_types"
import type {
  BookingListQuery,
  BookingServiceCreateInput,
  BookingServiceUpdateFieldsInput,
  BookingServiceScheduleConfigInput,
  BookingCreateInput,
  BookingStatusTransitionInput,
  ConvertQuoteToBookingInput,
  QuoteCreateInput,
  QuoteListQuery,
  QuoteStatusTransitionInput,
} from "@/shared/validation/dtos/commercial"
import type { BookingService } from "@/server/db/schema/booking-services"
import type {
  Booking,
  BookingItem,
  BookingStatusHistory,
  BookingTraveler,
} from "@/server/db/schema/bookings"
import type { Quote, QuoteItem } from "@/server/db/schema/quotes"
import type { CommercialAttachmentRow } from "@/server/services/commercial-attachments/repository"
import type { AssignBookingTravelerInput, BookingItemFieldsUpdateInput } from "@/shared/validation/dtos/commercial"

export type QuoteSummary = Quote & {
  customerDisplayName: string
  totalCents: number
}

export type QuoteDetail = Quote & {
  items: QuoteItem[]
  documents: CommercialAttachmentRow[]
  vendorQuotes: CommercialAttachmentRow[]
  totalCents: number
  customerDisplayName: string
}

export type BookingSummary = Booking & {
  customerDisplayName: string
  totalCents: number
}

export type BookingDetail = Booking & {
  items: BookingItem[]
  documents: CommercialAttachmentRow[]
  vendorQuotes: CommercialAttachmentRow[]
  statusHistory: BookingStatusHistory[]
  travelers: BookingTraveler[]
  totalCents: number
  customerDisplayName: string
}

export interface BookingServiceCatalogContract {
  listServices(
    ctx: ServiceContext,
    query: { includeInactive?: boolean },
  ): Promise<ListResult<BookingService>>
  createService(
    ctx: ServiceContext,
    input: BookingServiceCreateInput,
  ): Promise<MutationResult<BookingService>>
  setServiceActive(
    ctx: ServiceContext,
    input: { serviceId: string; isActive: boolean },
  ): Promise<MutationResult<BookingService>>
  getServiceById(
    ctx: ServiceContext,
    serviceId: string,
  ): Promise<ServiceResult<BookingService>>
  updateServiceFields(
    ctx: ServiceContext,
    input: BookingServiceUpdateFieldsInput,
  ): Promise<MutationResult<BookingService>>
  updateServiceScheduleConfig(
    ctx: ServiceContext,
    input: BookingServiceScheduleConfigInput,
  ): Promise<MutationResult<BookingService>>
}

export interface QuoteServiceContract {
  listQuotes(
    ctx: ServiceContext,
    query: QuoteListQuery,
  ): Promise<ListResult<QuoteSummary>>
  getQuoteById(
    ctx: ServiceContext,
    quoteId: string,
  ): Promise<ServiceResult<QuoteDetail>>
  createQuote(
    ctx: ServiceContext,
    input: QuoteCreateInput,
  ): Promise<MutationResult<QuoteDetail>>
  transitionQuoteStatus(
    ctx: ServiceContext,
    input: QuoteStatusTransitionInput,
  ): Promise<MutationResult<QuoteDetail>>
  convertToBooking(
    ctx: ServiceContext,
    input: ConvertQuoteToBookingInput,
  ): Promise<MutationResult<Booking>>
}

export interface BookingServiceContract {
  listBookings(
    ctx: ServiceContext,
    query: BookingListQuery,
  ): Promise<ListResult<BookingSummary>>
  createBooking(
    ctx: ServiceContext,
    input: BookingCreateInput,
  ): Promise<MutationResult<BookingDetail>>
  getBookingById(
    ctx: ServiceContext,
    bookingId: string,
  ): Promise<ServiceResult<BookingDetail>>
  transitionBookingStatus(
    ctx: ServiceContext,
    input: BookingStatusTransitionInput,
  ): Promise<MutationResult<Booking>>
  assignTraveler(
    ctx: ServiceContext,
    input: AssignBookingTravelerInput,
  ): Promise<MutationResult<BookingTraveler>>
  removeTraveler(
    ctx: ServiceContext,
    input: { bookingId: string; travelerId: string },
  ): Promise<MutationResult<{ success: true }>>
  updateBookingItemFields(
    ctx: ServiceContext,
    input: BookingItemFieldsUpdateInput,
  ): Promise<MutationResult<BookingDetail>>
}

export type { BookingServiceCatalogContract as BookingServiceCatalog }
export type { QuoteServiceContract as QuoteService }
export type { BookingServiceContract as BookingService }
