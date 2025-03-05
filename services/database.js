const supabase = require('../config/supabase');

class DatabaseService {
    constructor() {
        console.log('Initialisation du service de base de données');
    }

    // Gestion des tables de poker
    async createTable(playerId, playerName) {
        console.log('Création d\'une nouvelle table:', { playerId, playerName });
        try {
            const { data, error } = await supabase
                .from('tables')
                .insert([
                    {
                        created_by: playerId,
                        created_by_name: playerName,
                        pot: 0,
                        current_bet: 0,
                        phase: 'WAITING',
                        community_cards: []
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
                .from('tables')
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
                .from('tables')
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
    async addPlayerToTable(tableId, playerId, playerName, position) {
        console.log('Ajout d\'un joueur à la table:', { tableId, playerId, playerName, position });
        try {
            const { data, error } = await supabase
                .from('players')
                .insert([
                    {
                        table_id: tableId,
                        player_id: playerId,
                        player_name: playerName,
                        position: position,
                        chips: 1000,
                        folded: false,
                        current_bet: 0
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
                .from('players')
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
                .from('players')
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
}

module.exports = new DatabaseService(); 