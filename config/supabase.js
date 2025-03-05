require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Les variables d\'environnement Supabase ne sont pas définies.');
    console.error('Veuillez vérifier que le fichier .env contient SUPABASE_URL et SUPABASE_ANON_KEY');
    process.exit(1);
}

console.log('✅ Configuration Supabase chargée avec succès');
console.log('URL:', supabaseUrl);
console.log('Clé:', supabaseKey.substring(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    }
});

module.exports = supabase; 