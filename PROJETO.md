# Sistema de Gerenciamento de Eventos de Jiu-Jitsu

**Versão Atual**: 3.0.0 (Supabase)  
**Última Atualização**: 29/01/2026  
**Stack**: Next.js 16.1.1, TypeScript, **Supabase** (Postgres + Auth + Storage + RLS), Tailwind CSS  
**Database**: PostgreSQL 17.6.1 (Supabase Project ID: `hmcvkdfnxxqobgfgiyhi`)

---

## 📋 Visão Geral

Sistema completo para gerenciamento de campeonatos e eventos de Jiu-Jitsu, com suporte para múltiplos organizadores (multi-tenant), atletas, pagamentos via PIX (Asaas) e super-administradores. Inclui sistema de inscrições, automação de pagamentos, dashboards de métricas e assistente de criação de eventos auxiliado por IA.

**Características Principais:**
- Multi-tenancy com isolamento rigoroso via Row Level Security (RLS)
- Autenticação e autorização completa com Supabase Auth
- Sistema de pagamentos PIX integrado com Asaas
- Assistente de eventos com IA (OpenAI)
- Chaveamento automático de lutas
- Dashboards com métricas e gráficos em tempo real
- Normalização de dados com tabelas de referência
- Sistema de criptografia para chaves de API

---

## 🗄️ Banco de Dados

### Informações da Instância Supabase

- **Project Name**: ottrmobilidade@gmail.com's Project
- **Database Name**: `postgres`
- **Project ID/Ref**: `hmcvkdfnxxqobgfgiyhi`
- **Database Host**: `db.hmcvkdfnxxqobgfgiyhi.supabase.co`
- **PostgreSQL Version**: 17.6.1 (engine 17)
- **Region**: us-east-1 (Norte da Virgínia, EUA)
- **Status**: ACTIVE_HEALTHY ✅
- **Criado em**: 20/01/2026
- **Total de Tabelas**: 18 tabelas no schema `public`

### Estatísticas Atuais

- **Total de Usuários**: 10
  - 6 Atletas
  - 3 Organizadores
  - 1 Super Admin
- **Total de Eventos**: 2
- **Total de Categorias**: 6
- **Total de Inscrições**: 0
- **Total de Lutas**: 0
- **Faixas Cadastradas**: 9
- **Faixas Etárias**: 30

---

## 🗃️ Schema Completo do Banco de Dados (18 Tabelas)

### 1. Gestão de Usuários e Perfis

#### Tabela: `profiles`
**Descrição**: Perfil principal de todos os usuários do sistema.

```sql
- id UUID PRIMARY KEY (FK para auth.users)
- name TEXT NOT NULL
- email TEXT UNIQUE NOT NULL
- role TEXT NOT NULL CHECK(role IN ('super_admin', 'organizador', 'atleta'))
- cpf TEXT UNIQUE -- Obrigatório para pagamentos Asaas
- phone TEXT
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ
```

**RLS**: Habilitado  
**Constraints**: 
- Email único no sistema
- CPF único quando presente
- Role restrito a 3 valores

---

#### Tabela: `athlete_profiles`
**Descrição**: Perfil estendido exclusivo para atletas com informações adicionais.

```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL FK(profiles.id) UNIQUE
- phone TEXT
- birth_date TEXT -- Formato livre
- weight REAL -- Peso em kg
- gender TEXT -- Gênero do atleta
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ
```

**RLS**: Habilitado  
**Relacionamento**: 1:1 com `profiles` (apenas atletas)  
**Uso**: Complementa o perfil base com dados específicos de atletas

---

#### Tabela: `athlete_event_interests`
**Descrição**: Registra interesse de atletas em eventos específicos (usado no fluxo de signup/login).

```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- athlete_user_id UUID NOT NULL FK(profiles.id)
- event_id UUID NOT NULL FK(events.id)
- created_at TIMESTAMPTZ DEFAULT now()
```

**RLS**: Habilitado  
**Unique Constraint**: (athlete_user_id, event_id)  
**Uso**: Quando atleta acessa evento antes de ter conta, registra interesse para redirecionar após login

---

### 2. Eventos e Categorias

#### Tabela: `events`
**Descrição**: Eventos/campeonatos de Jiu-Jitsu.

```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- organizer_id UUID NOT NULL FK(profiles.id)
- name TEXT NOT NULL
- address TEXT NOT NULL -- Legado
- address_text TEXT -- Endereço em texto livre
- address_formatted TEXT -- Endereço formatado do Google Maps
- lat DOUBLE PRECISION -- Latitude (Google Maps)
- lng DOUBLE PRECISION -- Longitude (Google Maps)
- place_id TEXT -- Google Places ID
- description TEXT
- date TEXT NOT NULL -- Data como texto (formato flexível)
- image_url TEXT -- URL do poster no Supabase Storage
- is_open_for_inscriptions BOOLEAN DEFAULT true
- is_published BOOLEAN DEFAULT false -- Visível na Home Page
- info_published BOOLEAN DEFAULT false -- Informações gerais publicadas
- info_published_at TIMESTAMPTZ
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ
```

**RLS**: Habilitado (isolamento por organizer_id)  
**Campos Google Maps**: lat, lng, place_id, address_formatted  
**Controles de Visibilidade**:
- `is_published`: Evento aparece na lista pública da home
- `info_published`: Informações gerais estão visíveis para inscritos
- `is_open_for_inscriptions`: Aceita novas inscrições

---

#### Tabela: `categories`
**Descrição**: Categorias de luta (faixa + peso + idade).

