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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          attendance_date: string
          created_at: string
          id: string
          remarks: string | null
          status: string
          student_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          attendance_date?: string
          created_at?: string
          id?: string
          remarks?: string | null
          status?: string
          student_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          created_at?: string
          id?: string
          remarks?: string | null
          status?: string
          student_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fees_payments: {
        Row: {
          created_at: string
          discount: number
          fees_amount: number
          fees_month: string
          id: string
          late_fees: number
          payment_date: string
          payment_mode: string
          receipt_number: string | null
          remarks: string | null
          student_id: string
          teacher_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount?: number
          fees_amount?: number
          fees_month: string
          id?: string
          late_fees?: number
          payment_date?: string
          payment_mode?: string
          receipt_number?: string | null
          remarks?: string | null
          student_id: string
          teacher_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount?: number
          fees_amount?: number
          fees_month?: string
          id?: string
          late_fees?: number
          payment_date?: string
          payment_mode?: string
          receipt_number?: string | null
          remarks?: string | null
          student_id?: string
          teacher_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fees_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          attachment_url: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          notice_date: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          notice_date?: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          notice_date?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          class_logo_url: string | null
          class_name: string
          created_at: string
          email: string | null
          id: string
          phone: string | null
          teacher_name: string
          updated_at: string
        }
        Insert: {
          class_logo_url?: string | null
          class_name?: string
          created_at?: string
          email?: string | null
          id: string
          phone?: string | null
          teacher_name?: string
          updated_at?: string
        }
        Update: {
          class_logo_url?: string | null
          class_name?: string
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          teacher_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sms_log: {
        Row: {
          created_at: string
          id: string
          message: string
          message_type: string
          recipient_count: number
          recipient_ids: string[]
          status: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          message_type?: string
          recipient_count?: number
          recipient_ids?: string[]
          status?: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          message_type?: string
          recipient_count?: number
          recipient_ids?: string[]
          status?: string
          teacher_id?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          address: string | null
          admission_date: string | null
          batch_name: string | null
          created_at: string
          date_of_birth: string | null
          division: string | null
          email: string | null
          father_name: string | null
          gender: string | null
          id: string
          mobile_number: string | null
          monthly_fees: number | null
          mother_name: string | null
          parent_mobile_number: string | null
          parent_name: string | null
          photo_url: string | null
          remarks: string | null
          roll_number: string | null
          school_name: string | null
          standard: string | null
          status: string
          student_name: string
          subjects: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          batch_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          division?: string | null
          email?: string | null
          father_name?: string | null
          gender?: string | null
          id?: string
          mobile_number?: string | null
          monthly_fees?: number | null
          mother_name?: string | null
          parent_mobile_number?: string | null
          parent_name?: string | null
          photo_url?: string | null
          remarks?: string | null
          roll_number?: string | null
          school_name?: string | null
          standard?: string | null
          status?: string
          student_name: string
          subjects?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          batch_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          division?: string | null
          email?: string | null
          father_name?: string | null
          gender?: string | null
          id?: string
          mobile_number?: string | null
          monthly_fees?: number | null
          mother_name?: string | null
          parent_mobile_number?: string | null
          parent_name?: string | null
          photo_url?: string | null
          remarks?: string | null
          roll_number?: string | null
          school_name?: string | null
          standard?: string | null
          status?: string
          student_name?: string
          subjects?: string | null
          teacher_id?: string
          updated_at?: string
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
