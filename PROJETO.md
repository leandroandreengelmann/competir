# Sistema de Gerenciamento de Eventos de Jiu-Jitsu

**Versão Atual**: 3.0.0 (Migrado para Supabase)  
**Última Atualização**: 27/01/2026  
**Stack**: Next.js 16.1.1, TypeScript, **Supabase** (Postgres + Auth + Storage + RLS), Tailwind CSS

---

## 📋 Visão Geral

Sistema completo para gerenciamento de campeonatos e eventos de Jiu-Jitsu, com suporte para múltiplos organizadores (multi-tenant), atletas, pagamentos via PIX (Asaas) e super-administradores. Inclui sistema de inscrições, automação de pagamentos, dashboards de métricas e assistente de criação de eventos auxiliado por IA.

---

## 🏗️ Arquitetura

### Tecnologias Principais

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript (Strict)
- **Database**: **Supabase** (PostgreSQL gerenciado)
- **Auth**: **Supabase Auth** (sessão via cookies `@supabase/ssr`)
- **Storage**: **Supabase Storage** (Buckets para posters e anexos)
- **RLS**: **Row Level Security** para isolamento multi-tenancy nativo
- **Styling**: Tailwind CSS + Design System Próprio
- **UI Components**: Radix UI + Lucide React
- **Notifications**: Sonner (Toast)
- **AI**: OpenAI SDK (Assistente de Evento)
- **Payments**: Asaas API (PIX) + Webhooks

### Padrões Arquiteturais

- **Server/Client Components**: Uso intensivo de Server Components para dados.
- **Server Actions**: Toda a lógica de mutação concentrada no servidor (`app/actions/`).
- **Multi-Tenancy**: Isolamento rigoroso via `organizer_id` nas tabelas e políticas de RLS.
- **Type Safety**: Interfaces TypeScript compartilhadas entre servidor e cliente.
- **Idempotência**: Processamento de pagamentos resiliente a duplicidade de eventos.

---

## 👥 Tipos de Usuário

### 1. Super Admin
- Gestão global de usuários e configurações.
- Dashboards consolidados de todo o sistema.
- **Painel**: `/painel/super-admin`

### 2. Organizador
- Criação e gestão completa de eventos.
- Configuração de categorias e taxas.
- Gestão de inscritos e conciliação manual de pagamentos.
- **Painel**: `/painel/organizador`

### 3. Atleta
- Inscrição em eventos ativos.
- Pagamento via PIX com confirmação automática.
- Visualização de chaves e histórico de lutas.
- **Painel**: `/painel/atleta`

---

## 🗄️ Banco de Dados

### Schema Real (Supabase Postgres)

#### Tabela: `profiles`
```sql
- id UUID PRIMARY KEY (FK para auth.users)
- name TEXT NOT NULL
- email TEXT UNIQUE NOT NULL
- role TEXT CHECK(role IN ('super_admin', 'organizador', 'atleta'))
- cpf TEXT UNIQUE -- Obrigatório para pagamentos Asaas
- phone TEXT
- created_at TIMESTAMPTZ DEFAULT now()
```

#### Tabela: `events`
```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- organizer_id UUID FK(profiles.id)
- name TEXT NOT NULL
- address TEXT
- date DATE
- description TEXT
- image_url TEXT -- Poster do evento no Storage
- is_open_for_inscriptions BOOLEAN DEFAULT true
- info_published BOOLEAN DEFAULT false
```

#### Tabela: `categories`
```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- organizer_id UUID FK(profiles.id)
- belt TEXT NOT NULL
- min_weight REAL
- max_weight REAL
- age_group TEXT
- registration_fee REAL DEFAULT 0
```

#### Tabela: `registrations`
```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- athlete_user_id UUID FK(profiles.id)
- event_id UUID FK(events.id)
- category_id UUID FK(categories.id)
- status TEXT CHECK(status IN ('pending_payment', 'paid', 'cancelled'))
- amount_cents INTEGER NOT NULL
- bracket_slot INTEGER -- Posição no chaveamento
- created_at TIMESTAMPTZ DEFAULT now()
```

#### Tabela: `asaas_payments`
```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- registration_id UUID FK(registrations.id) UNIQUE
- organizer_user_id UUID FK(profiles.id)
- asaas_payment_id TEXT UNIQUE
- status TEXT NOT NULL
- value_cents INTEGER NOT NULL
- pix_qr_code TEXT
- pix_copy_paste TEXT
- expires_at TIMESTAMPTZ
```

