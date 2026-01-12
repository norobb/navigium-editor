-- App settings table for storing app password and other settings
CREATE TABLE public.app_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User greetings table for personalized greetings
CREATE TABLE public.user_greetings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    greeting TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Known users table
CREATE TABLE public.known_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    last_login TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_greetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.known_users ENABLE ROW LEVEL SECURITY;

-- App settings: Anyone can read, only specific logic can write (we'll use service role for admin)
CREATE POLICY "Anyone can read app_settings" 
ON public.app_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert app_settings" 
ON public.app_settings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update app_settings" 
ON public.app_settings 
FOR UPDATE 
USING (true);

-- User greetings: Anyone can read, anyone can manage (admin check in app logic)
CREATE POLICY "Anyone can read user_greetings" 
ON public.user_greetings 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert user_greetings" 
ON public.user_greetings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update user_greetings" 
ON public.user_greetings 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete user_greetings" 
ON public.user_greetings 
FOR DELETE 
USING (true);

-- Known users: Anyone can read and manage
CREATE POLICY "Anyone can read known_users" 
ON public.known_users 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert known_users" 
ON public.known_users 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update known_users" 
ON public.known_users 
FOR UPDATE 
USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_greetings_updated_at
BEFORE UPDATE ON public.user_greetings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default app password
INSERT INTO public.app_settings (key, value) VALUES ('app_password', 'cheater2025');