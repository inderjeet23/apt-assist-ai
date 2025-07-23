export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      legal_notices: {
        Row: {
          amount_owed: number
          created_at: string
          days_to_pay: number
          generated_date: string
          id: string
          notice_type: string
          pdf_url: string | null
          property_manager_id: string
          rent_record_id: string
          served_date: string | null
          state: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_owed: number
          created_at?: string
          days_to_pay?: number
          generated_date?: string
          id?: string
          notice_type?: string
          pdf_url?: string | null
          property_manager_id: string
          rent_record_id: string
          served_date?: string | null
          state: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_owed?: number
          created_at?: string
          days_to_pay?: number
          generated_date?: string
          id?: string
          notice_type?: string
          pdf_url?: string | null
          property_manager_id?: string
          rent_record_id?: string
          served_date?: string | null
          state?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_notices_rent_record_id_fkey"
            columns: ["rent_record_id"]
            isOneToOne: false
            referencedRelation: "rent_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_notices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          actual_cost: number | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string
          estimated_cost: number | null
          id: string
          images: string[] | null
          notes: string | null
          priority: string
          property_address: string
          property_manager_id: string
          request_type: string
          status: string
          tenant_email: string | null
          tenant_name: string
          tenant_phone: string | null
          title: string
          unit_number: string | null
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description: string
          estimated_cost?: number | null
          id?: string
          images?: string[] | null
          notes?: string | null
          priority?: string
          property_address: string
          property_manager_id: string
          request_type: string
          status?: string
          tenant_email?: string | null
          tenant_name: string
          tenant_phone?: string | null
          title: string
          unit_number?: string | null
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string
          estimated_cost?: number | null
          id?: string
          images?: string[] | null
          notes?: string | null
          priority?: string
          property_address?: string
          property_manager_id?: string
          request_type?: string
          status?: string
          tenant_email?: string | null
          tenant_name?: string
          tenant_phone?: string | null
          title?: string
          unit_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      property_managers: {
        Row: {
          bot_id: string
          brand_color: string
          created_at: string
          email: string
          hosted_link: string
          id: string
          logo_url: string | null
          name: string
          routing_email: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bot_id?: string
          brand_color?: string
          created_at?: string
          email: string
          hosted_link: string
          id?: string
          logo_url?: string | null
          name: string
          routing_email?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bot_id?: string
          brand_color?: string
          created_at?: string
          email?: string
          hosted_link?: string
          id?: string
          logo_url?: string | null
          name?: string
          routing_email?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rent_records: {
        Row: {
          amount_due: number
          amount_paid: number | null
          created_at: string
          due_date: string
          id: string
          late_fees: number | null
          notes: string | null
          paid_date: string | null
          payment_method: string | null
          property_manager_id: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_due: number
          amount_paid?: number | null
          created_at?: string
          due_date: string
          id?: string
          late_fees?: number | null
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          property_manager_id: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number | null
          created_at?: string
          due_date?: string
          id?: string
          late_fees?: number | null
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          property_manager_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rent_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_reminders: {
        Row: {
          created_at: string
          email_sent: boolean | null
          id: string
          property_manager_id: string
          reminder_type: string
          rent_record_id: string
          scheduled_for: string
          sent_date: string | null
          sms_sent: boolean | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          email_sent?: boolean | null
          id?: string
          property_manager_id: string
          reminder_type: string
          rent_record_id: string
          scheduled_for: string
          sent_date?: string | null
          sms_sent?: boolean | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          email_sent?: boolean | null
          id?: string
          property_manager_id?: string
          reminder_type?: string
          rent_record_id?: string
          scheduled_for?: string
          sent_date?: string | null
          sms_sent?: boolean | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rent_reminders_rent_record_id_fkey"
            columns: ["rent_record_id"]
            isOneToOne: false
            referencedRelation: "rent_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_reminders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          email: string | null
          id: string
          lease_end_date: string | null
          lease_start_date: string | null
          name: string
          notes: string | null
          phone: string | null
          property_address: string
          property_manager_id: string
          rent_amount: number
          rent_due_date: number
          security_deposit: number | null
          unit_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          lease_end_date?: string | null
          lease_start_date?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          property_address: string
          property_manager_id: string
          rent_amount: number
          rent_due_date?: number
          security_deposit?: number | null
          unit_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          lease_end_date?: string | null
          lease_start_date?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          property_address?: string
          property_manager_id?: string
          rent_amount?: number
          rent_due_date?: number
          security_deposit?: number | null
          unit_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          on_call_hours: string | null
          phone: string | null
          property_manager_id: string
          specialty: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          on_call_hours?: string | null
          phone?: string | null
          property_manager_id: string
          specialty: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          on_call_hours?: string | null
          phone?: string | null
          property_manager_id?: string
          specialty?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_property_manager_id_fkey"
            columns: ["property_manager_id"]
            isOneToOne: false
            referencedRelation: "property_managers"
            referencedColumns: ["id"]
          },
        ]
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
  public: {
    Enums: {},
  },
} as const
