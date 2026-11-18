create or replace function guard_request_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or is_role('admin') then return new; end if;
  if new.user_id is distinct from old.user_id
     or new.technician_id is distinct from old.technician_id
     or new.priority is distinct from old.priority
     or new.title is distinct from old.title
     or new.category_id is distinct from old.category_id then
    raise exception 'Not allowed';
  end if;
  if new.status is distinct from old.status then
    if auth.uid() = old.user_id then
      if not (old.status = 'Resolved' and new.status = 'Closed') then raise exception 'Not allowed'; end if;
    elsif auth.uid() = old.technician_id then
      if new.status not in ('In Progress','Waiting for Parts','Resolved') then raise exception 'Not allowed'; end if;
    else
      raise exception 'Not allowed';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists t_guard on maintenance_requests;
create trigger t_guard before update on maintenance_requests
for each row execute function guard_request_update();

drop policy if exists "req insert" on maintenance_requests;
create policy "req insert" on maintenance_requests for insert
with check (user_id = auth.uid() and status = 'Submitted' and technician_id is null);