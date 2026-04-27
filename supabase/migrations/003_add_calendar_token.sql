-- Add a secure calendar token to profiles for Webcal subscriptions

ALTER TABLE public.profiles
ADD COLUMN calendar_token uuid DEFAULT gen_random_uuid();

-- Add a comment
COMMENT ON COLUMN public.profiles.calendar_token IS 'Token seguro único para suscribirse al calendario vía Webcal (ej. Apple Calendar)';