```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- organizer_id UUID NOT NULL FK(profiles.id)
- belt TEXT NOT NULL -- Nome da faixa (denormalizado)
- belt_id UUID FK(belts.id) -- Referência normalizada
- min_weight REAL NOT NULL
- max_weight REAL NOT NULL
- age_group TEXT NOT NULL -- Nome da faixa etária (denormalizado)
- age_group_id UUID FK(age_groups.id) -- Referência normalizada
- registration_fee REAL NOT NULL DEFAULT 0
- bracket_size INTEGER DEFAULT 4 -- Tamanho da chave
- is_locked BOOLEAN DEFAULT false -- Chave travada
- lock_at TIMESTAMPTZ -- Momento do travamento
- reveal_at TIMESTAMPTZ -- Momento de revelação das chaves
- created_at TIMESTAMPTZ DEFAULT now()
```

**RLS**: Habilitado (isolamento por organizer_id)  
**Sistema Híbrido**: Mantém tanto texto (belt, age_group) quanto IDs normalizados  
**Chaveamento**: Controle de travamento e revelação de chaves

---

#### Tabela: `belts`
**Descrição**: Tabela de referência para faixas de Jiu-Jitsu.

```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- name TEXT UNIQUE NOT NULL
- created_at TIMESTAMPTZ DEFAULT now()
```

**RLS**: Habilitado  
**Registros**: 9 faixas cadastradas  
**Uso**: Normalização e padronização de faixas

---

#### Tabela: `age_groups`
**Descrição**: Tabela de referência para faixas etárias.

```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- name TEXT UNIQUE NOT NULL
- created_at TIMESTAMPTZ DEFAULT now()
```

**RLS**: Habilitado  
**Registros**: 30 faixas etárias cadastradas  
**Uso**: Normalização e padronização de faixas etárias

---

#### Tabela: `event_categories`
**Descrição**: Relacionamento many-to-many entre eventos e categorias.

```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- event_id UUID NOT NULL FK(events.id)
- category_id UUID NOT NULL FK(categories.id)
- created_at TIMESTAMPTZ DEFAULT now()
```

**RLS**: Habilitado  
**Nota**: Aparentemente redundante, pois categories já tem organizer_id implícito

---

### 3. Inscrições e Pagamentos

#### Tabela: `registrations`
**Descrição**: Inscrições de atletas em categorias de eventos.

```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- athlete_user_id UUID NOT NULL FK(profiles.id)
- event_id UUID NOT NULL FK(events.id)
- category_id UUID NOT NULL FK(categories.id)
- status TEXT NOT NULL CHECK(status IN ('pending_payment', 'paid', 'cancelled'))
- amount_cents INTEGER NOT NULL -- Snapshot do valor no momento da inscrição
- bracket_slot INTEGER -- Posição no chaveamento
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ
```

**RLS**: Habilitado  
**Status Possíveis**: pending_payment, paid, cancelled  
**Snapshot de Preço**: amount_cents captura valor no momento da inscrição

---

#### Tabela: `asaas_payments`
**Descrição**: Pagamentos PIX via gateway Asaas.

```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- registration_id UUID UNIQUE NOT NULL FK(registrations.id)
- organizer_user_id UUID NOT NULL FK(profiles.id)
- asaas_payment_id TEXT UNIQUE NOT NULL
- asaas_customer_id TEXT NOT NULL
- status TEXT NOT NULL
- value_cents INTEGER NOT NULL
- pix_qr_code TEXT -- URL da imagem QR Code
- pix_copy_paste TEXT -- Código Pix Copia e Cola
- expires_at TIMESTAMPTZ
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ
```

**RLS**: Habilitado  
**Unicidade**: 1 pagamento por inscrição  
**Webhook**: Atualizado automaticamente via webhook do Asaas

---

#### Tabela: `organizer_asaas_credentials`
**Descrição**: Credenciais criptografadas do Asaas por organizador.

```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- organizer_user_id UUID UNIQUE NOT NULL FK(profiles.id)
- asaas_api_key TEXT -- DEPRECATED (texto plano)
- asaas_api_key_encrypted TEXT -- Chave criptografada (atual)
- asaas_api_key_last4 TEXT -- Últimos 4 dígitos (exibição)
- environment TEXT NOT NULL CHECK(environment IN ('sandbox', 'production'))
- is_active BOOLEAN NOT NULL DEFAULT true
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ
```

**RLS**: Habilitado (só organizador vê próprias credentials)  
**Segurança**: Sistema de criptografia AES-256-GCM  
**Migration**: Hardening aplicado para migrar de texto plano para criptografado

---

### 4. Lutas e Chaveamento

#### Tabela: `matches`
**Descrição**: Lutas/combates do chaveamento.

```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- event_id UUID NOT NULL FK(events.id)
- category_id UUID NOT NULL FK(categories.id)
- round INTEGER NOT NULL -- Número da rodada
- match_no INTEGER NOT NULL -- Número da luta na rodada
- athlete_a_id UUID FK(profiles.id)
- athlete_b_id UUID FK(profiles.id)
- winner_id UUID FK(profiles.id)
- is_bye BOOLEAN DEFAULT false -- Luta com BYE (atleta passa direto)
- status TEXT DEFAULT 'pending'
- created_at TIMESTAMPTZ DEFAULT now()
```

**RLS**: Habilitado  
**Chaveamento**: Sistema de eliminatória simples com suporte a BYE

---

### 5. Assistente de IA

#### Tabela: `event_assistant_responses`
**Descrição**: Respostas geradas pelo assistente de IA para termos de conhecimento.

```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- event_id UUID NOT NULL FK(events.id)
- kb_term TEXT NOT NULL -- Termo da base de conhecimento
- answer_raw TEXT NOT NULL -- Resposta bruta da IA
- status TEXT NOT NULL
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ
```

**RLS**: Habilitado  
**Uso**: Cache de respostas da IA por evento

---

#### Tabela: `event_assistant_attachments`
**Descrição**: Arquivos anexados ao assistente de eventos.

```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- event_id UUID NOT NULL FK(events.id)
- organizer_id UUID NOT NULL FK(profiles.id)
- kb_term TEXT NOT NULL
- file_url TEXT NOT NULL -- URL no Supabase Storage
- file_name TEXT NOT NULL
- file_type TEXT NOT NULL
- file_size BIGINT NOT NULL
- created_at TIMESTAMPTZ DEFAULT now()
```

