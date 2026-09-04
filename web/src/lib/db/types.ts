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
      area: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          name: string
          site_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          name: string
          site_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          name?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "area_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_request: {
        Row: {
          id: string
          staff_id: string
          org_id: string
          request_type: string
          date: string | null
          start_time: string | null
          end_time: string | null
          weekday: number | null
          reason: string | null
          status: string
          resolved_by: string | null
          resolved_at: string | null
          manager_note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          org_id: string
          request_type: string
          date?: string | null
          start_time?: string | null
          end_time?: string | null
          weekday?: number | null
          reason?: string | null
          status?: string
          resolved_by?: string | null
          resolved_at?: string | null
          manager_note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          org_id?: string
          request_type?: string
          date?: string | null
          start_time?: string | null
          end_time?: string | null
          weekday?: number | null
          reason?: string | null
          status?: string
          resolved_by?: string | null
          resolved_at?: string | null
          manager_note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_request_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_request_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_request_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "member"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          entity: string | null
          id: string
          meta: Json
          org_id: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          entity?: string | null
          id?: string
          meta?: Json
          org_id?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          entity?: string | null
          id?: string
          meta?: Json
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
        ]
      }
      coverage_requirement: {
        Row: {
          area_id: string | null
          end_time: string
          id: string
          label: string | null
          min_count: number
          role_id: string
          site_id: string
          start_time: string
          weekday: number
        }
        Insert: {
          area_id?: string | null
          end_time: string
          id?: string
          label?: string | null
          min_count: number
          role_id: string
          site_id: string
          start_time: string
          weekday: number
        }
        Update: {
          area_id?: string | null
          end_time?: string
          id?: string
          label?: string | null
          min_count?: number
          role_id?: string
          site_id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "coverage_requirement_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "area"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_requirement_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_requirement_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_pref: {
        Row: {
          id: string
          member_id: string
          channel: string
          category: string
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          channel?: string
          category: string
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          channel?: string
          category?: string
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_pref_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member"
            referencedColumns: ["id"]
          },
        ]
      }
      member: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string
          id: string
          invite_token: string | null
          invited_at: string | null
          invited_by: string | null
          name: string
          org_id: string
          role: string
          status: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email: string
          id?: string
          invite_token?: string | null
          invited_at?: string | null
          invited_by?: string | null
          name: string
          org_id: string
          role?: string
          status?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string
          id?: string
          invite_token?: string | null
          invited_at?: string | null
          invited_by?: string | null
          name?: string
          org_id?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
        ]
      }
      message_log: {
        Row: {
          body: string
          channel: string
          created_at: string
          id: string
          meta: Json
          org_id: string | null
          provider: string
          status: string
          to_address: string
        }
        Insert: {
          body: string
          channel: string
          created_at?: string
          id?: string
          meta?: Json
          org_id?: string | null
          provider: string
          status?: string
          to_address: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          id?: string
          meta?: Json
          org_id?: string | null
          provider?: string
          status?: string
          to_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
        ]
      }
      org: {
        Row: {
          area_label: string
          created_at: string
          id: string
          industry: string
          logo_url: string | null
          name: string
          onboarding_completed: boolean
          plan: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          area_label?: string
          created_at?: string
          id?: string
          industry?: string
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          area_label?: string
          created_at?: string
          id?: string
          industry?: string
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: []
      }
      role: {
        Row: {
          archived: boolean
          colour: string | null
          created_at: string
          id: string
          name: string
          org_id: string
        }
        Insert: {
          archived?: boolean
          colour?: string | null
          created_at?: string
          id?: string
          name: string
          org_id: string
        }
        Update: {
          archived?: boolean
          colour?: string | null
          created_at?: string
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
        ]
      }
      rota_run: {
        Row: {
          generated_at: string
          generated_by: string | null
          id: string
          site_id: string
          week_start: string
        }
        Insert: {
          generated_at?: string
          generated_by?: string | null
          id?: string
          site_id: string
          week_start: string
        }
        Update: {
          generated_at?: string
          generated_by?: string | null
          id?: string
          site_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "rota_run_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rota_run_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site"
            referencedColumns: ["id"]
          },
        ]
      }
      shift: {
        Row: {
          area_id: string | null
          created_at: string
          date: string
          end_time: string
          filled_at: string | null
          filled_by: string | null
          id: string
          notes: string | null
          role_id: string
          rota_run_id: string | null
          site_id: string
          source: string
          start_time: string
          status: string
        }
        Insert: {
          area_id?: string | null
          created_at?: string
          date: string
          end_time: string
          filled_at?: string | null
          filled_by?: string | null
          id?: string
          notes?: string | null
          role_id: string
          rota_run_id?: string | null
          site_id: string
          source?: string
          start_time: string
          status?: string
        }
        Update: {
          area_id?: string | null
          created_at?: string
          date?: string
          end_time?: string
          filled_at?: string | null
          filled_by?: string | null
          id?: string
          notes?: string | null
          role_id?: string
          rota_run_id?: string | null
          site_id?: string
          source?: string
          start_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "area"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_filled_by_fkey"
            columns: ["filled_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_rota_run_id_fkey"
            columns: ["rota_run_id"]
            isOneToOne: false
            referencedRelation: "rota_run"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_offer: {
        Row: {
          id: string
          outcome: string | null
          responded_at: string | null
          sent_at: string
          shift_id: string
          staff_id: string
          token: string
        }
        Insert: {
          id?: string
          outcome?: string | null
          responded_at?: string | null
          sent_at?: string
          shift_id: string
          staff_id: string
          token: string
        }
        Update: {
          id?: string
          outcome?: string | null
          responded_at?: string | null
          sent_at?: string
          shift_id?: string
          staff_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_offer_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shift"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_offer_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_swap: {
        Row: {
          id: string
          shift_id: string
          requester_staff_id: string
          target_staff_id: string | null
          target_shift_id: string | null
          status: string
          reason: string | null
          token: string
          manager_note: string | null
          created_at: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          id?: string
          shift_id: string
          requester_staff_id: string
          target_staff_id?: string | null
          target_shift_id?: string | null
          status?: string
          reason?: string | null
          token: string
          manager_note?: string | null
          created_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          id?: string
          shift_id?: string
          requester_staff_id?: string
          target_staff_id?: string | null
          target_shift_id?: string | null
          status?: string
          reason?: string | null
          token?: string
          manager_note?: string | null
          created_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_swap_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shift"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requester_staff_id_fkey"
            columns: ["requester_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_template: {
        Row: {
          active: boolean
          area_id: string | null
          created_at: string
          end_time: string
          id: string
          min_staff: number
          max_staff: number
          min_hours: number | null
          max_hours: number | null
          role_id: string
          site_id: string
          start_time: string
          weekday: number
        }
        Insert: {
          active?: boolean
          area_id?: string | null
          created_at?: string
          end_time: string
          id?: string
          min_staff?: number
          max_staff?: number
          min_hours?: number | null
          max_hours?: number | null
          role_id: string
          site_id: string
          start_time: string
          weekday: number
        }
        Update: {
          active?: boolean
          area_id?: string | null
          created_at?: string
          end_time?: string
          id?: string
          min_staff?: number
          max_staff?: number
          min_hours?: number | null
          max_hours?: number | null
          role_id?: string
          site_id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "shift_template_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "area"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_template_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_template_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site"
            referencedColumns: ["id"]
          },
        ]
      }
      site_blocked_date: {
        Row: {
          id: string
          site_id: string
          date: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          site_id: string
          date: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          date?: string
          reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_blocked_date_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site"
            referencedColumns: ["id"]
          },
        ]
      }
      site: {
        Row: {
          address: string | null
          archived: boolean
          created_at: string
          id: string
          name: string
          org_id: string
          quiet_hours_end: string
          quiet_hours_start: string
          timezone: string
        }
        Insert: {
          address?: string | null
          archived?: boolean
          created_at?: string
          id?: string
          name: string
          org_id: string
          quiet_hours_end?: string
          quiet_hours_start?: string
          timezone?: string
        }
        Update: {
          address?: string | null
          archived?: boolean
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          quiet_hours_end?: string
          quiet_hours_start?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          active: boolean
          archived: boolean
          created_at: string
          email: string | null
          id: string
          max_days_per_week: number | null
          max_hours_per_day: number | null
          max_hours_per_week: number | null
          mobile: string | null
          name: string
          notes: string | null
          org_id: string
        }
        Insert: {
          active?: boolean
          archived?: boolean
          created_at?: string
          email?: string | null
          id?: string
          max_days_per_week?: number | null
          max_hours_per_day?: number | null
          max_hours_per_week?: number | null
          mobile?: string | null
          name: string
          notes?: string | null
          org_id: string
        }
        Update: {
          active?: boolean
          archived?: boolean
          created_at?: string
          email?: string | null
          id?: string
          max_days_per_week?: number | null
          max_hours_per_day?: number | null
          max_hours_per_week?: number | null
          mobile?: string | null
          name?: string
          notes?: string | null
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_area: {
        Row: {
          area_id: string
          staff_id: string
        }
        Insert: {
          area_id: string
          staff_id: string
        }
        Update: {
          area_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_area_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "area"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_area_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_role: {
        Row: {
          role_id: string
          staff_id: string
        }
        Insert: {
          role_id: string
          staff_id: string
        }
        Update: {
          role_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_role_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_role_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_availability: {
        Row: {
          id: string
          staff_id: string
          date: string
          available: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          date: string
          available?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          date?: string
          available?: boolean
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_availability_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription: {
        Row: {
          created_at: string
          id: string
          notifications_used_this_period: number
          org_id: string
          period_end: string | null
          site_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notifications_used_this_period?: number
          org_id: string
          period_end?: string | null
          site_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notifications_used_this_period?: number
          org_id?: string
          period_end?: string | null
          site_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_shift_offer: { Args: { p_offer_id: string }; Returns: number }
      caller_can_access_site: { Args: { p_site_id: string }; Returns: boolean }
      current_org_ids: { Args: never; Returns: string[] }
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

