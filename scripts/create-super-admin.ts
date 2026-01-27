/**
 * Script para criar o Super Admin usando a API Admin do Supabase
 * 
 * Uso: npx tsx scripts/create-super-admin.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente do .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
    console.error('   Certifique-se de que o arquivo .env.local está configurado corretamente');
    process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function createSuperAdmin() {
    const email = 'leandroandreengelmann@gmail.com';
    const password = 'Admin@2026';
    const name = 'Leandro (Super Admin)';

    console.log('🚀 Criando Super Admin...');
    console.log(`   Email: ${email}`);

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
            name,
            role: 'super_admin',
        },
    });

    if (authError) {
        console.error('❌ Erro ao criar usuário no Auth:', authError.message);
        process.exit(1);
    }

    console.log('✅ Usuário criado no Supabase Auth');
    console.log(`   ID: ${authData.user.id}`);

    // 2. Criar perfil na tabela profiles
    const { error: profileError } = await adminClient
        .from('profiles')
        .insert({
            id: authData.user.id,
            email,
            name,
            role: 'super_admin',
        });

    if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError.message);
        // Tentar deletar o usuário do Auth se o perfil falhar
        await adminClient.auth.admin.deleteUser(authData.user.id);
        process.exit(1);
    }

    console.log('✅ Perfil criado na tabela profiles');
    console.log('');
    console.log('🎉 Super Admin criado com sucesso!');
    console.log('');
    console.log('📋 Credenciais de acesso:');
    console.log(`   Email: ${email}`);
    console.log(`   Senha: ${password}`);
    console.log('');
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
}

createSuperAdmin().catch(console.error);
