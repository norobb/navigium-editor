-- Remove the overly permissive RLS policies
DROP POLICY IF EXISTS "Allow all reads on app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow all reads on known_users" ON public.known_users;
DROP POLICY IF EXISTS "Allow all inserts on known_users" ON public.known_users;
DROP POLICY IF EXISTS "Allow all updates on known_users" ON public.known_users;
DROP POLICY IF EXISTS "Allow all reads on user_greetings" ON public.user_greetings;
DROP POLICY IF EXISTS "Allow all inserts on user_greetings" ON public.user_greetings;
DROP POLICY IF EXISTS "Allow all updates on user_greetings" ON public.user_greetings;
DROP POLICY IF EXISTS "Allow all deletes on user_greetings" ON public.user_greetings;

-- Delete sensitive data from app_settings (password will be moved to secrets)
DELETE FROM public.app_settings WHERE key = 'app_password';

-- Create restrictive policies - all access through edge functions only
-- These policies deny all direct access from client

-- app_settings: No direct access (sensitive data)
CREATE POLICY "Deny all direct access to app_settings"
ON public.app_settings
FOR ALL
USING (false);

-- known_users: No direct access (managed by edge function)
CREATE POLICY "Deny all direct access to known_users"
ON public.known_users
FOR ALL
USING (false);

-- user_greetings: No direct access (managed by edge function)
CREATE POLICY "Deny all direct access to user_greetings"
ON public.user_greetings
FOR ALL
USING (false);