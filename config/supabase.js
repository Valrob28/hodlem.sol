const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// En mode développement, on utilise un client factice
const supabase = createClient(
    supabaseUrl || 'https://example.supabase.co',
    supabaseKey || 'dummy-key',
    {
        auth: {
            persistSession: false
        }
    }
);

module.exports = supabase; 