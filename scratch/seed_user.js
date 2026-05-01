/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERRO: Variáveis de ambiente faltando em .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function registerMainUser() {
  console.log('--- Iniciando Cadastro do Usuário Mestre ---');
  
  const email = 'adalbapro@gmail.com';
  const password = 'FashionEdu2026!';
  
  // 1. Criar usuário no Auth
  const { data: userData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: { 
      role: 'admin',
      display_name: 'Adalba Pro'
    }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('✅ Usuário já existe no Auth.');
    } else {
      console.error('❌ Erro no Auth:', authError.message);
      return;
    }
  } else {
    console.log('✅ Usuário criado no Auth com sucesso.');
  }

  // 2. Garantir que o perfil exista no public.users (caso a trigger falhe ou já existisse)
  // Buscamos o ID se o usuário já existisse
  const userId = userData?.user?.id;
  
  if (userId) {
     const { error: profileError } = await supabase
      .from('users')
      .update({ role: 'admin', display_name: 'Adalba Pro' })
      .eq('id', userId);
      
     if (profileError) {
       console.log('ℹ️ Nota: Perfil será criado via Trigger no próximo login ou já existe.');
     } else {
       console.log('✅ Perfil atualizado como admin.');
     }
  }

  console.log('--- Cadastro concluído! ---');
  console.log(`Email: ${email}`);
  console.log(`Senha: ${password}`);
}

registerMainUser();
