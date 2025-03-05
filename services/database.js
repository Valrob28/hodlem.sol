const supabase = require('../config/supabase');

class DatabaseService {
    constructor() {
        console.log('Initialisation du service de base de données');
    }

    // Gestion des tables de poker
    async createTable(playerId, playerName, tableName, buyIn = 1000) {
        console.log('Création d\'une nouvelle table:', { playerId, playerName, tableName, buyIn });
        try {
            const { data, error } = await supabase
                .from('poker_tables')
                .insert([
                    {
                        host_id: playerId,
                        host_name: playerName,
                        name: tableName,
                        status: 'waiting',
                        pot: 0,
                        current_bet: 0,
                        phase: 'WAITING',
                        community_cards: [],
                        min_buy_in: 1000,
                        max_buy_in: 10000,
                        small_blind: 10,
                        big_blind: 20
                    }
                ])
                .select()
                .single();

            if (error) {
                console.error('Erreur lors de la création de la table:', error);
                throw error;
            }

            console.log('Table créée avec succès:', data);
            return data;
        } catch (error) {
            console.error('Erreur dans createTable:', error);
            throw error;
        }
    }

    async getTable(tableId) {
        console.log('Récupération de la table:', tableId);
        try {
            const { data, error } = await supabase
                .from('poker_tables')
                .select('*')
                .eq('id', tableId)
                .single();

            if (error) {
                console.error('Erreur lors de la récupération de la table:', error);
                throw error;
            }

            console.log('Table récupérée:', data);
            return data;
        } catch (error) {
            console.error('Erreur dans getTable:', error);
            throw error;
        }
    }

    async updateTableState(tableId, state) {
        console.log('Mise à jour de l\'état de la table:', { tableId, state });
        try {
            const { data, error } = await supabase
                .from('poker_tables')
                .update(state)
                .eq('id', tableId)
                .select()
                .single();

            if (error) {
                console.error('Erreur lors de la mise à jour de la table:', error);
                throw error;
            }

            console.log('État de la table mis à jour:', data);
            return data;
        } catch (error) {
            console.error('Erreur dans updateTableState:', error);
            throw error;
        }
    }

    // Gestion des joueurs
    async addPlayerToTable(tableId, playerId, playerName, position, buyIn = 1000) {
        console.log('Ajout d\'un joueur à la table:', { tableId, playerId, playerName, position, buyIn });
        try {
            const { data, error } = await supabase
                .from('table_players')
                .insert([
                    {
                        table_id: tableId,
                        player_id: playerId,
                        player_name: playerName,
                        position: position,
                        chips: buyIn,
                        folded: false,
                        current_bet: 0,
                        cards: [],
                        is_host: position === 0
                    }
                ])
                .select()
                .single();

            if (error) {
                console.error('Erreur lors de l\'ajout du joueur:', error);
                throw error;
            }

            console.log('Joueur ajouté avec succès:', data);
            return data;
        } catch (error) {
            console.error('Erreur dans addPlayerToTable:', error);
            throw error;
        }
    }

    async updatePlayerState(tableId, playerId, state) {
        console.log('Mise à jour de l\'état du joueur:', { tableId, playerId, state });
        try {
            const { data, error } = await supabase
                .from('table_players')
                .update(state)
                .eq('table_id', tableId)
                .eq('player_id', playerId)
                .select()
                .single();

            if (error) {
                console.error('Erreur lors de la mise à jour du joueur:', error);
                throw error;
            }

            console.log('État du joueur mis à jour:', data);
            return data;
        } catch (error) {
            console.error('Erreur dans updatePlayerState:', error);
            throw error;
        }
    }

    async getTablePlayers(tableId) {
        console.log('Récupération des joueurs de la table:', tableId);
        try {
            const { data, error } = await supabase
                .from('table_players')
                .select('*')
                .eq('table_id', tableId);

            if (error) {
                console.error('Erreur lors de la récupération des joueurs:', error);
                throw error;
            }

            console.log('Joueurs récupérés:', data);
            return data;
        } catch (error) {
            console.error('Erreur dans getTablePlayers:', error);
            throw error;
        }
    }

    // Gestion des parties
    async createGameHistory(tableId, winnerId, pot) {
        const { data, error } = await supabase
            .from('game_history')
            .insert([
                {
                    table_id: tableId,
                    winner_id: winnerId,
                    pot: pot,
                    ended_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Gestion des statistiques
    async updatePlayerStats(playerId, won, amount) {
        const { data, error } = await supabase
            .from('player_stats')
            .upsert([
                {
                    player_id: playerId,
                    games_played: 1,
                    games_won: won ? 1 : 0,
                    total_winnings: won ? amount : 0,
                    updated_at: new Date().toISOString()
                }
            ], {
                onConflict: 'player_id'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updatePlayerCards(tableId, playerId, cards) {
        console.log('Mise à jour des cartes du joueur:', { tableId, playerId, cards });
        try {
            const { data, error } = await supabase
                .from('table_players')
                .update({ cards })
                .eq('table_id', tableId)
                .eq('player_id', playerId)
                .select()
                .single();

            if (error) {
                console.error('Erreur lors de la mise à jour des cartes:', error);
                throw error;
            }

            console.log('Cartes mises à jour avec succès:', data);
            return data;
        } catch (error) {
            console.error('Erreur dans updatePlayerCards:', error);
            throw error;
        }
    }

    async getAvailableTables() {
        console.log('Récupération des tables disponibles');
        try {
            const { data, error } = await supabase
                .from('poker_tables')
                .select(`
                    id,
                    name,
                    host_name,
                    status,
                    min_buy_in,
                    max_buy_in,
                    small_blind,
                    big_blind,
                    players:table_players(count)
                `)
                .eq('status', 'waiting')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Erreur lors de la récupération des tables:', error);
                throw error;
            }

            console.log('Tables disponibles récupérées:', data);
            return data.map(table => ({
                ...table,
                player_count: table.players[0].count
            }));
        } catch (error) {
            console.error('Erreur dans getAvailableTables:', error);
            throw error;
        }
    }
}

module.exports = new DatabaseService(); 