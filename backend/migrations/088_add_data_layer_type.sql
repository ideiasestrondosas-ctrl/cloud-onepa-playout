-- Migration: Adicionar 'data' como tipo de layer válido em graphics_layers
-- Versão: v2.6.0-ALPHA.53-PRO
-- Data: 2026-03-20

-- Remover o CHECK constraint existente que só permite clock, lower_third, marquee
ALTER TABLE graphics_layers
  DROP CONSTRAINT IF EXISTS graphics_layers_layer_type_check;

-- Adicionar novo CHECK constraint que inclui o tipo 'data'
ALTER TABLE graphics_layers
  ADD CONSTRAINT graphics_layers_layer_type_check
  CHECK (layer_type IN ('clock', 'lower_third', 'marquee', 'data'));
