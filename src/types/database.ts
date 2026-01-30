export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cart_items: {
        Row: {
          brand: string | null
          color: string | null
          created_at: string
          id: string
          quantity: number | null
          shoe_id: string
          size: number
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          color?: string | null
          created_at?: string
          id?: string
          quantity?: number | null
          shoe_id: string
          size: number
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          color?: string | null
          created_at?: string
          id?: string
          quantity?: number | null
          shoe_id?: string
          size?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_shoe_id_fkey"
            columns: ["shoe_id"]
            isOneToOne: false
            referencedRelation: "shoes"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          min_spend_amount: number | null
          name: string | null
          starts_at: string | null
          times_used: number | null
          usage_limit_total: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          min_spend_amount?: number | null
          starts_at?: string | null
          times_used?: number | null
          usage_limit_total?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          min_spend_amount?: number | null
          starts_at?: string | null
          times_used?: number | null
          usage_limit_total?: number | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          color: string
          created_at: string | null
          id: string
          order_id: string
          price: number
          quantity: number
          shoe_id: string
          size: number
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: string
          order_id: string
          price: number
          quantity: number
          shoe_id: string
          size: number
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          order_id?: string
          price?: number
          quantity?: number
          shoe_id?: string
          size?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_shoe_id_fkey"
            columns: ["shoe_id"]
            isOneToOne: false
            referencedRelation: "shoes"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          apartment: string | null
          city: string
          code: string
          country: string
          created_at: string | null
          id: string
          payment_id: string | null
          payment_method: string
          phone: string
          postal_code: string
          status: string | null
          total_price: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address: string
          apartment?: string | null
          city: string
          code: string
          country: string
          created_at?: string | null
          id?: string
          payment_id?: string | null
          payment_method: string
          phone: string
          postal_code: string
          status?: string | null
          total_price: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string
          apartment?: string | null
          city?: string
          code?: string
          country?: string
          created_at?: string | null
          id?: string
          payment_id?: string | null
          payment_method?: string
          phone?: string
          postal_code?: string
          status?: string | null
          total_price?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          username?: string | null
        }
        Relationships: []
      }
      recently_viewed: {
        Row: {
          id: string
          shoe_id: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          id?: string
          shoe_id: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          id?: string
          shoe_id?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recently_viewed_shoe_id_fkey"
            columns: ["shoe_id"]
            isOneToOne: false
            referencedRelation: "shoes"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number | null
          shoe_id: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          shoe_id?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          shoe_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_shoe_id_fkey"
            columns: ["shoe_id"]
            isOneToOne: false
            referencedRelation: "shoes"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_addresses: {
        Row: {
          address: string
          apartment: string | null
          city: string
          created_at: string | null
          id: string
          is_default: boolean | null
          last_used: string | null
          phone: string
          postal_code: string
          user_id: string | null
        }
        Insert: {
          address: string
          apartment?: string | null
          city: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last_used?: string | null
          phone: string
          postal_code: string
          user_id?: string | null
        }
        Update: {
          address?: string
          apartment?: string | null
          city?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last_used?: string | null
          phone?: string
          postal_code?: string
          user_id?: string | null
        }
        Relationships: []
      }
      saved_payment_methods: {
        Row: {
          card_brand: string | null
          card_expiry: string | null
          card_last_four: string | null
          cardholder_name: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          user_id: string | null
        }
        Insert: {
          card_brand?: string | null
          card_expiry?: string | null
          card_last_four?: string | null
          cardholder_name?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          user_id?: string | null
        }
        Update: {
          card_brand?: string | null
          card_expiry?: string | null
          card_last_four?: string | null
          cardholder_name?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      shoes: {
        Row: {
          brand: string
          created_at: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          sizes: number[]
          status: string
          updated_at: string | null
        }
        Insert: {
          brand: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          sizes: number[]
          status?: string
          updated_at?: string | null
        }
        Update: {
          brand?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          sizes?: number[]
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"] | null
          user_id: string | null
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string | null
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string | null
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          added_at: string | null
          id: string
          shoe_id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          shoe_id: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          shoe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_shoe_id_fkey"
            columns: ["shoe_id"]
            isOneToOne: false
            referencedRelation: "shoes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer"
      shoe_status: "in_stock" | "sold_out"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]

// Convenience types for use throughout the app
export type DbShoe = Tables<"shoes">
export type DbProfile = Tables<"profiles">
export type DbWishlist = Tables<"wishlists">
export type DbUserRole = Tables<"user_roles">
