-- =====================================================
-- COMPREHENSIVE DATABASE SCHEMA AUDIT - SINGLE QUERY
-- Run this in Supabase SQL Editor to get complete schema info
-- Returns all schema information in ONE unified table
-- =====================================================

WITH

-- 1. Tables and Columns
tables_cols AS (
  SELECT
    '1_TABLE' as section,
    table_name as object_name,
    column_name as detail_1,
    data_type as detail_2,
    is_nullable as detail_3,
    column_default as detail_4,
    character_maximum_length::text as detail_5,
    ordinal_position as sort_order
  FROM information_schema.columns
  WHERE table_schema = 'public'
),

-- 2. Primary Keys
primary_keys AS (
  SELECT
    '2_PRIMARY_KEY' as section,
    tc.table_name as object_name,
    kcu.column_name as detail_1,
    tc.constraint_name as detail_2,
    NULL::text as detail_3,
    NULL::text as detail_4,
    NULL::text as detail_5,
    kcu.ordinal_position as sort_order
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
),

-- 3. Foreign Keys
foreign_keys AS (
  SELECT
    '3_FOREIGN_KEY' as section,
    tc.table_name as object_name,
    kcu.column_name || ' -> ' || ccu.table_name || '.' || ccu.column_name as detail_1,
    tc.constraint_name as detail_2,
    rc.update_rule as detail_3,
    rc.delete_rule as detail_4,
    NULL::text as detail_5,
    kcu.ordinal_position as sort_order
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
  JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
),

-- 4. Unique Constraints
unique_constraints AS (
  SELECT
    '4_UNIQUE' as section,
    tc.table_name as object_name,
    kcu.column_name as detail_1,
    tc.constraint_name as detail_2,
    NULL::text as detail_3,
    NULL::text as detail_4,
    NULL::text as detail_5,
    kcu.ordinal_position as sort_order
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'public'
),

-- 5. Check Constraints
check_constraints AS (
  SELECT
    '5_CHECK' as section,
    tc.table_name as object_name,
    tc.constraint_name as detail_1,
    cc.check_clause as detail_2,
    NULL::text as detail_3,
    NULL::text as detail_4,
    NULL::text as detail_5,
    1 as sort_order
  FROM information_schema.table_constraints tc
  JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
  WHERE tc.constraint_type = 'CHECK'
    AND tc.table_schema = 'public'
),

-- 6. Indexes
indexes AS (
  SELECT
    '6_INDEX' as section,
    tablename as object_name,
    indexname as detail_1,
    indexdef as detail_2,
    NULL::text as detail_3,
    NULL::text as detail_4,
    NULL::text as detail_5,
    1 as sort_order
  FROM pg_indexes
  WHERE schemaname = 'public'
),

-- 7. RLS Policies
rls_policies AS (
  SELECT
    '7_RLS_POLICY' as section,
    tablename as object_name,
    policyname as detail_1,
    CASE WHEN permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as detail_2,
    cmd as detail_3,
    array_to_string(roles, ', ') as detail_4,
    COALESCE(qual, 'true') as detail_5,
    1 as sort_order
  FROM pg_policies
  WHERE schemaname = 'public'
),

-- 8. Custom Enums
custom_enums AS (
  SELECT
    '8_ENUM' as section,
    t.typname as object_name,
    e.enumlabel as detail_1,
    e.enumsortorder::text as detail_2,
    NULL::text as detail_3,
    NULL::text as detail_4,
    NULL::text as detail_5,
    e.enumsortorder::integer as sort_order
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public'
),

-- 9. Functions
functions AS (
  SELECT
    '9_FUNCTION' as section,
    p.proname as object_name,
    pg_get_function_arguments(p.oid) as detail_1,
    pg_get_function_result(p.oid) as detail_2,
    CASE p.provolatile
      WHEN 'i' THEN 'IMMUTABLE'
      WHEN 's' THEN 'STABLE'
      WHEN 'v' THEN 'VOLATILE'
    END as detail_3,
    CASE p.prosecdef WHEN true THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as detail_4,
    substring(pg_get_functiondef(p.oid), 1, 200) as detail_5,
    1 as sort_order
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prokind = 'f'
),

-- 10. Triggers
triggers AS (
  SELECT
    '10_TRIGGER' as section,
    event_object_table as object_name,
    trigger_name as detail_1,
    event_manipulation as detail_2,
    action_timing as detail_3,
    substring(action_statement, 1, 100) as detail_4,
    NULL::text as detail_5,
    1 as sort_order
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
),

-- 11. Table Grants
table_grants AS (
  SELECT DISTINCT
    '11_GRANT' as section,
    table_name as object_name,
    grantee as detail_1,
    string_agg(DISTINCT privilege_type, ', ' ORDER BY privilege_type) as detail_2,
    CASE is_grantable WHEN 'YES' THEN 'WITH GRANT OPTION' ELSE 'NO GRANT OPTION' END as detail_3,
    NULL::text as detail_4,
    NULL::text as detail_5,
    1 as sort_order
  FROM information_schema.table_privileges
  WHERE table_schema = 'public'
  GROUP BY table_name, grantee, is_grantable
),

