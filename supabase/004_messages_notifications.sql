
alter table profiles add column if not exists email text;
update profiles p set email=u.email from auth.users u where u.id=p.id;
create or replace function handle_new_user() returns trigger language plpgsql security definer as $$
begin insert into profiles(id,full_name,phone,email) values(new.id,new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'phone',new.email); return new; end $$;

create table messages(id uuid primary key default gen_random_uuid(), request_id uuid references maintenance_requests on delete cascade,
  sender_id uuid default auth.uid() references profiles(id), body text not null, created_at timestamptz default now());
create table notifications(id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id) on delete cascade,
  request_id uuid references maintenance_requests on delete cascade, message text not null, read boolean default false, created_at timestamptz default now());
alter table messages enable row level security; alter table notifications enable row level security;
create policy "msg read" on messages for select using(exists(select 1 from maintenance_requests r where r.id=request_id));
create policy "msg insert" on messages for insert with check(sender_id=auth.uid() and exists(select 1 from maintenance_requests r where r.id=request_id));
create policy "notif read" on notifications for select using(user_id=auth.uid());
create policy "notif update" on notifications for update using(user_id=auth.uid());

create function notify_new_request() returns trigger language plpgsql security definer as $$
begin insert into notifications(user_id,request_id,message) select id,new.id,'New request '||new.request_number||': '||new.title from profiles where role='admin'; return new; end $$;
create trigger t_new_req after insert on maintenance_requests for each row execute function notify_new_request();

create function notify_change() returns trigger language plpgsql security definer as $$
begin
  if new.status is distinct from old.status then
    insert into notifications(user_id,request_id,message) values(new.user_id,new.id,new.request_number||' is now '||new.status);
  end if;
  if new.technician_id is distinct from old.technician_id and new.technician_id is not null then
    insert into notifications(user_id,request_id,message) values(new.technician_id,new.id,'New task assigned: '||new.request_number);
    insert into notifications(user_id,request_id,message) values(new.user_id,new.id,'A technician was assigned to '||new.request_number);
  end if; return new; end $$;
create trigger t_change after update on maintenance_requests for each row execute function notify_change();

alter publication supabase_realtime add table notifications, messages;
