// ==========================================
// Enums
// ==========================================

export type UserRole = 'patient' | 'practitioner' | 'secretary' | 'admin';
export type SexType = 'male' | 'female' | 'other';
export type RelationType = 'child' | 'parent' | 'spouse' | 'sibling' | 'other';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled_by_patient'
  | 'cancelled_by_practitioner'
  | 'completed'
  | 'no_show';

export type MessageType = 'text' | 'image' | 'file' | 'system';

export type NotificationType =
  | 'appointment_request'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_reminder'
  | 'new_message'
  | 'review_received';

export type HealthTable = 'conditions' | 'medications' | 'allergies' | 'vaccinations';

// Organization enums
export type OrganizationType = 'individual' | 'clinic';
export type OrganizationRole = 'owner' | 'admin' | 'member';
export type StaffType = 'practitioner' | 'secretary';

// ==========================================
// Core Models
// ==========================================

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  sex: SexType | null;
  city: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  email: string | null;
  phone: string | null;
  address_line: string | null;
  zip_code: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  avatar_url: string | null;
  type: OrganizationType;
  license_number: string | null;
  description: string | null;
  website: string | null;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  staff_type: StaffType;
  invited_by: string | null;
  joined_at: string;
  is_active?: boolean;
  // Joined fields
  profiles?: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'avatar_url' | 'email' | 'phone' | 'role'>;
  practitioner?: {
    id: string;
    license_number?: string | null;
    specialization_license?: string | null;
    specialty: Pick<Specialty, 'name' | 'name_fr' | 'name_he'>;
  } | null;
}

export interface Practitioner {
  id: string;
  organization_id: string;
  specialty_id: string | null;
  license_number: string | null;
  specialization_license: string | null;
  address_line: string | null;
  zip_code: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  about: string | null;
  sector: string | null;
  phone: string | null;
  email: string | null;
  languages: string[] | null;
  education: string | null;
  years_of_experience: number | null;
  consultation_duration_minutes: number;
  is_accepting_new_patients: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, 'first_name' | 'last_name' | 'avatar_url'>;
  specialties?: Specialty;
  organizations?: Organization;
}

export interface Specialty {
  id: string;
  name: string;
  name_he: string | null;
  name_fr: string | null;
  icon_url: string | null;
}

export interface Relative {
  id: string;
  first_name: string;
  last_name: string;
  relation: RelationType;
  date_of_birth: string | null;
}

// ==========================================
// Appointments
// ==========================================

export interface Appointment {
  id: string;
  patient_id: string;
  practitioner_id: string;
  organization_id: string | null;
  relative_id: string | null;
  reason_id: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  patient_address_line: string | null;
  patient_zip_code: string | null;
  patient_city: string | null;
  visited_before: boolean;
  practitioner_notes: string | null;
  cancellation_reason: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  profiles?: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'phone' | 'avatar_url'>;
  practitioners?: Practitioner;
  organizations?: Organization | null;
  appointment_reasons?: AppointmentReason | null;
  relatives?: Relative | null;
}

export interface AppointmentReason {
  id: string;
  practitioner_id: string | null;
  label: string;
  label_he: string | null;
  label_fr: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface AppointmentInstruction {
  id: string;
  practitioner_id: string;
  title: string;
  content: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Slot {
  slot_date: string;
  slot_start: string;
  slot_end: string;
}

// ==========================================
// Schedule
// ==========================================

export interface WeeklySchedule {
  id: string;
  practitioner_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduleOverride {
  id: string;
  practitioner_id: string;
  date: string;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

// ==========================================
// Messaging
// ==========================================

export interface Conversation {
  id: string;
  patient_id: string;
  practitioner_id: string;
  appointment_id: string | null;
  last_message_at: string | null;
  created_at: string;
  // Joined
  profiles?: Pick<Profile, 'first_name' | 'last_name' | 'avatar_url'>;
  practitioners?: {
    id: string;
    profiles: Pick<Profile, 'first_name' | 'last_name' | 'avatar_url'>;
  };
  last_message?: {
    content: string;
    created_at: string;
    message_type: MessageType;
  } | null;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  message_type: MessageType;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// ==========================================
// Health
// ==========================================

export interface HealthProfile {
  user_id: string;
  teudat_zehut?: string;
  date_of_birth: string | null;
  sex: SexType | null;
  blood_type: string | null;
  kupat_holim: string | null;
  kupat_member_id: string | null;
  family_doctor_name: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

export interface HealthItem {
  id: string;
  user_id: string;
  name: string;
  reaction?: string | null;
  severity?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  diagnosed_on?: string | null;
  started_on?: string | null;
  ended_on?: string | null;
  dose?: string | null;
  vaccinated_on?: string | null;
  notes?: string | null;
  created_at: string;
}

// ==========================================
// Notifications
// ==========================================

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// ==========================================
// Reviews
// ==========================================

export interface Review {
  id: string;
  appointment_id: string;
  patient_id: string;
  practitioner_id: string;
  rating: number;
  comment: string | null;
  practitioner_reply: string | null;
  created_at: string;
  profiles?: Pick<Profile, 'first_name' | 'last_name' | 'avatar_url'>;
}

// ==========================================
// Payments
// ==========================================

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expiry_month: number;
  expiry_year: number;
  is_default: boolean;
}

// ==========================================
// Settings
// ==========================================

export interface UserSettings {
  notifications_enabled: boolean;
  reminders_enabled: boolean;
  locale: string;
}

// ==========================================
// CRM Dashboard
// ==========================================

export interface CrmStats {
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  no_show: number;
}

export interface CrmAppointmentsResponse {
  appointments: Appointment[];
  total: number;
}

// ==========================================
// Patient View (CRM)
// ==========================================

export interface PatientView {
  profile: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'phone' | 'email' | 'date_of_birth' | 'sex' | 'city' | 'avatar_url'>;
  health_profile: HealthProfile | null;
  conditions: HealthItem[];
  allergies: HealthItem[];
  medications: HealthItem[];
  appointment_history: Appointment[];
}
