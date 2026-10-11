-- One activity can support several obligations (owner, 2026-10-11): the main one stays in
-- confirmed_obligation_id and the others go here. Evidences keep pointing to the note.
alter table activity_notes add column extra_obligation_ids uuid[] not null default '{}';
