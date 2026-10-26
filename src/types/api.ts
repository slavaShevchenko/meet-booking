import type { Booking, BookingDraft, BookingPatch, DateString } from './booking'
import type { FieldErrors, ValidationIssue } from './validation'

/**
 * Failure codes shared by the mock and (later) the real backend.
 * `CONFLICT` maps to HTTP 409, `VALIDATION_ERROR` to 400, `NOT_FOUND` to 404,
 * `INTERNAL_ERROR` to 500 and `NETWORK_ERROR` to a request that never got a response.
 */
export type ApiErrorCode =
  'CONFLICT' | 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR' | 'NETWORK_ERROR'

/** Failure payload, mirroring `{ error: 'CONFLICT', message, conflictingBookingId? }`. */
export interface ApiErrorBody {
  error: ApiErrorCode
  message: string
  conflictingBookingId?: string
  fieldErrors?: FieldErrors
  issues?: ValidationIssue[]
}

export interface ListBookingsQuery {
  date: DateString
}

export type ListBookingsResponse = Booking[]
export type CreateBookingBody = BookingDraft
export type CreateBookingResponse = Booking
export type UpdateBookingBody = BookingPatch
export type UpdateBookingResponse = Booking

/** The only API surface the UI is allowed to touch (via `api/client.ts`). */
export interface BookingApi {
  list(date: DateString): Promise<ListBookingsResponse>
  create(draft: CreateBookingBody): Promise<CreateBookingResponse>
  update(id: string, patch: UpdateBookingBody): Promise<UpdateBookingResponse>
  remove(id: string): Promise<void>
}

/** Typed error: the UI branches on `status`/`code`, never on message strings. */
export class ApiError extends Error {
  /** HTTP status, or `0` when the request never reached the server. */
  readonly status: number
  readonly code: ApiErrorCode
  readonly conflictingBookingId?: string
  readonly fieldErrors: FieldErrors
  readonly issues: ValidationIssue[]

  constructor(body: ApiErrorBody, status: number, options?: { cause?: unknown }) {
    super(body.message, options)
    this.name = 'ApiError'
    this.status = status
    this.code = body.error
    this.conflictingBookingId = body.conflictingBookingId
    this.fieldErrors = body.fieldErrors ?? {}
    this.issues = body.issues ?? []
  }

  get isConflict(): boolean {
    return this.code === 'CONFLICT'
  }

  get isServerError(): boolean {
    return this.status >= 500 || this.status === 0
  }

  static network(
    message = 'Сервер недоступен. Проверьте соединение и повторите попытку.',
    cause?: unknown,
  ) {
    return new ApiError({ error: 'NETWORK_ERROR', message }, 0, { cause })
  }

  static internal(
    message = 'Внутренняя ошибка сервера. Повторите попытку позже.',
    cause?: unknown,
  ) {
    return new ApiError({ error: 'INTERNAL_ERROR', message }, 500, { cause })
  }

  static notFound(message = 'Бронь не найдена — возможно, её уже удалили.', cause?: unknown) {
    return new ApiError({ error: 'NOT_FOUND', message }, 404, { cause })
  }
}

/** Result of an API call handled by a composable: failures are values, not exceptions. */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError }
