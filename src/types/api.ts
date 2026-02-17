// ==========================================
// API Request Types
// ==========================================

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  city?: string | null;
  date_of_birth?: string | null;
  sex?: 'male' | 'female' | 'other' | null;
}

export interface CreateAppointmentRequest {
  practitioner_id: string;
  patient_id?: string;
  relative_id?: string | null;
  reason_id?: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  patient_address_line?: string | null;
  patient_zip_code?: string | null;
  patient_city?: string | null;
  visited_before?: boolean;
}

export interface CancelAppointmentRequest {
  cancellation_reason?: string | null;
}

export interface CompleteAppointmentRequest {
  practitioner_notes?: string | null;
}

export interface SendMessageRequest {
  content: string;
  message_type?: 'text' | 'image' | 'file';
}

export interface AddScheduleRequest {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes?: number;
  is_active?: boolean;
}

export interface UpdateScheduleRequest {
  start_time?: string;
  end_time?: string;
  slot_duration_minutes?: number;
  is_active?: boolean;
}

export interface UpsertOverrideRequest {
  date: string;
  is_available: boolean;
  start_time?: string | null;
  end_time?: string | null;
  reason?: string | null;
}

export interface AddReasonRequest {
  label: string;
  label_fr?: string | null;
  label_he?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateReasonRequest {
  label?: string;
  label_fr?: string | null;
  label_he?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface AddInstructionRequest {
  title: string;
  content: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateInstructionRequest {
  title?: string;
  content?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdatePractitionerProfileRequest {
  about?: string | null;
  languages?: string[] | null;
  education?: string | null;
  phone?: string | null;
  email?: string | null;
  is_accepting_new_patients?: boolean;
  address_line?: string | null;
  zip_code?: string | null;
  city?: string | null;
}

export interface UpdateSettingsRequest {
  notifications_enabled?: boolean;
  reminders_enabled?: boolean;
  locale?: string;
}

export interface ReplyReviewRequest {
  practitioner_reply: string;
}

// CRM Specific
export interface CrmAppointmentsQuery {
  date?: string;
  from?: string;
  to?: string;
  practitioner_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface CrmStatsQuery {
  from: string;
  to: string;
}

export interface CreateCrmPatientRequest {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  sex?: 'male' | 'female' | 'other';
  city?: string;
}

export interface CreateCrmAppointmentRequest {
  patient_id: string;
  practitioner_id?: string;
  reason_id?: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  visited_before?: boolean;
  /** Optional: immediately create as confirmed */
  status?: 'pending' | 'confirmed';
  notes?: string | null;
}

// ==========================================
// Practitioner Registration
// ==========================================

export interface RegisterPractitionerRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  /** UUID of the specialty from GET /api/v1/specialties */
  specialty_id: string;
  license_number: string;
  specialization_license?: string;
  address_line: string;
  zip_code: string;
  // Optional: join existing clinic
  organization_id?: string;
  // Optional: create a new clinic
  organization_name?: string;
  organization_type?: 'individual' | 'clinic' | 'enterprise';
}

// ==========================================
// Organizations
// ==========================================

export interface CreateOrganizationRequest {
  name: string;
  type: 'individual' | 'clinic' | 'enterprise';
  email?: string;
  phone?: string;
  address_line?: string;
  zip_code?: string;
  city?: string;
  license_number?: string;
  description?: string;
  website?: string;
}

// ── Organization Sites (multi-site enterprise) ──

export interface CreateOrganizationSiteRequest {
  name: string;
  address_line?: string;
  zip_code?: string;
  city?: string;
  phone?: string;
  email?: string;
}

export interface UpdateOrganizationSiteRequest {
  name?: string;
  address_line?: string | null;
  zip_code?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean;
}

export interface UpdateOrganizationRequest {
  name?: string;
  email?: string | null;
  phone?: string | null;
  address_line?: string | null;
  zip_code?: string | null;
  city?: string | null;
  avatar_url?: string | null;
  license_number?: string | null;
  description?: string | null;
  website?: string | null;
}

export interface AddOrganizationMemberRequest {
  user_id: string;
  role?: 'admin' | 'member';
}

export interface UpdateOrganizationMemberRequest {
  role: 'admin' | 'member';
}

// ── Invitation ──

export interface InvitePractitionerRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  staff_type: 'practitioner';
  org_role: 'member' | 'admin';
  /** UUID of the specialty from GET /api/v1/specialties */
  specialty_id: string;
  license_number: string;
  specialization_license?: string;
  address_line?: string;
  zip_code?: string;
  city?: string;
}

export interface InviteSecretaryRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  staff_type: 'secretary';
  org_role: 'member' | 'admin';
}

export type InviteMemberRequest = InvitePractitionerRequest | InviteSecretaryRequest;

/** PATCH /organizations/:orgId/practitioners/:practitionerId/licenses */
export interface UpdatePractitionerLicensesRequest {
  license_number?: string;
  specialization_license?: string;
}

export interface InviteMemberResponse {
  member: {
    id: string;
    user_id: string;
    role: string;
    staff_type: 'practitioner' | 'secretary';
    joined_at: string;
    profiles: {
      first_name: string;
      last_name: string;
      email: string;
      avatar_url: string | null;
      role: string;
    };
  };
  is_existing_user: boolean;
  invite_sent: boolean;
}

// ==========================================
// Google Calendar Integration
// ==========================================

export interface UpdateGoogleCalendarConfigRequest {
  calendar_id?: string;
  sync_crm_to_google?: boolean;
  sync_google_to_crm?: boolean;
  keywords_appointment?: string[];
  keywords_busy?: string[];
  ai_enabled?: boolean;
  ai_prompt?: string | null;
}

export interface GoogleCalendarConnectResponse {
  auth_url: string;
}

export interface GoogleCalendarSyncResponse {
  synced_count: number;
  errors: string[];
}

/** Response shape for the unified calendar items endpoint */
export interface CalendarItemsResponse {
  items: import('@/types').CalendarItem[];
  total: number;
}

// ==========================================
// CRM External Events (manual + imported)
// ==========================================

export interface CreateExternalEventRequest {
  /** yyyy-MM-dd */
  date: string;
  /** HH:mm or HH:mm:ss */
  start_time: string;
  /** HH:mm or HH:mm:ss */
  end_time: string;
  title: string;
  description?: string | null;
  location?: string | null;
  /** 'appointment' = RDV détecté / 'busy' = indisponibilité */
  type_detected: import('@/types').ExternalEventType;
}

// ==========================================
// API Error Response
// ==========================================

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