-- 12. Sequences
sequences AS (
  SELECT
    '12_SEQUENCE' as section,
    sequence_name as object_name,
    data_type as detail_1,
    start_value::text as detail_2,
    increment::text as detail_3,
    maximum_value::text as detail_4,
    cycle_option as detail_5,
    1 as sort_order
  FROM information_schema.sequences
  WHERE sequence_schema = 'public'
),

-- 13. Table Statistics
table_stats AS (
  SELECT
    '13_TABLE_STATS' as section,
    relname as object_name,
    n_live_tup::text as detail_1,
    n_dead_tup::text as detail_2,
    to_char(last_vacuum, 'YYYY-MM-DD HH24:MI:SS') as detail_3,
    to_char(last_analyze, 'YYYY-MM-DD HH24:MI:SS') as detail_4,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as detail_5,
    1 as sort_order
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
),

-- 14. Views
views AS (
  SELECT
    '14_VIEW' as section,
    table_name as object_name,
    view_definition as detail_1,
    is_updatable as detail_2,
    is_insertable_into as detail_3,
    NULL::text as detail_4,
    NULL::text as detail_5,
    1 as sort_order
  FROM information_schema.views
  WHERE table_schema = 'public'
),

-- 15. Extensions
extensions AS (
  SELECT
    '15_EXTENSION' as section,
    extname as object_name,
    extversion as detail_1,
    n.nspname as detail_2,
    e.extrelocatable::text as detail_3,
    NULL::text as detail_4,
    NULL::text as detail_5,
    1 as sort_order
  FROM pg_extension e
  JOIN pg_namespace n ON e.extnamespace = n.oid
),

-- 16. Table Row Security Status
rls_status AS (
  SELECT
    '16_RLS_STATUS' as section,
    schemaname || '.' || tablename as object_name,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as detail_1,
    NULL::text as detail_2,
    NULL::text as detail_3,
    NULL::text as detail_4,
    NULL::text as detail_5,
    1 as sort_order
  FROM pg_tables
  WHERE schemaname = 'public'
),

-- 17. Column Statistics
column_stats AS (
  SELECT
    '17_COLUMN_STATS' as section,
    tablename as object_name,
    attname as detail_1,
    n_distinct::text as detail_2,
    null_frac::text as detail_3,
    avg_width::text as detail_4,
    NULL::text as detail_5,
    1 as sort_order
  FROM pg_stats
  WHERE schemaname = 'public'
),

-- 18. Materialized Views
materialized_views AS (
  SELECT
    '18_MATERIALIZED_VIEW' as section,
    matviewname as object_name,
    definition as detail_1,
    CASE WHEN ispopulated THEN 'POPULATED' ELSE 'NOT POPULATED' END as detail_2,
    NULL::text as detail_3,
    NULL::text as detail_4,
    NULL::text as detail_5,
    1 as sort_order
  FROM pg_matviews
  WHERE schemaname = 'public'
),

-- Summary section
summary AS (
  SELECT
    '0_SUMMARY' as section,
    'Database Overview' as object_name,
    'Total Tables: ' || (SELECT COUNT(DISTINCT table_name) FROM information_schema.tables WHERE table_schema = 'public')::text as detail_1,
    'Total Columns: ' || (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public')::text as detail_2,
    'RLS Policies: ' || (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public')::text as detail_3,
    'Indexes: ' || (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public')::text as detail_4,
    'Functions: ' || (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prokind = 'f')::text ||
    ' | Triggers: ' || (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public')::text ||
    ' | Enums: ' || (SELECT COUNT(*) FROM pg_type t JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e')::text as detail_5,
    0 as sort_order
)

-- COMBINE ALL RESULTS
SELECT
  section,
  object_name,
  detail_1 as "Column/Name",
  detail_2 as "Type/Constraint",
  detail_3 as "Nullable/Action",
  detail_4 as "Default/Additional",
  detail_5 as "Info/Definition",
  sort_order
FROM summary
UNION ALL SELECT * FROM tables_cols
UNION ALL SELECT * FROM primary_keys
UNION ALL SELECT * FROM foreign_keys
UNION ALL SELECT * FROM unique_constraints
UNION ALL SELECT * FROM check_constraints
UNION ALL SELECT * FROM indexes
UNION ALL SELECT * FROM rls_policies
UNION ALL SELECT * FROM custom_enums
UNION ALL SELECT * FROM functions
UNION ALL SELECT * FROM triggers
UNION ALL SELECT * FROM table_grants
UNION ALL SELECT * FROM sequences
UNION ALL SELECT * FROM table_stats
UNION ALL SELECT * FROM views
UNION ALL SELECT * FROM extensions
UNION ALL SELECT * FROM rls_status
UNION ALL SELECT * FROM column_stats
UNION ALL SELECT * FROM materialized_views
ORDER BY section, object_name, sort_order;
