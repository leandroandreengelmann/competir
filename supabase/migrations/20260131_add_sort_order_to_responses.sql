-- Adicionar coluna sort_order para permitir reordenação manual dos cards de informações
ALTER TABLE event_assistant_responses 
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Criar índice para otimizar ordenação
CREATE INDEX idx_event_responses_sort 
ON event_assistant_responses(event_id, sort_order);

-- Comentário explicativo
COMMENT ON COLUMN event_assistant_responses.sort_order IS 'Ordem de exibição dos cards (definida manualmente pelo organizador)';
