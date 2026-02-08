-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.appointment_instructions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  practitioner_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT appointment_instructions_pkey PRIMARY KEY (id),
  CONSTRAINT appointment_instructions_practitioner_id_fkey FOREIGN KEY (practitioner_id) REFERENCES public.practitioners(id)
);
CREATE TABLE public.appointment_questionnaires (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL,
  questions jsonb NOT NULL DEFAULT '{}'::jsonb,
  answers jsonb,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT appointment_questionnaires_pkey PRIMARY KEY (id),
  CONSTRAINT appointment_questionnaires_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id)
);
CREATE TABLE public.appointment_reasons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  practitioner_id uuid,
  label text NOT NULL,
  label_he text,
  label_fr text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT appointment_reasons_pkey PRIMARY KEY (id),
  CONSTRAINT appointment_reasons_practitioner_id_fkey FOREIGN KEY (practitioner_id) REFERENCES public.practitioners(id)
);
CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  practitioner_id uuid NOT NULL,
  relative_id uuid,
  reason_id uuid,
  appointment_date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::appointment_status,
  patient_address_line text,
  patient_zip_code text,
  patient_city text,
  visited_before boolean NOT NULL DEFAULT false,
  practitioner_notes text,
  cancellation_reason text,
  confirmed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id),
  CONSTRAINT appointments_practitioner_id_fkey FOREIGN KEY (practitioner_id) REFERENCES public.practitioners(id),
  CONSTRAINT appointments_relative_id_fkey FOREIGN KEY (relative_id) REFERENCES public.relatives(id),
  CONSTRAINT appointments_reason_id_fkey FOREIGN KEY (reason_id) REFERENCES public.appointment_reasons(id)
);
CREATE TABLE public.audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT audit_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  practitioner_id uuid NOT NULL,
  appointment_id uuid,
  last_message_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id),
  CONSTRAINT conversations_practitioner_id_fkey FOREIGN KEY (practitioner_id) REFERENCES public.practitioners(id),
  CONSTRAINT conversations_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id)
);
CREATE TABLE public.health_allergies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  reaction text,
  severity text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT health_allergies_pkey PRIMARY KEY (id),
  CONSTRAINT health_allergies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.health_conditions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  severity text,
  diagnosed_on date,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT health_conditions_pkey PRIMARY KEY (id),
  CONSTRAINT health_conditions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.health_medications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  dosage text,
  frequency text,
  started_on date,
  ended_on date,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT health_medications_pkey PRIMARY KEY (id),
  CONSTRAINT health_medications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.health_profiles (
  user_id uuid NOT NULL,
  teudat_zehut_encrypted bytea,
  date_of_birth date,
  sex USER-DEFINED,
  blood_type text,
  kupat_holim text,
  kupat_member_id text,
  family_doctor_name text,
  emergency_contact_name text,
  emergency_contact_phone text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT health_profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT health_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.health_vaccinations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  vaccinated_on date,
  dose text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT health_vaccinations_pkey PRIMARY KEY (id),
  CONSTRAINT health_vaccinations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  content text NOT NULL,
  message_type USER-DEFINED NOT NULL DEFAULT 'text'::message_type,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id),
  CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  brand text NOT NULL,
  last4 text NOT NULL CHECK (char_length(last4) = 4),
  expiry_month integer NOT NULL CHECK (expiry_month >= 1 AND expiry_month <= 12),
  expiry_year integer NOT NULL CHECK (expiry_year >= 2000 AND expiry_year <= 2100),
  is_default boolean NOT NULL DEFAULT false,
  stripe_payment_method_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id),
  CONSTRAINT payment_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.practitioner_schedule_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  practitioner_id uuid NOT NULL,
  date date NOT NULL,
  is_available boolean NOT NULL DEFAULT false,
  start_time time without time zone,
  end_time time without time zone,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT practitioner_schedule_overrides_pkey PRIMARY KEY (id),
  CONSTRAINT practitioner_schedule_overrides_practitioner_id_fkey FOREIGN KEY (practitioner_id) REFERENCES public.practitioners(id)
);
CREATE TABLE public.practitioner_weekly_schedule (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  practitioner_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  slot_duration_minutes integer NOT NULL DEFAULT 30 CHECK (slot_duration_minutes >= 5 AND slot_duration_minutes <= 240),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT practitioner_weekly_schedule_pkey PRIMARY KEY (id),
  CONSTRAINT practitioner_weekly_schedule_practitioner_id_fkey FOREIGN KEY (practitioner_id) REFERENCES public.practitioners(id)
);
CREATE TABLE public.practitioners (
  id uuid NOT NULL,
  specialty_id uuid,
  address_line text,
  zip_code text,
  city text,
  latitude double precision,
  longitude double precision,
  about text,
  sector text CHECK (sector IS NULL OR (sector = ANY (ARRAY['Clalit'::text, 'Maccabi'::text, 'Meuhedet'::text, 'Leumit'::text]))),
  phone text,
  email text,
  languages ARRAY,
  education text,
  years_of_experience integer,
  consultation_duration_minutes integer NOT NULL DEFAULT 30,
  is_accepting_new_patients boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT practitioners_pkey PRIMARY KEY (id),
  CONSTRAINT practitioners_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id),
  CONSTRAINT practitioners_specialty_id_fkey FOREIGN KEY (specialty_id) REFERENCES public.specialties(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  first_name text,
  last_name text,
  email text,
  phone text,
  date_of_birth date,
  sex USER-DEFINED,
  city text,
  avatar_url text,
  role USER-DEFINED NOT NULL DEFAULT 'patient'::user_role,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.relatives (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  relation USER-DEFINED NOT NULL,
  date_of_birth date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT relatives_pkey PRIMARY KEY (id),
  CONSTRAINT relatives_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL UNIQUE,
  patient_id uuid NOT NULL,
  practitioner_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  practitioner_reply text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id),
  CONSTRAINT reviews_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id),
  CONSTRAINT reviews_practitioner_id_fkey FOREIGN KEY (practitioner_id) REFERENCES public.practitioners(id)
);
CREATE TABLE public.specialties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_he text,
  name_fr text,
  icon_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT specialties_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_settings (
  user_id uuid NOT NULL,
  notifications_enabled boolean NOT NULL DEFAULT true,
  reminders_enabled boolean NOT NULL DEFAULT true,
  locale text NOT NULL DEFAULT 'fr'::text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_settings_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);