**RLS**: Habilitado  
**Uso**: PDFs, documentos anexados ao evento para contexto da IA

---

#### Tabela: `event_assistant_custom`
**Descrição**: Perguntas e respostas customizadas por evento.

```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- event_id UUID NOT NULL FK(events.id)
- question_text TEXT NOT NULL
- answer_text TEXT NOT NULL
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ
```

**RLS**: Habilitado  
**Uso**: FAQs personalizados definidos pelo organizador

---

#### Tabela: `knowledge_entries`
**Descrição**: Base de conhecimento global do sistema.

```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- label TEXT -- Rótulo/tema da entrada
- content TEXT NOT NULL -- Conteúdo
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ DEFAULT now()
```

**RLS**: Habilitado  
**Uso**: Conhecimento compartilhado entre todos os eventos

---

### 6. Configurações do Sistema

#### Tabela: `system_integrations`
**Descrição**: Integrações globais do sistema (ex: OpenAI).

```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- provider TEXT NOT NULL -- Nome do provider (ex: 'openai')
- api_key_ciphertext TEXT NOT NULL -- Chave criptografada
- api_key_iv TEXT NOT NULL -- Initialization Vector (AES-GCM)
- api_key_tag TEXT NOT NULL -- Authentication Tag (AES-GCM)
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ DEFAULT now()
```

**RLS**: Habilitado (somente super_admin)  
**Segurança**: Criptografia AES-256-GCM para chaves de API

---

#### Tabela: `login_background_settings`
**Descrição**: Configurações de imagens de fundo da tela de login.

```sql
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- key TEXT UNIQUE NOT NULL
- desktop_image_path TEXT
- mobile_image_path TEXT
- updated_at TIMESTAMPTZ DEFAULT now()
```

**RLS**: Habilitado  
**Registros**: 1 registro (singleton)  
**Uso**: Personalização da tela de login

---

## 🏗️ Arquitetura

### Tecnologias Principais

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Database**: PostgreSQL 17.6.1 (Supabase Managed)
- **Auth**: Supabase Auth (sessão via cookies `@supabase/ssr`)
- **Storage**: Supabase Storage (Buckets para posters e anexos)
- **RLS**: Row Level Security para isolamento multi-tenancy nativo
- **Styling**: Tailwind CSS 4 + Design System Próprio
- **UI Components**: Radix UI + Lucide React
- **Notifications**: Sonner (Toast)
- **Charts**: Recharts (Gráficos de dashboard)
- **AI**: OpenAI SDK (Assistente de Evento)
- **Payments**: Asaas API (PIX) + Webhooks
- **Maps**: Google Maps API (Seleção de endereço)

### Padrões Arquiteturais

- **Server/Client Components**: Uso intensivo de Server Components para dados
- **Server Actions**: Toda a lógica de mutação concentrada no servidor (`app/actions/`)
- **Multi-Tenancy**: Isolamento rigoroso via `organizer_id` nas tabelas e políticas de RLS
- **Type Safety**: Interfaces TypeScript compartilhadas entre servidor e cliente
- **Idempotência**: Processamento de pagamentos resiliente a duplicidade de eventos
- **Normalização**: Tabelas de referência (belts, age_groups) com fallback para texto

---

## 👥 Tipos de Usuário

### 1. Super Admin
**Role**: `super_admin`  
**Acesso**: Gestão global do sistema

**Funcionalidades**:
- Dashboard consolidado de todo o sistema
- Gestão de organizadores
- Configuração de faixas (belts)
- Configuração de faixas etárias (age groups)
- Gestão da base de conhecimento global
- Configurações do sistema (integrações, login)
- Alteração de senha
- Gerenciamento de perfil

**Painel**: `/painel/super-admin`

---

### 2. Organizador
**Role**: `organizador`  
**Acesso**: Gestão de seus próprios eventos

**Funcionalidades**:
- Dashboard com métricas financeiras e de inscritos
- Gráficos de evolução de inscrições (Recharts)
- CRUD completo de Eventos
  - Upload de posters (Supabase Storage)
  - Seleção de endereço com Google Maps
  - Controle de publicação e abertura de inscrições
  - Assistente de IA para criação
- Gestão de Categorias
  - Criação e edição de categorias
  - Definição de taxas de inscrição
  - Controle de travamento de chaves
- Gestão de Inscrições
  - Visualização de inscritos por categoria
  - Conciliação manual de pagamentos
  - Exportação de dados
- Chaveamento
  - Geração automática de chaves (Eliminatória Simples)
  - Suporte a BYE
  - Travamento e revelação de chaves
  - Visualização e edição de lutas
- Configuração do Assistente de IA
  - Upload de anexos (regulamentos, etc)
  - Perguntas e respostas customizadas
  - Gerenciamento de respostas
- Gestão de Pagamentos Asaas
  - Configuração de chaves API (criptografadas)
  - Seleção de ambiente (sandbox/production)
- Categorias Globais
  - Visualização de categorias
- Alteração de senha
- Gerenciamento de perfil

**Painel**: `/painel/organizador`

---

### 3. Atleta
**Role**: `atleta`  
**Acesso**: Inscrição em eventos e visualização de dados pessoais

**Funcionalidades**:
- Dashboard com visão geral de inscrições
- Busca e visualização de eventos públicos
- Fluxo de inscrição
  - Seleção de categoria
  - Geração de PIX
  - Acompanhamento de status
- Página de pagamento
  - QR Code PIX
  - Código Copia e Cola
  - Instruções de pagamento
- Confirmação de pagamento
  - Página "OSS!" com animações
  - Status em tempo real
- Histórico de inscrições
  - Agrupado por status (Pendente, Pago, Cancelado)
- Visualização de chaves (quando reveladas)
- Alteração de senha
- Gerenciamento de perfil

**Painel**: `/painel/atleta`

---

## 📱 Mapa Completo de Rotas e Telas

### Rotas Públicas

