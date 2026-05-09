const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'influencer2026project@gmail.com',
    password: 'FashionEdu2026!'
  });
  if (error) { console.error('Login error:', error.message); return; }
  
  const tokenCookie = `sb-dkzwdoeuzcmgvaxftmlh-auth-token=base64-${Buffer.from(JSON.stringify(data.session)).toString('base64')}`;
  
  let myHeaders = new Headers();
  myHeaders.append('Cookie', tokenCookie);
  
  console.log('Fetching /dashboard/user/feed...');
  let res = await fetch('http://localhost:3001/dashboard/user/feed', { headers: myHeaders, redirect: 'manual' });
  console.log('User redirect status:', res.status);
  
  const setCookie = res.headers.get('set-cookie');
  console.log('Set-Cookie from user:', setCookie);
  
  if (setCookie) {
    const cookies = setCookie.split(',').map(c => c.split(';')[0]);
    myHeaders = new Headers();
    myHeaders.append('Cookie', [tokenCookie, ...cookies].join('; '));
    
    res = await fetch('http://localhost:3001/dashboard/user/feed', { headers: myHeaders });
    console.log('User feed status:', res.status);
    const text = await res.text();
    console.log('Contains PrivilegedRoleMenu:', text.includes('aria-label="Navegar como"'));
  }
}

run();
