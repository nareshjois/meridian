import type {
  ListResult,
  MutationResult,
  ServiceContext,
  ServiceResult,
} from "./_types"
import type {
  BookingListQuery,
  BookingServiceCreateInput,
  BookingStatusTransitionInput,
  ConvertQuoteToBookingInput,
  QuoteCreateInput,
  QuoteListQuery,
  QuoteStatusTransitionInput,
} from "@/shared/validation/dtos/commercial"
import type { BookingService } from "@/server/db/schema/booking-services"
import type { Booking } from "@/server/db/schema/bookings"
import type { Quote } from "@/server/db/schema/quotes"

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
}

export interface QuoteServiceContract {
  listQuotes(
    ctx: ServiceContext,
    query: QuoteListQuery,
  ): Promise<ListResult<Quote>>
  getQuoteById(
    ctx: ServiceContext,
    quoteId: string,
  ): Promise<ServiceResult<Quote>>
  createQuote(
    ctx: ServiceContext,
    input: QuoteCreateInput,
  ): Promise<MutationResult<Quote>>
  transitionQuoteStatus(
    ctx: ServiceContext,
    input: QuoteStatusTransitionInput,
  ): Promise<MutationResult<Quote>>
  convertToBooking(
    ctx: ServiceContext,
    input: ConvertQuoteToBookingInput,
  ): Promise<MutationResult<Booking>>
}

export interface BookingServiceContract {
  listBookings(
    ctx: ServiceContext,
    query: BookingListQuery,
  ): Promise<ListResult<Booking>>
  getBookingById(
    ctx: ServiceContext,
    bookingId: string,
  ): Promise<ServiceResult<Booking>>
  transitionBookingStatus(
    ctx: ServiceContext,
    input: BookingStatusTransitionInput,
  ): Promise<MutationResult<Booking>>
}

export type { BookingServiceCatalogContract as BookingServiceCatalog }
export type { QuoteServiceContract as QuoteService }
export type { BookingServiceContract as BookingService }