#### `/` - Home Page
**Descrição**: Página inicial com lista de eventos públicos  
**Arquivo**: `app/page.tsx`  
**Componentes**: `public-events-client.tsx`, `public-header.tsx`, `public-footer.tsx`  
**Filtro**: Apenas eventos com `is_published = true`

---

#### `/login` - Tela de Login
**Descrição**: Autenticação de usuários  
**Arquivo**: `app/login/page.tsx`  
**Componente**: `login-form.tsx`  
**Recursos**:
- Login com email e senha
- Suporte a parâmetro `returnEvent` (redireciona para evento após login)
- Suporte a parâmetro `next` (redirecionamento customizado)
- Link para "Esqueci minha senha"
- Link para cadastro

---

#### `/signup` - Cadastro de Atleta
**Descrição**: Registro público (apenas role atleta)  
**Arquivo**: `app/signup/page.tsx`  
**Segurança**: Role fixo como 'atleta' (hardcoded no server action)  
**Campos**:
- Nome, CPF, Email, Senha
- Telefone, Data de nascimento, Peso, Gênero (opcionais)
**Recursos**:
- Validação de CPF e email em tempo real
- Criação de `athlete_profile` automática
- Suporte a `returnEvent` para registrar interesse

---

#### `/eventos/[eventId]` - Página Pública do Evento
**Descrição**: Visualização pública de evento específico  
**Arquivo**: `app/eventos/[eventId]/page.tsx`  
**Componente**: `EventPublicView.tsx`  
**Subcomponentes**:
- `EventPosterSquare.tsx` - Poster do evento
- `EventInfoCard.tsx` - Informações gerais
- `EventLocationCard.tsx` - Mapa e localização
- `EventFAQAccordion.tsx` - Perguntas frequentes
- `EventTabs.tsx` - Navegação entre abas
**Controle**: Visível apenas se `is_published` ou `is_open_for_inscriptions`

---

#### `/auth/forgot-password` - Recuperação de Senha
**Descrição**: Solicitar reset de senha  
**Arquivo**: `app/auth/forgot-password/page.tsx`  
**Fluxo**: Envia email com link mágico

---

#### `/auth/reset-password` - Redefinir Senha
**Descrição**: Criar nova senha após link do email  
**Arquivo**: `app/auth/reset-password/page.tsx`  
**Validação**: Requer sessão válida do link de reset

---

#### `/auth/callback` - Callback de Autenticação
**Descrição**: Processa callbacks do Supabase Auth  
**Uso**: Troca de código por sessão, redirecionamentos

---

#### `/design-system` - Documentação do Design System
**Descrição**: Showcase de componentes UI  
**Arquivo**: `app/design-system/page.tsx`

---

### Painel Geral

#### `/painel` - Redirecionador por Role
**Descrição**: Redireciona para painel específico baseado no role  
**Arquivo**: `app/painel/page.tsx`  
**Lógica**:
- `super_admin` → `/painel/super-admin`
- `organizador` → `/painel/organizador`
- `atleta` → `/painel/atleta`

---

### Painel do Atleta

#### `/painel/atleta` - Dashboard do Atleta
**Descrição**: Visão geral de inscrições e eventos  
**Arquivo**: `app/painel/atleta/page.tsx`  
**Componente**: `dashboard-client.tsx`  
**Métricas**:
- Total de inscrições
- Inscrições pendentes
- Inscrições pagas
- Eventos disponíveis
**Cards**: Lista de eventos públicos para inscrição

---

#### `/painel/atleta/eventos` - Navegador de Eventos
**Descrição**: Lista de eventos disponíveis para inscrição  
**Arquivo**: `app/painel/atleta/eventos/page.tsx`

---

#### `/painel/atleta/pagamento/[registrationId]` - Tela de Pagamento PIX
**Descrição**: Página com QR Code e Copia e Cola do PIX  
**Arquivo**: `app/painel/atleta/pagamento/[registrationId]/page.tsx`  
**Recursos**:
- QR Code interativo
- Botão Copiar Código PIX
- Instruções de pagamento
- Polling de status (verifica pagamento a cada 5s)

---

#### `/painel/atleta/pagamento-confirmado` - Confirmação de Pagamento
**Descrição**: Tela "OSS!" após pagamento confirmado  
**Arquivo**: `app/painel/atleta/pagamento-confirmado/page.tsx`  
**Recursos**:
- Animações premium (Framer Motion)
- Confetes
- Detalhes da inscrição
- Botão para voltar ao dashboard

---

#### `/painel/atleta/meu-perfil` - Perfil do Atleta
**Descrição**: Edição de dados pessoais  
**Arquivo**: `app/painel/atleta/meu-perfil/page.tsx`  
**Componente**: `profile-form.tsx`  
**Campos**: Nome, Email, CPF, Telefone

---

#### `/painel/atleta/alterar-senha` - Alterar Senha
**Descrição**: Mudança de senha  
**Arquivo**: `app/painel/atleta/alterar-senha/page.tsx`  
**Componente**: `password-form.tsx`

---

### Painel do Organizador

#### `/painel/organizador` - Dashboard do Organizador
**Descrição**: Métricas e evolução de inscrições  
**Arquivo**: `app/painel/organizador/page.tsx`  
**Componente**: `dashboard-client.tsx`  
**Métricas**:
- Total de atletas inscritos
- Total arrecadado (R$)
- Eventos ativos
- Categorias criadas
**Gráficos**: Evolução de inscrições por período (dia/semana/mês)  
**Componente de Gráfico**: `dashboard-charts.tsx` (Recharts)

---

#### `/painel/organizador/eventos` - Lista de Eventos
**Descrição**: CRUD de eventos  
**Arquivo**: `app/painel/organizador/eventos/page.tsx`  
**Recursos**:
- Listagem paginada
- Busca por nome
- Botão "Novo Evento"
- Cards com preview e ações

---

