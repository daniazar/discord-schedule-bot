import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
    process.env.SUPABASE_URL2!,
    process.env.SUPABASE_SERVICE_ROLE_KEY2!
);