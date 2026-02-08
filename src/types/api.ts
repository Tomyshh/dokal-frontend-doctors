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
// API Error Response
// ==========================================

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