#### `/painel/organizador/eventos/novo` - Criar Novo Evento
**Descrição**: Formulário de criação de evento  
**Arquivo**: `app/painel/organizador/eventos/novo/page.tsx`  
**Componente**: `event-form.tsx`  
**Campos**:
- Nome do evento
- Data
- Endereço (Google Maps AddressPicker)
- Descrição
- Upload de poster (Supabase Storage)
- Controles de publicação

---

#### `/painel/organizador/eventos/[eventId]` - Gerenciamento do Evento
**Descrição**: Hub de gestão completa do evento  
**Arquivo**: `app/painel/organizador/eventos/[eventId]/page.tsx`  
**Componente**: `event-page-client.tsx`  
**Abas**:
1. Informações Gerais
2. Categorias
3. Inscrições
4. Configurar Assistente

---

##### `/painel/organizador/eventos/[eventId]/informacoes-gerais` - Informações do Evento
**Descrição**: Edição de dados do evento  
**Diretório**: `app/painel/organizador/eventos/[eventId]/informacoes-gerais/`  
**Componente**: `info-summary-client.tsx`  
**Recursos**:
- Formulário de edição (`event-form.tsx`)
- Controle de publicação (`info_published`)
- Controle de visibilidade (`is_published`)
- Preview do evento

---

##### `/painel/organizador/eventos/[eventId]/categorias` - Gestão de Categorias
**Descrição**: CRUD de categorias do evento  
**Diretório**: `app/painel/organizador/eventos/[eventId]/categorias/`  
**Recursos**:
- Criar categoria (`add-categories-dialog.tsx`)
- Editar categoria (`category-dialog.tsx`)
- Listar inscritos por categoria
- Gerar chaves (`bracket-management.ts`)
- Travar chaves
- Definir horário de revelação
**Sub-rotas**:
- `add` - Adicionar categorias
- `bracket/[categoryId]` - Visualizar chaveamento
- `edit/[categoryId]` - Editar categoria

---

##### `/painel/organizador/eventos/[eventId]/inscricoes` - Gerenciar Inscrições
**Descrição**: Visualização e gestão de inscrições  
**Diretório**: `app/painel/organizador/eventos/[eventId]/inscricoes/`  
**Recursos**:
- Filtros por status (Todas, Pagas, Pendentes)
- Conciliação manual de pagamentos
- Visualização de detalhes
- Exportação

---

##### `/painel/organizador/eventos/[eventId]/configurar-assistente` - Assistente de IA
**Descrição**: Configuração do assistente do evento  
**Diretório**: `app/painel/organizador/eventos/[eventId]/configurar-assistente/`  
**Componente**: `assistant-chat-client.tsx`  
**Recursos**:
- Upload de arquivos (regulamentos, etc)
- Chat com IA (OpenAI)
- Criar perguntas e respostas customizadas
- Gerenciar respostas geradas
**Sub-rotas**:
- `attachments` - Gerenciar anexos
- `custom-qa` - Perguntas e respostas customizadas

---

#### `/painel/organizador/categorias` - Categorias Globais
**Descrição**: Visualização de todas as categorias criadas  
**Arquivo**: `app/painel/organizador/categorias/page.tsx`  
**Uso**: Banco de categorias para reutilização

---

#### `/painel/organizador/pagamentos` - Configuração Asaas
**Descrição**: Gestão de credenciais Asaas  
**Arquivo**: `app/painel/organizador/pagamentos/page.tsx`  
**Recursos**:
- Cadastrar chave API (criptografada)
- Escolher ambiente (sandbox/production)
- Ativar/desativar integração
- Visualização segura (últimos 4 dígitos)

---

#### `/painel/organizador/meu-perfil` - Perfil do Organizador
**Descrição**: Edição de dados pessoais  
**Arquivo**: `app/painel/organizador/meu-perfil/page.tsx`  
**Componente**: `profile-form.tsx`

---

#### `/painel/organizador/alterar-senha` - Alterar Senha
**Descrição**: Mudança de senha  
**Arquivo**: `app/painel/organizador/alterar-senha/page.tsx`  
**Componente**: `password-form.tsx`

---

### Painel do Super Admin

#### `/painel/super-admin` - Dashboard do Super Admin
**Descrição**: Visão consolidada do sistema  
**Arquivo**: `app/painel/super-admin/page.tsx`  
**Métricas**:
- Total de organizadores
- Total de atletas
- Total de eventos
- Total de inscrições
**Cards de Ação Rápida**:
- Gerenciar Organizadores
- Faixas
- Faixas Etárias
- Base de Conhecimento
- Configurações

---

#### `/painel/super-admin/organizadores` - Gestão de Organizadores
**Descrição**: CRUD de organizadores  
**Arquivo**: `app/painel/super-admin/organizadores/page.tsx`  
**Recursos**:
- Listar organizadores
- Criar novo organizador
- Editar organizador
- Desativar/ativar
**Sub-rotas**:
- `novo` - Criar organizador
- `edit/[id]` - Editar organizador

---

#### `/painel/super-admin/faixas` - Gestão de Faixas
**Descrição**: CRUD de faixas (belts)  
**Arquivo**: `app/painel/super-admin/faixas/page.tsx`  
**Recursos**:
- Listar faixas
- Criar faixa
- Editar faixa
- Remover faixa

---

#### `/painel/super-admin/faixas-etarias` - Gestão de Faixas Etárias
**Descrição**: CRUD de faixas etárias (age groups)  
**Arquivo**: `app/painel/super-admin/faixas-etarias/page.tsx`  
**Recursos**:
- Listar faixas etárias
- Criar faixa etária
- Editar faixa etária
- Remover faixa etária

---

#### `/painel/super-admin/knowledge-base` - Base de Conhecimento
**Descrição**: Gestão da base de conhecimento global  
**Arquivo**: `app/painel/super-admin/knowledge-base/page.tsx`  
**Recursos**:
- Listar entradas
- Criar entrada
- Editar entrada
- Remover entrada
**Sub-rotas**:
- `novo` - Nova entrada

