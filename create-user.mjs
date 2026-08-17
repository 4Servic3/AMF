import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, ...value] = line.split('=');
    envVars[key.trim()] = value.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function signUpUser() {
  const { data, error } = await supabase.auth.signUp({
    email: 'amf@admin.com',
    password: 'Qwaszx12!@',
  });

  if (error) {
    console.error('Error signing up user:', error.message);
  } else {
    console.log('User signed up successfully:', data.user?.id);
  }
}

signUpUser();
