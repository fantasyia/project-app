import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
  console.log("Testing signup...");
  const { data, error } = await supabase.auth.signUp({
    email: 'test_user_register_' + Date.now() + '@gmail.com',
    password: 'Password123!',
    options: {
      data: {
        display_name: 'Test User',
        role: 'subscriber'
      }
    }
  });

  if (error) {
    console.error("Signup error:", error);
  } else {
    console.log("Signup success:", data);
  }
}

testSignup();