---

#### `/painel/super-admin/configuracoes` - Configurações do Sistema
**Descrição**: Configurações globais  
**Diretório**: `app/painel/super-admin/configuracoes/`  
**Sub-rotas**:
- `login` - Configuração de imagens da tela de login
- `openai` - Configuração de chave OpenAI

---

#### `/painel/super-admin/meu-perfil` - Perfil do Super Admin
**Descrição**: Edição de dados pessoais  
**Arquivo**: `app/painel/super-admin/meu-perfil/page.tsx`  
**Componente**: `profile-form.tsx`

---

#### `/painel/super-admin/alterar-senha` - Alterar Senha
**Descrição**: Mudança de senha  
**Arquivo**: `app/painel/super-admin/alterar-senha/page.tsx`  
**Componente**: `password-form.tsx`

---

## 🔐 Segurança

### Multi-Tenancy (RLS)

**Implementação**:
- **Isolamento Postgres**: Todas as 18 tabelas possuem políticas de RLS habilitadas
- **Policies**: `USING (organizer_id = auth.uid())` ou similares
- **Visibility Control**: Eventos são lidos publicamente apenas se `is_published` ou `is_open_for_inscriptions` for true

### Sistema de Criptografia

**Chaves Asaas (Organizadores)**:
- Algoritmo: AES-256-GCM
- Armazenamento: `organizer_asaas_credentials.asaas_api_key_encrypted`
- Metadados: IV e Tag separados
- Exibição: Apenas últimos 4 dígitos visíveis
- Variável de ambiente: `ASAAS_KEYS_MASTER_KEY`

**Integrações Globais (Super Admin)**:
- Algoritmo: AES-256-GCM
- Armazenamento: `system_integrations` (ciphertext, iv, tag)
- Providers: OpenAI, etc
- Variável de ambiente: `APP_ENCRYPTION_KEY_BASE64`

### Integridade de Dados

- **Server-Side Validation**: Server Actions revalidam o `role` do usuário antes de qualquer operação
- **Ownership Verification**: Validação rigorosa de que o recurso (evento, categoria, inscrição) pertence ao usuário logado
- **Type Safety**: TypeScript strict mode em todo o projeto
- **Idempotência**: Webhooks Asaas processam eventos apenas uma vez (baseado em `asaas_payment_id` único)

---

## 📂 Estrutura de Diretórios

```
app/
├── (public)/                  # Rotas públicas
│   ├── login/                 # Tela de login
│   ├── signup/                # Cadastro de atleta
│   └── auth/                  # Callbacks e recuperação de senha
├── api/                       # API Routes
│   ├── asaas/                 # (webhooks movidos para webhooks/)
│   ├── webhooks/              # Webhooks externos
│   │   └── asaas/             # Webhook de pagamento Asaas
│   ├── organizador/           # APIs específicas do organizador
│   └── pdf/                   # Geração de PDFs
├── actions/                   # Server Actions (Lógica de Negócio)
│   ├── auth.ts                # Login, registro, logout
│   ├── events.ts              # CRUD de eventos
│   ├── categories.ts          # CRUD de categorias
│   ├── registrations.ts       # Lógica de inscrição
│   ├── asaas-payments.ts      # Integração Asaas
│   ├── bracket-management.ts  # Geração e gestão de chaves
│   ├── event-assistant.ts     # Orquestração do assistente IA
│   ├── event-assistant-attachments.ts
│   ├── athlete-interests.ts   # Interesses de atletas
│   ├── dashboard.ts           # Métricas de dashboards
│   ├── user.ts                # Gestão de usuários
│   └── ...                    # Outros actions
├── eventos/                   # Visualização pública de eventos
│   └── [eventId]/
│       └── page.tsx
├── painel/                    # Áreas Privadas
│   ├── atleta/                # Painel do Atleta
│   │   ├── page.tsx           # Dashboard
│   │   ├── dashboard-client.tsx
│   │   ├── eventos/           # Lista de eventos
│   │   ├── pagamento/         # Tela de pagamento PIX
│   │   ├── pagamento-confirmado/  # Confirmação "OSS!"
│   │   ├── meu-perfil/
│   │   └── alterar-senha/
│   ├── organizador/           # Painel do Organizador
│   │   ├── page.tsx           # Dashboard com gráficos
│   │   ├── dashboard-client.tsx
│   │   ├── dashboard-charts.tsx  # Componente Recharts
│   │   ├── eventos/
│   │   │   ├── page.tsx       # Lista de eventos
│   │   │   ├── novo/          # Criar evento
│   │   │   └── [eventId]/     # Gestão do evento
│   │   │       ├── page.tsx
│   │   │       ├── event-page-client.tsx
│   │   │       ├── informacoes-gerais/
│   │   │       ├── categorias/
│   │   │       ├── inscricoes/
│   │   │       └── configurar-assistente/
│   │   ├── categorias/        # Categorias globais
│   │   ├── pagamentos/        # Config Asaas
│   │   ├── meu-perfil/
│   │   └── alterar-senha/
│   └── super-admin/           # Painel do Super Admin
│       ├── page.tsx           # Dashboard global
│       ├── organizadores/     # Gestão de organizadores
│       ├── faixas/            # CRUD de faixas
│       ├── faixas-etarias/    # CRUD de faixas etárias
│       ├── knowledge-base/    # Base de conhecimento
│       ├── configuracoes/     # Configurações
│       │   ├── login/         # Config imagens login
│       │   └── openai/        # Config OpenAI
│       ├── meu-perfil/
│       └── alterar-senha/
├── design-system/             # Showcase de componentes
│   └── page.tsx
├── layout.tsx                 # Layout raiz
├── page.tsx                   # Home page
└── globals.css                # Estilos globais

components/
├── ui/                        # Componentes base (Radix UI)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── table.tsx
│   ├── badge.tsx
│   ├── alert-dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── sheet.tsx
│   ├── radio-group.tsx
│   ├── pagination.tsx
│   ├── inline-notice.tsx
│   ├── logout-button.tsx
│   └── sonner.tsx
├── layout/                    # Componentes de estrutura
│   ├── dashboard-layout.tsx
│   └── page-header.tsx
├── profile/                   # Perfis
│   ├── profile-form.tsx
│   └── password-form.tsx
├── event-public/              # Componentes de evento público
│   ├── EventPublicView.tsx
│   ├── EventPosterSquare.tsx
│   ├── EventInfoCard.tsx
│   ├── EventLocationCard.tsx
│   ├── EventFAQAccordion.tsx
│   └── EventTabs.tsx
├── event-*/                   # Componentes específicos de eventos
│   ├── event-image-upload.tsx
│   ├── delete-event-button.tsx
│   └── ...
├── AddressPicker.tsx          # Google Maps picker
├── admin-sidebar.tsx
├── organizer-sidebar.tsx
├── mobile-nav.tsx
├── app-header.tsx
├── public-header.tsx
├── public-footer.tsx
├── bracket-view.tsx           # Visualização de chaves
├── category-dialog.tsx
├── add-categories-dialog.tsx
├── categories-client.tsx
├── belts-client.tsx
├── age-groups-client.tsx
└── public-events-client.tsx

lib/
├── supabase/                  # Clientes Supabase
│   ├── server.ts              # Cliente server-side (cookies)
│   ├── client.ts              # Cliente client-side
│   ├── admin.ts               # Cliente admin (service_role)
│   └── middleware.ts          # Middleware de auth
├── asaas-client.ts            # Cliente HTTP Asaas
├── asaas-webhook-processor.ts # Processador de webhooks
├── crypto.ts                  # Funções de criptografia AES-GCM
├── crypto/                    # Módulo de criptografia
│   └── encryption.ts
├── openai.ts                  # Cliente OpenAI
├── bracket-utils.ts           # Lógica de chaveamento
├── pdf/                       # Geração de PDFs
│   ├── bracket-pdf.ts
│   ├── registration-pdf.ts
│   └── event-pdf.ts
├── routes.ts                  # Constantes de rotas
└── utils.ts                   # Helpers e formatadores

supabase/
└── migrations/                # Migrations SQL
    ├── 20260123034850_create_event_assistant_attachments.sql
    ├── 20260124_cleanup_asaas.sql
    ├── 20260124_hardening_asaas.sql
    └── 20260127140000_add_is_published_to_events.sql

scripts/                       # Scripts utilitários
└── migrate-asaas-keys.ts      # Script de migração de chaves
```

