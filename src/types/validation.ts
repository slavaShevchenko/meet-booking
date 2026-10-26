/** Form fields that can carry an error. */
export type BookingField = 'date' | 'start' | 'end' | 'title'

/** Machine-readable reason, so the UI can react to a rule instead of parsing a message. */
export type ValidationCode =
  | 'INVALID_DATE'
  | 'INVALID_TIME'
  | 'OUT_OF_WORK_HOURS'
  | 'END_NOT_AFTER_START'
  | 'DURATION_TOO_SHORT'
  | 'DURATION_TOO_LONG'
  | 'CONFLICT'
  | 'PAST_TIME'
  | 'PAST_DATE'
  | 'TITLE_TOO_LONG'

export interface ValidationIssue {
  code: ValidationCode
  /** Field to highlight; `null` when the issue concerns the booking as a whole. */
  field: BookingField | null
  message: string
  conflictingBookingId?: string
}

export type FieldErrors = Partial<Record<BookingField, string>>

export interface ValidationResult {
  valid: boolean
  issues: ValidationIssue[]
  /** Every issue message, for the form-level summary. */
  errors: string[]
  /** First message per field, for inline highlighting. */
  fieldErrors: FieldErrors
}
