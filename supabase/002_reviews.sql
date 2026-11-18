create table reviews(id uuid primary key default gen_random_uuid(),
  request_id uuid unique references maintenance_requests on delete cascade, user_id uuid default auth.uid(),
  rating int check(rating between 1 and 5), comment text, created_at timestamptz default now());
alter table reviews enable row level security;
create policy "rev read" on reviews for select using(exists(select 1 from maintenance_requests r where r.id=request_id));
create policy "rev insert" on reviews for insert with check(user_id=auth.uid() and exists(select 1 from maintenance_requests r where r.id=request_id and r.user_id=auth.uid() and r.status='Closed'));
