-- Enable vector extension for internal link graph & semantic search
create extension if not exists vector;

-- 1. AEO 2.0: Citability DNA
-- Stores the analysis of "Winning Patterns" from perplexity/chatgpt
create table public.aeo_patterns (
    id uuid default gen_random_uuid() primary key,
    niche text not null,
    query_intent text not null,
    avg_paragraph_length int,
    avg_reading_grade float,
    entity_density float,
    preferred_schema_types text[], -- e.g. ["FAQPage", "Article"]
    structure_dna jsonb, -- detailed structure template
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_aeo_patterns_niche on public.aeo_patterns(niche);

-- 2. Agent Tasks & State Machine (The Critic)
-- Persistent storage for agent orchestration and adversarial loop
create type agent_status as enum ('queued', 'processing', 'critique_required', 'revising', 'completed', 'failed');

create table public.agent_tasks (
    task_id uuid default gen_random_uuid() primary key,
    agent_type text not null,
    input_payload jsonb not null,
    status agent_status default 'queued',
    
    -- State Machine Tracking
    current_step text,
    critic_score float, -- 0-100 score from Critic Agent
    critic_feedback text, -- Specific instructions for revision
    iteration_count int default 0, -- To prevent infinite loops
    
    result jsonb,
    logs text[],
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Knowledge Graph (Persistent Entity Graph)
-- Stores verified facts to enrich prompts
create table public.knowledge_entities (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    type text, -- e.g. "Software", "Person", "Concept"
    facts jsonb, -- e.g. {"release_date": "2024", "author": "..."}
    trust_score float default 1.0,
    embedding vector(1536), -- For semantic retrieval
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Edge SEO Injection
-- Live overrides served to Cloudflare Workers
create table public.edge_overrides (
    id uuid default gen_random_uuid() primary key,
    url_hash text not null unique, -- md5 of normalized URL for fast lookup
    target_url text not null,
    
    -- Injections
    title_override text,
    meta_description_override text,
    schema_json_override jsonb,
    html_injects jsonb, -- e.g. {"head": "...", "body_start": "..."}
    
    is_active boolean default true,
    triggered_count int default 0,
    last_triggered_at timestamp with time zone,
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_edge_url_hash on public.edge_overrides(url_hash);

-- 5. Closed-Loop Audit History
-- Tracks site health for self-correction
create table public.site_audits (
    id uuid default gen_random_uuid() primary key,
    domain text not null,
    audit_data jsonb,
    health_score float,
    issues_found int,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) - Basic setup
alter table public.aeo_patterns enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.knowledge_entities enable row level security;
alter table public.edge_overrides enable row level security;

create policy "Public Read Access" on public.edge_overrides for select using (true);
-- In production, these should be restricted to authenticated users
