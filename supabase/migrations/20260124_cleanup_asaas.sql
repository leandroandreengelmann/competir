-- PASSO FINAL DO HARDENING P0
-- SÓ EXECUTE APÓS VALIDAR QUE A MIGRAÇÃO FOI CONCLUÍDA

-- 1. Limpar os dados em texto puro para reduzir superfície de ataque
UPDATE public.organizer_asaas_credentials 
SET asaas_api_key = NULL 
WHERE asaas_api_key_encrypted IS NOT NULL;

-- 2. (Opcional) No futuro, você pode remover a coluna completamente
-- ALTER TABLE public.organizer_asaas_credentials DROP COLUMN asaas_api_key;
