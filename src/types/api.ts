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

// ==========================================
// Practitioner Registration
// ==========================================

export interface RegisterPractitionerRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  specialty: string;
  license_number: string;
  specialization_license?: string;
  address_line: string;
  zip_code: string;
  // Optional: join existing clinic
  organization_id?: string;
  // Optional: create a new clinic
  organization_name?: string;
  organization_type?: 'individual' | 'clinic';
}

// ==========================================
// Organizations
// ==========================================

export interface CreateOrganizationRequest {
  name: string;
  type: 'individual' | 'clinic';
  email?: string;
  phone?: string;
  address_line?: string;
  zip_code?: string;
  city?: string;
  license_number?: string;
  description?: string;
  website?: string;
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
  specialty: string;
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
// API Error Response
// ==========================================

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