---

## 🔄 Server Actions Principais

### Autenticação (`auth.ts`)
- `registerAction`: Cadastro de atleta com criação de athlete_profile
- `loginAction`: Login com suporte a returnEvent e next
- `logoutAction`: Logout seguro
- `requestPasswordResetAction`: Solicitar reset de senha
- `resetPasswordAction`: Confirmar reset de senha
- `checkCpfAvailableAction`: Validação de CPF disponível
- `checkEmailAvailableAction`: Validação de email disponível

### Eventos (`events.ts`)
- `createEventAction`: Criação com upload de poster
- `updateEventAction`: Atualização completa
- `deleteEventAction`: Remoção com cascade
- `saveEventImage`: Helper para Storage

### Categorias (`categories.ts`)
- CRUD completo de categorias
- Validações de peso e faixa

### Inscrições (`registrations.ts`)
- `createRegistrationAction`: Snapshot de preço + criação de pagamento Asaas
- Gestão de status

### Pagamentos Asaas (`asaas-payments.ts`)
- `createPixPaymentAction`: Geração de PIX
- `getPaymentStatusAction`: Consulta de status
- Integração com webhook processor

### Chaveamento (`bracket-management.ts`)
- `generateBracketAction`: Geração automática com BYE
- `lockBracketAction`: Travamento de chaves
- `updateMatchResultAction`: Atualizar resultado

### Assistente IA (`event-assistant.ts`)
- `processEventAssistantQuestion`: Orquestração de perguntas
- Integração com OpenAI
- Cache de respostas

### Dashboard (`dashboard.ts`)
- `getOrganizerDashboardData`: Métricas do organizador
- `getChartData`: Dados para gráficos Recharts

---

## 🎨 Design System

### Tema
- **Cor Primária**: Roxo Moderno (Purple Theme)
- **Tipografia**: Inter (via @fontsource/inter)
- **Radius**: Padrão 8-12px (Classic SaaS)
- **Animações**: Framer Motion para transições

### Componentes Base
- **Radix UI**: Primitivos acessíveis
- **Tailwind CSS 4**: Utilitários e customização
- **Lucide React**: Ícones consistentes
- **Sonner**: Toast notifications

### Padrões Visuais
- **Botões**: Gradientes sutil, estados hover/active
- **Cards**: Sombras suaves, bordas arredondadas
- **Badges**: Semânticos por status (pending, paid, cancelled)
- **Forms**: Labels claros, validação inline
- **Dashboards**: Layout em grid, KPI cards, gráficos

---

## 🧪 Status das Features

| Feature | Status |
|---------|--------|
| Inscrição Atleta | ✅ Completo |
| Pagamento PIX (Webhook) | ✅ Completo |
| Chaveamento Dinâmico | ✅ Completo |
| Assistente de IA | ✅ Completo |
| Dashboard Organizador | ✅ Completo |
| Dashboard Super Admin | ✅ Completo |
| Gráficos Recharts | ✅ Completo |
| Google Maps Integration | ✅ Completo |
| Criptografia de Chaves | ✅ Completo |
| Normalização (Belts/Age Groups) | ✅ Completo |
| Upload de Arquivos | ✅ Completo |
| Sistema de Interesses | ✅ Completo |
| Relatórios Financeiros | 🔜 Planejado |
| Exportação de Chaves PDF | 🔜 Planejado |
| Notificações Email | 🔜 Planejado |

---

## 🚀 Funcionalidades Implementadas Detalhadas