#### Tabela: `matches`
```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- event_id UUID FK(events.id)
- category_id UUID FK(categories.id)
- round INTEGER NOT NULL
- match_no INTEGER NOT NULL
- athlete_a_id UUID FK(profiles.id)
- athlete_b_id UUID FK(profiles.id)
- winner_id UUID FK(profiles.id)
- is_bye BOOLEAN DEFAULT false
- status TEXT DEFAULT 'pending'
```

---

## 🔐 Segurança

### Multi-Tenancy (RLS)
- **Isolamento Postgres**: Todas as tabelas possuem políticas de `USING (organizer_id = auth.uid())` ou similares.
- **Visibility Control**: Eventos são lidos publicamente apenas se `info_published` ou `is_open_for_inscriptions` for true.

### Integridade de Dados
- **Server-Side Validation**: Server Actions revalidam o `role` do usuário antes de qualquer operação.
- **Ownership Verification**: Validação rigorosa de que o recurso (evento, categoria, inscrição) pertence ao usuário logado.

---

## 📱 Funcionalidades Implementadas

### ✅ Autenticação & Perfis
- [x] Login/Signup com Supabase Auth.
- [x] Roles: Atleta, Organizador e Super Admin.
- [x] Cadastro público restrito ao papel de Atleta.
- [x] Gestão de perfil com CPF obrigatório para atletas.

### ✅ Organizador - Gestão de Eventos
- [x] Dashboard com métricas financeiras e de inscritos.
- [x] Gráficos de desempenho (Recharts).
- [x] CRUD de Eventos com upload de posters (Storage).
- [x] Assistente de Eventos IA (Integração OpenAI).
- [x] Gestão de Categorias e taxas de inscrição.
- [x] Chaveamento automático (Eliminatória Simples) com suporte a BYE.
- [x] LOCK de chaves e encerramento de inscrições.

### ✅ Pagamentos & Integrações
- [x] Configuração de chaves Asaas por Organizador.
- [x] Geração automática de PIX (QR Code + Copia e Cola).
- [x] Webhook Asaas para confirmação em tempo real.
- [x] Página de confirmação "OSS!" com animações premium.

### ✅ Atleta - Inscrições
- [x] Busca e visualização de eventos públicos.
- [x] Fluxo de inscrição com seleção de categoria.
- [x] Histórico de inscrições por status (Pendente, Pago, Cancelado).
- [x] Monitoramento de status em tempo real via Supabase Realtime.

---

## 📂 Estrutura de Diretórios Principal

```
app/
├── (public)/              # Páginas de Login, Signup e Index
├── api/                   # Webhooks (Asaas) e Route Handlers
├── actions/               # Server Actions (Lógica de Negócio)
├── painel/                # Áreas Privadas (atleta, organizador, super-admin)
components/
├── ui/                    # Componentes base (Radix UI)
├── layout/                # Estrutura de Header, Sidebar e Nav
├── event-*/               # Componentes específicos de Eventos
lib/
├── supabase/              # Clientes Supabase (Server, Client, Admin)
├── asaas-*/               # Clientes e processadores de pagamento
└── utils.ts               # Helpers e formatadores
```

---

## 🔄 Server Actions Principais

- **`auth.ts`**: Login, registro e logout seguro.
- **`events.ts`**: Criação de eventos com tratamento de posters.
- **`registrations.ts`**: Lógica de inscrição e snapshot de preços.
- **`asaas-payments.ts`**: Comunicação com Asaas e gestão de PIX.
- **`bracket-management.ts`**: Geração e controle de chaves de luta.
- **`event-assistant.ts`**: Orquestração do assistente de IA.

---

## 🎨 Design System

- **Tema**: Roxo Moderno (Purple Theme).
- **Tipografia**: Inter.
- **Animações**: Framer Motion (Transições e Status de Pagamento).
- **Componentes**: Botões con gradientes, Cards com sombras suaves e Badges semânticos.

---

## 🧪 Status das Features

| Feature | Status |
|---------|--------|
| Inscrição Atleta | ✅ Completo |
| Pagamento PIX (Webhook) | ✅ Completo |
| Chaveamento Dinâmico | ✅ Completo |
| Assistente de IA | ✅ Completo |
| Dashboard Organizador | ✅ Completo |
| Super Admin Panel | ✅ Completo |
| Relatórios Financeiros | 🔜 Em Desenvolvimento |

---
**Versão**: 3.0.0  
**Última Atualização**: 27/01/2026  
**Desenvolvido por**: Antigravity AI  
