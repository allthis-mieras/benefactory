-- Creates core tables for tracking donor income and charitable contributions.
create extension if not exists "pgcrypto";
create table if not exists public.households (
    id uuid primary key default gen_random_uuid(),
    alias text,
    annual_income numeric(14,2) default 0 check (annual_income >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.donations (
    id uuid primary key default gen_random_uuid(),
    household_id uuid references public.households(id) on delete cascade,
    charity_name text not null,
    amount numeric(14,2) not null check (amount >= 0),
    frequency text not null check (frequency in ('monthly','quarterly','yearly')),
    annual_amount numeric(14,2) generated always as (
        case frequency
            when 'monthly' then amount * 12
            when 'quarterly' then amount * 4
            else amount
        end
    ) stored,
    created_at timestamptz not null default now()
);

create index if not exists donations_household_id_idx on public.donations (household_id);

create function public.touch_household() returns trigger as $$
begin
    update public.households set updated_at = now() where id = new.household_id;
    return new;
end;
$$ language plpgsql;

drop trigger if exists donations_touch_household on public.donations;
create trigger donations_touch_household
after insert or update or delete on public.donations
for each row execute function public.touch_household();
