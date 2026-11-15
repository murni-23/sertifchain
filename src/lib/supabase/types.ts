// =============================================
// Database types — generated to match migration schema
// =============================================

export type CertificateStatus = "pending" | "generated" | "unclaimed" | "claimed";

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          name?: string;
          updated_at?: string;
        };
      };
      certificate_templates: {
        Row: {
          id: string;
          admin_id: string | null;
          name: string;
          description: string | null;
          thumbnail_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          admin_id?: string | null;
          name: string;
          description?: string | null;
          thumbnail_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          admin_id?: string | null;
          name?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      batches: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          template_id: string | null;
          admin_id: string | null;
          total_students: number;
          claimed_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          template_id?: string | null;
          admin_id?: string | null;
          total_students?: number;
          claimed_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          template_id?: string | null;
          total_students?: number;
          claimed_count?: number;
          updated_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          name: string;
          unique_code: string;
          batch_id: string;
          status: CertificateStatus;
          certificate_url: string | null;
          certificate_pdf_url: string | null;
          claimed_at: string | null;
          claimed_ip: string | null;
          tx_hash: string | null;
          token_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          unique_code: string;
          batch_id: string;
          status?: CertificateStatus;
          certificate_url?: string | null;
          certificate_pdf_url?: string | null;
          claimed_at?: string | null;
          claimed_ip?: string | null;
          tx_hash?: string | null;
          token_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          unique_code?: string;
          batch_id?: string;
          status?: CertificateStatus;
          certificate_url?: string | null;
          certificate_pdf_url?: string | null;
          claimed_at?: string | null;
          claimed_ip?: string | null;
          tx_hash?: string | null;
          token_id?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      batch_summary: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
          template_name: string | null;
          admin_name: string | null;
          total_students: number;
          claimed_count: number;
          unclaimed_count: number;
          pending_count: number;
          claim_percentage: number;
        };
      };
    };
    Functions: {
      search_student_for_claim: {
        Args: { p_name: string; p_unique_code: string };
        Returns: {
          id: string;
          name: string;
          unique_code: string;
          batch_name: string;
          status: CertificateStatus;
          certificate_url: string | null;
          certificate_pdf_url: string | null;
          claimed_at: string | null;
          created_at: string;
        }[];
      };
      claim_certificate: {
        Args: { p_student_id: string; p_ip_address?: string };
        Returns: {
          success: boolean;
          message: string;
          claimed_at?: string;
          student_id?: string;
        };
      };
      get_dashboard_stats: {
        Args: Record<string, never>;
        Returns: {
          total_batches: number;
          total_students: number;
          total_claimed: number;
          total_unclaimed: number;
          total_pending: number;
          claim_rate: number;
        };
      };
    };
    Enums: {
      certificate_status: CertificateStatus;
    };
  };
}

// =============================================
// Convenience re-exports for common row types
// =============================================
export type Admin = Database["public"]["Tables"]["admins"]["Row"];
export type CertificateTemplate = Database["public"]["Tables"]["certificate_templates"]["Row"];
export type Batch = Database["public"]["Tables"]["batches"]["Row"];
export type Student = Database["public"]["Tables"]["students"]["Row"];
export type BatchSummary = Database["public"]["Views"]["batch_summary"]["Row"];
