export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      campaign_progress: {
        Row: {
          active_chapter_id: string | null
          chapters: Json | null
          cracked_nodes: Json | null
          created_at: string
          current_debt: number | null
          initial_debt: number | null
          paid_debt: number | null
          tutorials: Json | null
          unlocks: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_chapter_id?: string | null
          chapters?: Json | null
          cracked_nodes?: Json | null
          created_at?: string
          current_debt?: number | null
          initial_debt?: number | null
          paid_debt?: number | null
          tutorials?: Json | null
          unlocks?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_chapter_id?: string | null
          chapters?: Json | null
          cracked_nodes?: Json | null
          created_at?: string
          current_debt?: number | null
          initial_debt?: number | null
          paid_debt?: number | null
          tutorials?: Json | null
          unlocks?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coop_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          player_alpha_id: string
          player_bravo_id: string | null
          score: number | null
          stage: number
          status: string
          telemetry: Json | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          player_alpha_id: string
          player_bravo_id?: string | null
          score?: number | null
          stage?: number
          status?: string
          telemetry?: Json | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          player_alpha_id?: string
          player_bravo_id?: string | null
          score?: number | null
          stage?: number
          status?: string
          telemetry?: Json | null
        }
        Relationships: []
      }
      duel_rooms: {
        Row: {
          created_at: string
          ended_at: string | null
          host_id: string
          id: string
          match_type: string
          opponent_id: string | null
          pot: number
          rake: number
          status: string
          wager: number
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          host_id: string
          id?: string
          match_type?: string
          opponent_id?: string | null
          pot?: number
          rake?: number
          status?: string
          wager?: number
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          host_id?: string
          id?: string
          match_type?: string
          opponent_id?: string | null
          pot?: number
          rake?: number
          status?: string
          wager?: number
          winner_id?: string | null
        }
        Relationships: []
      }
      duel_secrets: {
        Row: {
          created_at: string
          room_id: string
          secret_host: string
          secret_opponent: string
        }
        Insert: {
          created_at?: string
          room_id: string
          secret_host: string
          secret_opponent: string
        }
        Update: {
          created_at?: string
          room_id?: string
          secret_host?: string
          secret_opponent?: string
        }
        Relationships: [
          {
            foreignKeyName: "duel_secrets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "duel_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      game_guesses: {
        Row: {
          created_at: string
          guess: string
          id: string
          pans: number
          pots: number
          session_id: string
          turn_number: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          guess: string
          id?: string
          pans?: number
          pots?: number
          session_id: string
          turn_number: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          guess?: string
          id?: string
          pans?: number
          pots?: number
          session_id?: string
          turn_number?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_guesses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_secrets: {
        Row: {
          created_at: string
          secret: string
          session_id: string
        }
        Insert: {
          created_at?: string
          secret: string
          session_id: string
        }
        Update: {
          created_at?: string
          secret?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_secrets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          allow_duplicates: boolean
          attempts_left: number
          created_at: string
          digits: number
          ended_at: string | null
          failure_reason: string | null
          fine: number | null
          id: string
          max_attempts: number
          node_id: string
          payout: number | null
          revealed_secret: string | null
          started_at: string
          status: string
          tier: number
          timer_seconds: number
          user_id: string | null
        }
        Insert: {
          allow_duplicates?: boolean
          attempts_left?: number
          created_at?: string
          digits?: number
          ended_at?: string | null
          failure_reason?: string | null
          fine?: number | null
          id?: string
          max_attempts?: number
          node_id: string
          payout?: number | null
          revealed_secret?: string | null
          started_at?: string
          status?: string
          tier?: number
          timer_seconds?: number
          user_id?: string | null
        }
        Update: {
          allow_duplicates?: boolean
          attempts_left?: number
          created_at?: string
          digits?: number
          ended_at?: string | null
          failure_reason?: string | null
          fine?: number | null
          id?: string
          max_attempts?: number
          node_id?: string
          payout?: number | null
          revealed_secret?: string | null
          started_at?: string
          status?: string
          tier?: number
          timer_seconds?: number
          user_id?: string | null
        }
        Relationships: []
      }
      node_defenses: {
        Row: {
          bounty_stake: number
          created_at: string
          ice_type: string
          id: string
          node_id: string
          status: string
          traps: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bounty_stake?: number
          created_at?: string
          ice_type?: string
          id?: string
          node_id: string
          status?: string
          traps?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bounty_stake?: number
          created_at?: string
          ice_type?: string
          id?: string
          node_id?: string
          status?: string
          traps?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_faction: string | null
          avatar_url: string | null
          breaches_attempted: number | null
          breaches_succeeded: number | null
          career_earnings: number | null
          coins: number | null
          created_at: string
          credits: number | null
          current_streak: number | null
          equipped_cosmetics: Json | null
          factions: Json | null
          handle: string
          highest_streak: number | null
          id: string
          level: number | null
          rank: number | null
          reputation: number | null
          skill_points: number | null
          skills: Json | null
          title: string | null
          updated_at: string
          win_rate: number | null
          xp: number | null
          xp_to_next_level: number | null
        }
        Insert: {
          active_faction?: string | null
          avatar_url?: string | null
          breaches_attempted?: number | null
          breaches_succeeded?: number | null
          career_earnings?: number | null
          coins?: number | null
          created_at?: string
          credits?: number | null
          current_streak?: number | null
          equipped_cosmetics?: Json | null
          factions?: Json | null
          handle: string
          highest_streak?: number | null
          id: string
          level?: number | null
          rank?: number | null
          reputation?: number | null
          skill_points?: number | null
          skills?: Json | null
          title?: string | null
          updated_at?: string
          win_rate?: number | null
          xp?: number | null
          xp_to_next_level?: number | null
        }
        Update: {
          active_faction?: string | null
          avatar_url?: string | null
          breaches_attempted?: number | null
          breaches_succeeded?: number | null
          career_earnings?: number | null
          coins?: number | null
          created_at?: string
          credits?: number | null
          current_streak?: number | null
          equipped_cosmetics?: Json | null
          factions?: Json | null
          handle?: string
          highest_streak?: number | null
          id?: string
          level?: number | null
          rank?: number | null
          reputation?: number | null
          skill_points?: number | null
          skills?: Json | null
          title?: string | null
          updated_at?: string
          win_rate?: number | null
          xp?: number | null
          xp_to_next_level?: number | null
        }
        Relationships: []
      }
      replays: {
        Row: {
          analysis: Json | null
          created_at: string
          duration_seconds: number
          guesses: Json
          id: string
          node_id: string
          outcome: string
          secret: string
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          created_at?: string
          duration_seconds?: number
          guesses?: Json
          id?: string
          node_id: string
          outcome: string
          secret: string
          user_id: string
        }
        Update: {
          analysis?: Json | null
          created_at?: string
          duration_seconds?: number
          guesses?: Json
          id?: string
          node_id?: string
          outcome?: string
          secret?: string
          user_id?: string
        }
        Relationships: []
      }
      rig_configs: {
        Row: {
          active_preset: string | null
          created_at: string
          durability: Json | null
          installed_modules: Json | null
          rail_slots: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_preset?: string | null
          created_at?: string
          durability?: Json | null
          installed_modules?: Json | null
          rail_slots?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_preset?: string | null
          created_at?: string
          durability?: Json | null
          installed_modules?: Json | null
          rail_slots?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      safehouses: {
        Row: {
          created_at: string
          defense_rating: number
          district: string
          id: string
          last_income_collected_at: string
          level: number
          passive_income_rate: number
          storage_capacity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          defense_rating?: number
          district?: string
          id?: string
          last_income_collected_at?: string
          level?: number
          passive_income_rate?: number
          storage_capacity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          defense_rating?: number
          district?: string
          id?: string
          last_income_collected_at?: string
          level?: number
          passive_income_rate?: number
          storage_capacity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          metadata: Json | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          assist_mode: string | null
          colorblind_mode: boolean | null
          created_at: string
          daily_spend_limit: number | null
          master_mute: boolean | null
          music_volume: number | null
          reduced_motion: boolean | null
          sfx_volume: number | null
          sound_volume: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assist_mode?: string | null
          colorblind_mode?: boolean | null
          created_at?: string
          daily_spend_limit?: number | null
          master_mute?: boolean | null
          music_volume?: number | null
          reduced_motion?: boolean | null
          sfx_volume?: number | null
          sound_volume?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assist_mode?: string | null
          colorblind_mode?: boolean | null
          created_at?: string
          daily_spend_limit?: number | null
          master_mute?: boolean | null
          music_volume?: number | null
          reduced_motion?: boolean | null
          sfx_volume?: number | null
          sound_volume?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          coins: number | null
          created_at: string
          credits: number | null
          equipped_tools: string[] | null
          inventory: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          coins?: number | null
          created_at?: string
          credits?: number | null
          equipped_tools?: string[] | null
          inventory?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          coins?: number | null
          created_at?: string
          credits?: number | null
          equipped_tools?: string[] | null
          inventory?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
