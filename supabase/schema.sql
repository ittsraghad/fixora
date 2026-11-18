
create table profiles(id uuid primary key references auth.users on delete cascade,
  full_name text, phone text, role text not null default 'resident' check(role in('resident','admin','technician')),
  specialty text, active boolean default true, created_at timestamptz default now());
create table maintenance_categories(id serial primary key, name text unique not null);
insert into maintenance_categories(name) values('Plumbing'),('Electrical'),('AC'),('Carpentry'),('General');
create sequence req_seq start 100;
create table maintenance_requests(id uuid primary key default gen_random_uuid(),
  request_number text unique default ('FX-'||extract(year from now())||'-'||lpad(nextval('req_seq')::text,5,'0')),
  user_id uuid not null references profiles(id) default auth.uid(),
  category_id int references maintenance_categories(id), title text not null, description text,
  building text, unit text, location_details text,
  priority text default 'Medium' check(priority in('Low','Medium','High','Urgent')),
  status text default 'Submitted' check(status in('Submitted','Under Review','Assigned','In Progress','Waiting for Parts','Resolved','Closed')),
  technician_id uuid references profiles(id), created_at timestamptz default now(), updated_at timestamptz default now());
create table request_attachments(id uuid primary key default gen_random_uuid(),
  request_id uuid references maintenance_requests on delete cascade, url text not null, kind text default 'problem');
create table request_updates(id uuid primary key default gen_random_uuid(),
  request_id uuid references maintenance_requests on delete cascade, actor_id uuid default auth.uid(),
  message text not null, created_at timestamptz default now());

create function is_role(r text) returns boolean language sql security definer stable as
$$ select exists(select 1 from profiles where id=auth.uid() and role=r and active) $$;
create function handle_new_user() returns trigger language plpgsql security definer as $$
begin insert into profiles(id,full_name,phone) values(new.id,new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'phone'); return new; end $$;
create trigger on_signup after insert on auth.users for each row execute function handle_new_user();

alter table profiles enable row level security;
alter table maintenance_categories enable row level security;
alter table maintenance_requests enable row level security;
alter table request_attachments enable row level security;
alter table request_updates enable row level security;

create policy "cat read" on maintenance_categories for select using(true);
create policy "profiles read" on profiles for select using(auth.uid()=id or is_role('admin') or is_role('technician')
  or id in(select technician_id from maintenance_requests where user_id=auth.uid()));
create policy "profile update own" on profiles for update using(auth.uid()=id)
  with check(role=(select role from profiles where id=auth.uid()));
create policy "profiles admin all" on profiles for all using(is_role('admin'));
create policy "req read" on maintenance_requests for select using(user_id=auth.uid() or technician_id=auth.uid() or is_role('admin'));
create policy "req insert" on maintenance_requests for insert with check(user_id=auth.uid());
create policy "req admin update" on maintenance_requests for update using(is_role('admin'));
create policy "req tech update" on maintenance_requests for update using(technician_id=auth.uid());
create policy "req resident close" on maintenance_requests for update using(user_id=auth.uid());
create policy "att read" on request_attachments for select using(exists(select 1 from maintenance_requests r where r.id=request_id));
create policy "att insert" on request_attachments for insert with check(exists(select 1 from maintenance_requests r where r.id=request_id));
create policy "upd read" on request_updates for select using(exists(select 1 from maintenance_requests r where r.id=request_id));
create policy "upd insert" on request_updates for insert with check(exists(select 1 from maintenance_requests r where r.id=request_id));
insert into storage.buckets(id,name,public) values('request-images','request-images',true);
create policy "img upload" on storage.objects for insert to authenticated with check(bucket_id='request-images');
create policy "img read" on storage.objects for select using(bucket_id='request-images');
