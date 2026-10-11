-- users.free_reports was replaced by free_report_grants (20261011000002); nothing reads it anymore.
alter table users drop column free_reports;
