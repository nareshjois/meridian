import type {
  ListResult,
  MutationResult,
  ServiceContext,
  ServiceResult,
} from "./_types"
import type {
  AccountCreateInput,
  ApSummaryQuery,
  ArSummaryQuery,
  BookingConfirmedEvent,
  JournalListQuery,
  LedgerQuery,
  PostJournalEntryInput,
  RepostJournalEntryInput,
  ReverseJournalEntryInput,
  TrialBalanceQuery,
  VendorBillPostedEvent,
  VendorPaymentRecordedEvent,
} from "@/shared/validation/dtos/accounting"
import type {
  Account,
  JournalEntry,
} from "@/server/db/schema/accounting"

export interface AccountingServiceContract {
  listAccounts(
    ctx: ServiceContext,
    query: { includeInactive?: boolean },
  ): Promise<ListResult<Account>>
  createAccount(
    ctx: ServiceContext,
    input: AccountCreateInput,
  ): Promise<MutationResult<Account>>
  postEntry(
    ctx: ServiceContext,
    input: PostJournalEntryInput,
  ): Promise<MutationResult<JournalEntry>>
  reverseEntry(
    ctx: ServiceContext,
    input: ReverseJournalEntryInput,
  ): Promise<MutationResult<JournalEntry>>
  repostEntry(
    ctx: ServiceContext,
    input: RepostJournalEntryInput,
  ): Promise<MutationResult<JournalEntry>>
  listJournalEntries(
    ctx: ServiceContext,
    query: JournalListQuery,
  ): Promise<ListResult<unknown>>
  getLedger(
    ctx: ServiceContext,
    query: LedgerQuery,
  ): Promise<ServiceResult<{ lines: unknown[]; total: number }>>
  getTrialBalance(
    ctx: ServiceContext,
    query: TrialBalanceQuery,
  ): Promise<ServiceResult<{ rows: unknown[]; netDifferenceCents: number }>>
  getAccountsReceivableSummary(
    ctx: ServiceContext,
    query: ArSummaryQuery,
  ): Promise<
    ServiceResult<{ rows: unknown[]; totalReceivableCents: number }>
  >
  getAccountsPayableSummary(
    ctx: ServiceContext,
    query: ApSummaryQuery,
  ): Promise<ServiceResult<{ rows: unknown[]; totalPayableCents: number }>>
  handleBookingConfirmed(
    ctx: ServiceContext,
    event: BookingConfirmedEvent,
  ): Promise<MutationResult<JournalEntry>>
  handleVendorBillPosted(
    ctx: ServiceContext,
    event: VendorBillPostedEvent,
  ): Promise<MutationResult<JournalEntry>>
  handleVendorPaymentRecorded(
    ctx: ServiceContext,
    event: VendorPaymentRecordedEvent,
  ): Promise<MutationResult<JournalEntry>>
}

export type { AccountingServiceContract as AccountingService }
