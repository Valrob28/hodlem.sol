-- Création de la table des tables de poker
CREATE TABLE IF NOT EXISTS public.poker_tables (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    min_buy_in INTEGER NOT NULL DEFAULT 1000,
    max_buy_in INTEGER NOT NULL DEFAULT 10000,
    small_blind INTEGER NOT NULL DEFAULT 10,
    big_blind INTEGER NOT NULL DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Création de la table des joueurs
CREATE TABLE IF NOT EXISTS public.table_players (
    id TEXT PRIMARY KEY,
    table_id TEXT REFERENCES public.poker_tables(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    chips INTEGER NOT NULL DEFAULT 1000,
    current_bet INTEGER NOT NULL DEFAULT 0,
    folded BOOLEAN NOT NULL DEFAULT false,
    cards JSONB,
    is_host BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Création de la table de l'historique des parties
CREATE TABLE IF NOT EXISTS public.game_history (
    id TEXT PRIMARY KEY,
    table_id TEXT REFERENCES public.poker_tables(id) ON DELETE CASCADE,
    winner_id TEXT REFERENCES public.table_players(id),
    pot INTEGER NOT NULL,
    community_cards JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Création de la table des statistiques des joueurs
CREATE TABLE IF NOT EXISTS public.player_stats (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    games_played INTEGER NOT NULL DEFAULT 0,
    games_won INTEGER NOT NULL DEFAULT 0,
    total_profit INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Création des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_poker_tables_name ON public.poker_tables(name);
CREATE INDEX IF NOT EXISTS idx_table_players_table_id ON public.table_players(table_id);
CREATE INDEX IF NOT EXISTS idx_game_history_table_id ON public.game_history(table_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON public.player_stats(player_id);

-- Création des triggers pour mettre à jour les timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_poker_tables_updated_at
    BEFORE UPDATE ON public.poker_tables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_table_players_updated_at
    BEFORE UPDATE ON public.table_players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at
    BEFORE UPDATE ON public.player_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Création de la table par défaut
INSERT INTO public.poker_tables (id, name, min_buy_in, max_buy_in, small_blind, big_blind)
VALUES ('default-table', 'Table par défaut', 1000, 10000, 10, 20)
ON CONFLICT (id) DO NOTHING; 