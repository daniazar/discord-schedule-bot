import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
    process.env.SUPABASE_URL2_SUPABASE_URL!,
    process.env.SUPABASE_URL2_SUPABASE_SERVICE_ROLE_KEY!
);