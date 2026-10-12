-- "Otra institución" (ADR-040): the documents the institution asks for in each cuenta de cobro, chosen by
-- the contractor, and the model uploaded for each document Pascal generates (code → supports.id).
-- {"required": [{"code": "PILA", "label": "Planilla …"}, {"code": null, "label": "paz y salvo"}],
--  "models": {"INFORME_ACTIVIDADES": "<uuid>", "CUENTA_COBRO": "<uuid>"}}
alter table institution_requests add column documents jsonb;
