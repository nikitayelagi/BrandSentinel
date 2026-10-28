create extension if not exists vector;
create table orgs(id uuid primary key default gen_random_uuid(), name text not null);
create table profiles(user_id uuid primary key references auth.users, org_id uuid references orgs, role text check (role in ('Creator','Reviewer','Manager')));
create table kb_items(id uuid primary key default gen_random_uuid(), org_id uuid not null references orgs, code text not null,
 type text check (type in ('term','claim','fact')), title text, pattern text, preferred text, approved boolean default true,
 alt text, ref text, expiry date, status text default 'active', content text, embedding vector(1536));
create table drafts(id uuid primary key default gen_random_uuid(), org_id uuid not null references orgs, text text, intent text,
 version int default 1, status text default 'Findings ready', created_at timestamptz default now());
create table findings(id uuid primary key default gen_random_uuid(), draft_id uuid references drafts on delete cascade, org_id uuid not null,
 span text, kind text, reason text, source_code text, evidence text, suggestion text, route boolean, resolution text default 'open', origin text);
create table audit_log(id bigserial primary key, org_id uuid not null, draft_id uuid, role text, action text, detail text, at timestamptz default now());
do $$ declare t text; begin foreach t in array array['kb_items','drafts','findings','audit_log'] loop
 execute format('alter table %I enable row level security', t);
 execute format($p$create policy org_iso on %I using (org_id=(select org_id from profiles where user_id=auth.uid()))$p$, t); end loop; end $$;
insert into orgs values ('00000000-0000-0000-0000-000000000001','GlowCo (demo)');
insert into kb_items(org_id,code,type,title,pattern,preferred,approved,alt,ref,expiry) values
('00000000-0000-0000-0000-000000000001','T-09','term','Avoid cheap; say affordable','(super )?cheap','affordable',true,null,null,null),
('00000000-0000-0000-0000-000000000001','F-07','claim','Approved: dermatologist-tested','dermatologist[- ]tested',null,true,null,null,null),
('00000000-0000-0000-0000-000000000001','C-03','claim','Clinically proven not approved','clinically proven',null,false,'dermatologist-tested','F-07',null),
('00000000-0000-0000-0000-000000000001','F-21','fact','Offer: 50% off','50% off',null,true,null,null,'2026-09-30'),
('00000000-0000-0000-0000-000000000001','F-22','fact','Offer: free shipping','free shipping',null,true,null,null,'2027-03-31');
