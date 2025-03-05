-- Vérification des tables
SELECT table_name, column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('poker_tables', 'table_players', 'game_history', 'player_stats')
ORDER BY table_name, ordinal_position;

-- Vérification des index
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('poker_tables', 'table_players', 'game_history', 'player_stats')
ORDER BY tablename, indexname;

-- Vérification des triggers
SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('poker_tables', 'table_players', 'player_stats')
ORDER BY event_object_table, trigger_name;

-- Vérification des contraintes
SELECT
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('poker_tables', 'table_players', 'game_history', 'player_stats')
ORDER BY tc.table_name, tc.constraint_name;

-- Vérification des données existantes
SELECT 'poker_tables' as table_name, COUNT(*) as count FROM poker_tables
UNION ALL
SELECT 'table_players', COUNT(*) FROM table_players
UNION ALL
SELECT 'game_history', COUNT(*) FROM game_history
UNION ALL
SELECT 'player_stats', COUNT(*) FROM player_stats; 