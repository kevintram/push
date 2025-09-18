export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      timeline_entries: {
        Row: {
          completed_at: string | null
          description: string
          id: number
          inserted_at: string
          scheduled_at: string | null
          topic_id: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          description?: string
          id?: number
          inserted_at?: string
          scheduled_at?: string | null
          topic_id: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          description?: string
          id?: number
          inserted_at?: string
          scheduled_at?: string | null
          topic_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_entries_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          id: number
          inserted_at: string
          name: string
          notes: string | null
          retrievability: number
          stability: number
          updated_at: string
        }
        Insert: {
          id?: number
          inserted_at?: string
          name?: string
          notes?: string | null
          retrievability?: number
          stability?: number
          updated_at?: string
        }
        Update: {
          id?: number
          inserted_at?: string
          name?: string
          notes?: string | null
          retrievability?: number
          stability?: number
          updated_at?: string
        }
        Relationships: []
      }
      topics_closure: {
        Row: {
          ancestor: number
          count: number
          depth: number
          descendant: number
          inserted_at: string
          updated_at: string
        }
        Insert: {
          ancestor: number
          count?: number
          depth?: number
          descendant: number
          inserted_at?: string
          updated_at?: string
        }
        Update: {
          ancestor?: number
          count?: number
          depth?: number
          descendant?: number
          inserted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_closure_ancestor_fkey"
            columns: ["ancestor"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_closure_descendant_fkey"
            columns: ["descendant"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      timeline_entries_today: {
        Row: {
          completed_at: string | null
          description: string | null
          effective_date: string | null
          id: number | null
          inserted_at: string | null
          scheduled_at: string | null
          topic_id: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          description?: string | null
          effective_date?: never
          id?: number | null
          inserted_at?: string | null
          scheduled_at?: string | null
          topic_id?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          description?: string | null
          effective_date?: never
          id?: number | null
          inserted_at?: string | null
          scheduled_at?: string | null
          topic_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_entries_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_entries_with_effective_date: {
        Row: {
          completed_at: string | null
          description: string | null
          effective_date: string | null
          id: number | null
          inserted_at: string | null
          scheduled_at: string | null
          topic_id: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          description?: string | null
          effective_date?: never
          id?: number | null
          inserted_at?: string | null
          scheduled_at?: string | null
          topic_id?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          description?: string | null
          effective_date?: never
          id?: number | null
          inserted_at?: string | null
          scheduled_at?: string | null
          topic_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_entries_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      delete_relationship: {
        Args: { child: number; parent: number }
        Returns: undefined
      }
      get_potential_children: {
        Args: { topic_id: number }
        Returns: {
          id: number
          name: string
        }[]
      }
      get_potential_parents: {
        Args: { topic_id: number }
        Returns: {
          id: number
          name: string
        }[]
      }
      insert_relationship: {
        Args: { child: number; parent: number }
        Returns: {
          ancestor: number
          count: number
          depth: number
          descendant: number
          inserted_at: string
          updated_at: string
        }
      }
      insert_topic_reflexive_path: {
        Args: { topicid: number }
        Returns: {
          ancestor: number
          count: number
          depth: number
          descendant: number
          inserted_at: string
          updated_at: string
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

