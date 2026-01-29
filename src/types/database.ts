export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      shoes: {
        Row: {
          id: string
          name: string
          brand: string
          price: number
          image_url: string | null
          sizes: number[]
          status: 'in_stock' | 'sold_out'
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          brand: string
          price: number
          image_url?: string | null
          sizes?: number[]
          status?: 'in_stock' | 'sold_out'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          brand?: string
          price?: number
          image_url?: string | null
          sizes?: number[]
          status?: 'in_stock' | 'sold_out'
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          phone: string | null
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
        }
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          shoe_id: string
          added_at: string
        }
        Insert: {
          id?: string
          user_id: string
          shoe_id: string
          added_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          shoe_id?: string
          added_at?: string
        }
      }

      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'admin' | 'customer'
        }
        Insert: {
          id?: string
          user_id: string
          role: 'admin' | 'customer'
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'admin' | 'customer'
        }
      }
      recently_viewed: {
        Row: {
          id: string
          user_id: string
          shoe_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          shoe_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          shoe_id?: string
          viewed_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: 'admin' | 'customer'
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: 'admin' | 'customer'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience types for use throughout the app
export type DbShoe = Tables<'shoes'>
export type DbProfile = Tables<'profiles'>
export type DbWishlist = Tables<'wishlists'>

export type DbUserRole = Tables<'user_roles'>
