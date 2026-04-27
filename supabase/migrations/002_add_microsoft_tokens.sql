-- Add Microsoft tokens to profiles table for Outlook integration

ALTER TABLE public.profiles
ADD COLUMN microsoft_access_token text,
ADD COLUMN microsoft_refresh_token text;

-- Add a comment to the new columns
COMMENT ON COLUMN public.profiles.microsoft_access_token IS 'Token de acceso para Microsoft Graph API (Outlook)';
COMMENT ON COLUMN public.profiles.microsoft_refresh_token IS 'Token de refresco para Microsoft Graph API';
