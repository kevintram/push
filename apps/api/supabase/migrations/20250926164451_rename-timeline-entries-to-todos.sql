alter table timeline_entries
rename to todos;

alter table todos
rename constraint timeline_entries_pkey to todos_pkey;

alter trigger update_timeline_entries_updated_at on todos rename to update_todos_updated_at;

alter view timeline_entries_today
rename to todos_today;

alter view timeline_entries_with_effective_date
rename to todos_with_effective_date;