-- Vérification du contenu de poker_tables
SELECT id, name, status, pot, current_bet, phase, min_buy_in, max_buy_in, small_blind, big_blind
FROM poker_tables
ORDER BY created_at DESC;

-- Vérification du contenu de table_players
SELECT id, table_id, player_name, position, chips, folded, current_bet, is_host
FROM table_players
ORDER BY joined_at DESC;

-- Vérification du contenu de game_history
SELECT id, table_id, winner_id, pot, ended_at
FROM game_history
ORDER BY ended_at DESC;

-- Vérification du contenu de player_stats
SELECT player_id, games_played, games_won, total_winnings
FROM player_stats
ORDER BY updated_at DESC; 