### ✅ Autenticação & Perfis
- [x] Login/Signup com Supabase Auth
- [x] Roles: Atleta, Organizador e Super Admin
- [x] Cadastro público restrito ao papel de Atleta
- [x] Gestão de perfil com CPF obrigatório para atletas
- [x] Perfis estendidos de atletas (phone, birth_date, weight, gender)
- [x] Sistema de recuperação de senha
- [x] Validação de CPF e Email em tempo real

### ✅ Organizador - Gestão de Eventos
- [x] Dashboard com métricas financeiras e de inscritos
- [x] Gráficos de evolução (Recharts) - dia/semana/mês
- [x] CRUD de Eventos com upload de posters (Storage)
- [x] Seleção de endereço com Google Maps
- [x] Assistente de Eventos IA (OpenAI)
- [x] Upload de anexos para assistente
- [x] Perguntas e respostas customizadas
- [x] Gestão de Categorias com faixas e pesos
- [x] Normalização de faixas e faixas etárias
- [x] Chaveamento automático (Eliminatória Simples) com BYE
- [x] LOCK de chaves e controle de revelação
- [x] Controles de publicação (is_published, info_published)

### ✅ Pagamentos & Integrações
- [x] Configuração de chaves Asaas criptografadas
- [x] Seleção de ambiente (sandbox/production)
- [x] Geração automática de PIX (QR Code + Copia e Cola)
- [x] Webhook Asaas para confirmação em tempo real
- [x] Processamento idempotente de webhooks
- [x] Página de confirmação "OSS!" com animações premium
- [x] Monitoramento de status em tempo real

### ✅ Atleta - Inscrições
- [x] Busca e visualização de eventos públicos
- [x] Fluxo de inscrição com seleção de categoria
- [x] Geração de PIX instantânea
- [x] Histórico de inscrições por status
- [x] Monitoramento de status via polling
- [x] Sistema de interesses em eventos (pre-signup)

### ✅ Super Admin
- [x] Dashboard consolidado do sistema
- [x] Gestão de organizadores (CRUD)
- [x] Gestão de faixas (belts)
- [x] Gestão de faixas etárias (age groups)
- [x] Base de conhecimento global
- [x] Configuração de integrações (OpenAI)
- [x] Configuração de imagens de login

---

## 🔧 Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://hmcvkdfnxxqobgfgiyhi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# Asaas
ASAAS_WEBHOOK_SECRET=asaas_webhook_lutas_2026

# Criptografia
APP_ENCRYPTION_KEY_BASE64=<base64_key>  # Para system_integrations
ASAAS_KEYS_MASTER_KEY=<base64_key>     # Para organizer_asaas_credentials

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_KEY=<google_maps_api_key>

# Site (opcional, auto-detectado)
NEXT_PUBLIC_SITE_URL=https://competir.app.br
```

---

## 📊 Integrações Externas

### Supabase
- **Auth**: Autenticação e sessões
- **Database**: PostgreSQL 17.6.1
- **Storage**: Buckets para posters e anexos
- **Realtime**: Atualizações em tempo real (futuro)

### Asaas
- **API**: Geração de cobranças PIX
- **Webhook**: Confirmação automática de pagamentos
- **Ambientes**: Sandbox e Production

### OpenAI
- **Model**: GPT-4 (configurável)
- **Uso**: Assistente de eventos
- **Context**: Base de conhecimento + anexos

### Google Maps
- **API**: Places API
- **Uso**: Seleção de endereço com autocomplete
- **Componente**: `AddressPicker.tsx`

---

## 📈 Roadmap

### 🔜 Próximas Features
- [ ] Relatórios financeiros detalhados
- [ ] Exportação de chaves em PDF
- [ ] Notificações por email (confirmação, lembrete)
- [ ] Supabase Realtime para updates ao vivo
- [ ] Sistema de check-in de atletas
- [ ] Geração de certificados
- [ ] Histórico de lutas por atleta
- [ ] Ranking de atletas

### 🎯 Melhorias Planejadas
- [ ] Cache de queries com React Query
- [ ] Otimização de imagens (Next.js Image)
- [ ] PWA (Progressive Web App)
- [ ] Testes automatizados (Playwright)
- [ ] CI/CD completo
- [ ] Monitoramento de erros (Sentry)

---

**Versão**: 3.0.0  
**Última Atualização**: 29/01/2026  
**Desenvolvido com**: Next.js 16.1.1 + Supabase + TypeScript  
**Documentado por**: Antigravity AI  

---

## 📝 Notas Técnicas

### Sistema de Normalização Híbrido
O sistema usa abordagem híbrida para categorias:
- **Denormalizado**: Campos `belt` e `age_group` em `categories` (texto)
- **Normalizado**: Campos `belt_id` e `age_group_id` (FK para tabelas de referência)

**Benefícios**:
- Performance em queries (sem JOINs)
- Integridade referencial (tabelas normalizadas)
- Padronização controlada (super admin)

### Criptografia de Chaves API
Duas implementações independentes:
1. **Organizadores** (`organizer_asaas_credentials`):
   - Master key: `ASAAS_KEYS_MASTER_KEY`
   - Algoritmo: AES-256-GCM
   - Módulo: `lib/crypto.ts`

2. **Super Admin** (`system_integrations`):
   - Master key: `APP_ENCRYPTION_KEY_BASE64`
   - Algoritmo: AES-256-GCM
   - Módulo: `lib/crypto/encryption.ts`

### Multi-Tenancy
Isolamento completo via:
- **RLS Policies** em todas as tabelas
- **Service Role** apenas para operações admin específicas
- **Server Actions** validam ownership antes de operações

### Migrations Aplicadas
- `20260123034850`: Criação de `event_assistant_attachments`
- `20260124_cleanup_asaas`: Limpeza de chaves em texto plano
- `20260124_hardening_asaas`: Hardening de criptografia Asaas
- `20260127140000`: Adição do campo `is_published` em events
