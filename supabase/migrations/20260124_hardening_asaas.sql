ALTER TABLE public.organizer_asaas_credentials 
ADD COLUMN IF NOT EXISTS asaas_api_key_encrypted text,
ADD COLUMN IF NOT EXISTS asaas_api_key_last4 text;

-- Permitir que a chave legada seja nula (necessário para o novo fluxo)
ALTER TABLE public.organizer_asaas_credentials 
ALTER COLUMN asaas_api_key DROP NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.organizer_asaas_credentials.asaas_api_key_encrypted IS 'Chave de API do Asaas criptografada (AES-256-GCM)';
COMMENT ON COLUMN public.organizer_asaas_credentials.asaas_api_key_last4 IS 'Últimos 4 dígitos da chave Asaas para exibição segura na UI';
