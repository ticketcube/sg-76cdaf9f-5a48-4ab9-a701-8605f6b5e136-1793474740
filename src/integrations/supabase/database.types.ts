 
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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          role?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      api_usage_logs: {
        Row: {
          api_calls: number | null
          api_name: string
          cost: number | null
          created_at: string | null
          endpoint: string | null
          id: string
          model: string | null
          request_data: Json | null
          tokens_input: number | null
          tokens_output: number | null
          tokens_total: number | null
          user_id: string | null
        }
        Insert: {
          api_calls?: number | null
          api_name: string
          cost?: number | null
          created_at?: string | null
          endpoint?: string | null
          id?: string
          model?: string | null
          request_data?: Json | null
          tokens_input?: number | null
          tokens_output?: number | null
          tokens_total?: number | null
          user_id?: string | null
        }
        Update: {
          api_calls?: number | null
          api_name?: string
          cost?: number | null
          created_at?: string | null
          endpoint?: string | null
          id?: string
          model?: string | null
          request_data?: Json | null
          tokens_input?: number | null
          tokens_output?: number | null
          tokens_total?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      artist_demo_requests: {
        Row: {
          created_at: string | null
          email: string | null
          event_date: string | null
          event_type: string | null
          expected_attendees: string | null
          id: number
          message: string | null
          name: string
          status: string | null
          venue: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          event_date?: string | null
          event_type?: string | null
          expected_attendees?: string | null
          id?: number
          message?: string | null
          name: string
          status?: string | null
          venue?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          event_date?: string | null
          event_type?: string | null
          expected_attendees?: string | null
          id?: number
          message?: string | null
          name?: string
          status?: string | null
          venue?: string | null
        }
        Relationships: []
      }
      artists: {
        Row: {
          all_genres: Json | null
          artist_audiolink: string | null
          artist_bio: string | null
          artist_genre: string | null
          artist_home: string | null
          artist_id: string
          artist_image: string | null
          artist_name: string
          artist_otwcategory: string | null
          artist_otwcoverage: number | null
          artist_otwcreateddate: string | null
          artist_ticketcube: string | null
          artist_tiktok_username: string | null
          artist_tiktok_videoid: string | null
          artist_totallisteners: string | null
          artist_totalwatchers: string | null
          artist_videolink: string | null
          attraction_id: string | null
          cityid: number | null
          created_at: string | null
          primary_genre_id: string | null
          primary_genre_name: string | null
          primary_subgenre_id: string | null
          primary_subgenre_name: string | null
          primary_vibe: string | null
          secondary_vibe: string | null
          segment_id: string | null
          segment_name: string | null
          top_list: string | null
          updated_at: string | null
        }
        Insert: {
          all_genres?: Json | null
          artist_audiolink?: string | null
          artist_bio?: string | null
          artist_genre?: string | null
          artist_home?: string | null
          artist_id?: string
          artist_image?: string | null
          artist_name: string
          artist_otwcategory?: string | null
          artist_otwcoverage?: number | null
          artist_otwcreateddate?: string | null
          artist_ticketcube?: string | null
          artist_tiktok_username?: string | null
          artist_tiktok_videoid?: string | null
          artist_totallisteners?: string | null
          artist_totalwatchers?: string | null
          artist_videolink?: string | null
          attraction_id?: string | null
          cityid?: number | null
          created_at?: string | null
          primary_genre_id?: string | null
          primary_genre_name?: string | null
          primary_subgenre_id?: string | null
          primary_subgenre_name?: string | null
          primary_vibe?: string | null
          secondary_vibe?: string | null
          segment_id?: string | null
          segment_name?: string | null
          top_list?: string | null
          updated_at?: string | null
        }
        Update: {
          all_genres?: Json | null
          artist_audiolink?: string | null
          artist_bio?: string | null
          artist_genre?: string | null
          artist_home?: string | null
          artist_id?: string
          artist_image?: string | null
          artist_name?: string
          artist_otwcategory?: string | null
          artist_otwcoverage?: number | null
          artist_otwcreateddate?: string | null
          artist_ticketcube?: string | null
          artist_tiktok_username?: string | null
          artist_tiktok_videoid?: string | null
          artist_totallisteners?: string | null
          artist_totalwatchers?: string | null
          artist_videolink?: string | null
          attraction_id?: string | null
          cityid?: number | null
          created_at?: string | null
          primary_genre_id?: string | null
          primary_genre_name?: string | null
          primary_subgenre_id?: string | null
          primary_subgenre_name?: string | null
          primary_vibe?: string | null
          secondary_vibe?: string | null
          segment_id?: string | null
          segment_name?: string | null
          top_list?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      benchmarks: {
        Row: {
          avg_cpt: number
          avg_roas: number
          avg_sellthrough_pct: number
          created_at: string | null
          event_type: string
          id: string
          market: string
          sample_size: number | null
          user_id: string
        }
        Insert: {
          avg_cpt: number
          avg_roas: number
          avg_sellthrough_pct: number
          created_at?: string | null
          event_type: string
          id?: string
          market: string
          sample_size?: number | null
          user_id: string
        }
        Update: {
          avg_cpt?: number
          avg_roas?: number
          avg_sellthrough_pct?: number
          created_at?: string | null
          event_type?: string
          id?: string
          market?: string
          sample_size?: number | null
          user_id?: string
        }
        Relationships: []
      }
      client_staff: {
        Row: {
          accepted_at: string | null
          client_id: string
          created_at: string | null
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          permissions: Json | null
          staff_id: string
          staff_role: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          client_id: string
          created_at?: string | null
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          permissions?: Json | null
          staff_id?: string
          staff_role: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          client_id?: string
          created_at?: string | null
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          permissions?: Json | null
          staff_id?: string
          staff_role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_staff_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_staff_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "client_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      clients: {
        Row: {
          billing_contact_email: string | null
          brand_color_primary: string | null
          brand_color_secondary: string | null
          client_id: string
          client_name: string
          client_type: Database["public"]["Enums"]["client_type"]
          created_at: string | null
          description: string | null
          display_name: string
          enable_analytics: boolean | null
          enable_claim_codes: boolean | null
          enable_marketplace: boolean | null
          enable_payment_processing: boolean | null
          is_active: boolean | null
          logo_url: string | null
          onboarded_at: string | null
          primary_contact_email: string | null
          settings: Json | null
          truetix_account_id: string | null
          truetix_api_config: Json | null
          truetix_enabled: boolean | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          billing_contact_email?: string | null
          brand_color_primary?: string | null
          brand_color_secondary?: string | null
          client_id?: string
          client_name: string
          client_type: Database["public"]["Enums"]["client_type"]
          created_at?: string | null
          description?: string | null
          display_name: string
          enable_analytics?: boolean | null
          enable_claim_codes?: boolean | null
          enable_marketplace?: boolean | null
          enable_payment_processing?: boolean | null
          is_active?: boolean | null
          logo_url?: string | null
          onboarded_at?: string | null
          primary_contact_email?: string | null
          settings?: Json | null
          truetix_account_id?: string | null
          truetix_api_config?: Json | null
          truetix_enabled?: boolean | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          billing_contact_email?: string | null
          brand_color_primary?: string | null
          brand_color_secondary?: string | null
          client_id?: string
          client_name?: string
          client_type?: Database["public"]["Enums"]["client_type"]
          created_at?: string | null
          description?: string | null
          display_name?: string
          enable_analytics?: boolean | null
          enable_claim_codes?: boolean | null
          enable_marketplace?: boolean | null
          enable_payment_processing?: boolean | null
          is_active?: boolean | null
          logo_url?: string | null
          onboarded_at?: string | null
          primary_contact_email?: string | null
          settings?: Json | null
          truetix_account_id?: string | null
          truetix_api_config?: Json | null
          truetix_enabled?: boolean | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          metadata: Json | null
          status: string
          title: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          metadata?: Json | null
          status?: string
          title?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          metadata?: Json | null
          status?: string
          title?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      course_tees: {
        Row: {
          color: string
          course_id: string | null
          course_rating: number
          created_at: string | null
          id: string
          name: string
          slope_rating: number
          updated_at: string | null
        }
        Insert: {
          color: string
          course_id?: string | null
          course_rating: number
          created_at?: string | null
          id?: string
          name: string
          slope_rating: number
          updated_at?: string | null
        }
        Update: {
          color?: string
          course_id?: string | null
          course_rating?: number
          created_at?: string | null
          id?: string
          name?: string
          slope_rating?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_tees_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string | null
          holes: number
          id: string
          name: string
          par: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          holes: number
          id?: string
          name: string
          par: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          holes?: number
          id?: string
          name?: string
          par?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      cube_face_unlocks: {
        Row: {
          cube_id: string | null
          face_id: string | null
          id: string
          tcube_spent: number
          unlocked_at: string | null
          user_id: string | null
        }
        Insert: {
          cube_id?: string | null
          face_id?: string | null
          id?: string
          tcube_spent: number
          unlocked_at?: string | null
          user_id?: string | null
        }
        Update: {
          cube_id?: string | null
          face_id?: string | null
          id?: string
          tcube_spent?: number
          unlocked_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cube_face_unlocks_cube_id_fkey"
            columns: ["cube_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
          {
            foreignKeyName: "cube_face_unlocks_face_id_fkey"
            columns: ["face_id"]
            isOneToOne: false
            referencedRelation: "cube_faces"
            referencedColumns: ["face_id"]
          },
          {
            foreignKeyName: "cube_face_unlocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cube_faces: {
        Row: {
          action_type: string | null
          action_type_video_title: string | null
          action_url: string | null
          background_color: string | null
          content_text: string | null
          content_type: string
          created_at: string | null
          face_id: string
          face_number: number
          face_title: string | null
          image_url: string | null
          is_current: boolean | null
          is_editable: boolean
          is_premium: boolean | null
          parent_face_id: string | null
          tcube_price: number | null
          text_color: string | null
          ticketcube_id: string
          unlock_count: number | null
          updated_at: string | null
          user_id: string
          version_number: number | null
        }
        Insert: {
          action_type?: string | null
          action_type_video_title?: string | null
          action_url?: string | null
          background_color?: string | null
          content_text?: string | null
          content_type: string
          created_at?: string | null
          face_id?: string
          face_number: number
          face_title?: string | null
          image_url?: string | null
          is_current?: boolean | null
          is_editable?: boolean
          is_premium?: boolean | null
          parent_face_id?: string | null
          tcube_price?: number | null
          text_color?: string | null
          ticketcube_id: string
          unlock_count?: number | null
          updated_at?: string | null
          user_id: string
          version_number?: number | null
        }
        Update: {
          action_type?: string | null
          action_type_video_title?: string | null
          action_url?: string | null
          background_color?: string | null
          content_text?: string | null
          content_type?: string
          created_at?: string | null
          face_id?: string
          face_number?: number
          face_title?: string | null
          image_url?: string | null
          is_current?: boolean | null
          is_editable?: boolean
          is_premium?: boolean | null
          parent_face_id?: string | null
          tcube_price?: number | null
          text_color?: string | null
          ticketcube_id?: string
          unlock_count?: number | null
          updated_at?: string | null
          user_id?: string
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cube_faces_parent_face_id_fkey"
            columns: ["parent_face_id"]
            isOneToOne: false
            referencedRelation: "cube_faces"
            referencedColumns: ["face_id"]
          },
          {
            foreignKeyName: "cube_faces_ticketcube_id_fkey"
            columns: ["ticketcube_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
        ]
      }
      cube_update_notifications: {
        Row: {
          applied_at: string | null
          artist_user_id: string
          created_at: string | null
          holder_cube_id: string
          holder_user_id: string
          is_applied: boolean | null
          is_dismissed: boolean
          is_viewed: boolean | null
          notification_id: string
          template_id: string
          update_mode: string
        }
        Insert: {
          applied_at?: string | null
          artist_user_id: string
          created_at?: string | null
          holder_cube_id: string
          holder_user_id: string
          is_applied?: boolean | null
          is_dismissed?: boolean
          is_viewed?: boolean | null
          notification_id?: string
          template_id: string
          update_mode: string
        }
        Update: {
          applied_at?: string | null
          artist_user_id?: string
          created_at?: string | null
          holder_cube_id?: string
          holder_user_id?: string
          is_applied?: boolean | null
          is_dismissed?: boolean
          is_viewed?: boolean | null
          notification_id?: string
          template_id?: string
          update_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "cube_update_notifications_holder_cube_id_fkey"
            columns: ["holder_cube_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
          {
            foreignKeyName: "cube_update_notifications_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
        ]
      }
      cube_update_payments: {
        Row: {
          amount_cents: number
          completed_at: string | null
          created_at: string | null
          notification_id: string
          payment_id: string
          payment_type: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          completed_at?: string | null
          created_at?: string | null
          notification_id: string
          payment_id?: string
          payment_type: string
          status: string
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          completed_at?: string | null
          created_at?: string | null
          notification_id?: string
          payment_id?: string
          payment_type?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cube_update_payments_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "cube_update_notifications"
            referencedColumns: ["notification_id"]
          },
        ]
      }
      daily_prizes: {
        Row: {
          created_at: string | null
          date: string | null
          game_id: string | null
          id: string
          paid: boolean | null
          prize_amount: number | null
          rank: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          game_id?: string | null
          id?: string
          paid?: boolean | null
          prize_amount?: number | null
          rank?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          game_id?: string | null
          id?: string
          paid?: boolean | null
          prize_amount?: number | null
          rank?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_prizes_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      detections: {
        Row: {
          bounding_box: Json | null
          confidence: number
          created_at: string
          frame_id: string | null
          id: string
          metadata: Json | null
          object_type: string
          tracking_id: string | null
          video_id: string
        }
        Insert: {
          bounding_box?: Json | null
          confidence: number
          created_at?: string
          frame_id?: string | null
          id?: string
          metadata?: Json | null
          object_type: string
          tracking_id?: string | null
          video_id: string
        }
        Update: {
          bounding_box?: Json | null
          confidence?: number
          created_at?: string
          frame_id?: string | null
          id?: string
          metadata?: Json | null
          object_type?: string
          tracking_id?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detections_frame_id_fkey"
            columns: ["frame_id"]
            isOneToOne: false
            referencedRelation: "video_frames"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detections_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          artist_production: string
          avg_ticket_price: number
          created_at: string | null
          current_gross_revenue: number
          current_tickets_sold: number
          days_to_event: number | null
          event_date: string
          event_name: string
          expected_organic_sales_per_day: number | null
          historical_sellthrough_pct: number | null
          id: string
          learning_mode: boolean | null
          market_city: string
          pacing_status: string | null
          premium_ticket_pct: number
          premium_ticket_price: number
          standard_ticket_price: number
          target_gross_revenue: number
          target_sellthrough_pct: number
          updated_at: string | null
          user_id: string
          venue: string
          venue_capacity: number
        }
        Insert: {
          artist_production: string
          avg_ticket_price: number
          created_at?: string | null
          current_gross_revenue?: number
          current_tickets_sold?: number
          days_to_event?: number | null
          event_date: string
          event_name: string
          expected_organic_sales_per_day?: number | null
          historical_sellthrough_pct?: number | null
          id?: string
          learning_mode?: boolean | null
          market_city: string
          pacing_status?: string | null
          premium_ticket_pct?: number
          premium_ticket_price: number
          standard_ticket_price: number
          target_gross_revenue: number
          target_sellthrough_pct?: number
          updated_at?: string | null
          user_id: string
          venue: string
          venue_capacity: number
        }
        Update: {
          artist_production?: string
          avg_ticket_price?: number
          created_at?: string | null
          current_gross_revenue?: number
          current_tickets_sold?: number
          days_to_event?: number | null
          event_date?: string
          event_name?: string
          expected_organic_sales_per_day?: number | null
          historical_sellthrough_pct?: number | null
          id?: string
          learning_mode?: boolean | null
          market_city?: string
          pacing_status?: string | null
          premium_ticket_pct?: number
          premium_ticket_price?: number
          standard_ticket_price?: number
          target_gross_revenue?: number
          target_sellthrough_pct?: number
          updated_at?: string | null
          user_id?: string
          venue?: string
          venue_capacity?: number
        }
        Relationships: []
      }
      family_events: {
        Row: {
          all_day: boolean | null
          created_at: string | null
          description: string | null
          event_date: string
          event_time: string | null
          event_type: string
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          all_day?: boolean | null
          created_at?: string | null
          description?: string | null
          event_date: string
          event_time?: string | null
          event_type: string
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          all_day?: boolean | null
          created_at?: string | null
          description?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fandragon_waitlist: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          primary_interest: string | null
          social_handle: string | null
          user_type: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          primary_interest?: string | null
          social_handle?: string | null
          user_type: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          primary_interest?: string | null
          social_handle?: string | null
          user_type?: string
        }
        Relationships: []
      }
      financial_accounts: {
        Row: {
          account_name: string
          account_number_last4: string | null
          account_type: string
          available_balance: number | null
          created_at: string | null
          currency: string | null
          current_balance: number | null
          id: string
          institution: string | null
          is_active: boolean | null
          metadata: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_name: string
          account_number_last4?: string | null
          account_type: string
          available_balance?: number | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          id?: string
          institution?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_name?: string
          account_number_last4?: string | null
          account_type?: string
          available_balance?: number | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          id?: string
          institution?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      financial_documents: {
        Row: {
          account_id: string | null
          conversation_id: string | null
          created_at: string | null
          document_date: string | null
          document_name: string
          document_type: string
          extracted_data: Json | null
          file_size_bytes: number | null
          id: string
          mime_type: string | null
          storage_path: string
          tags: string[] | null
          transaction_ids: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          document_date?: string | null
          document_name: string
          document_type: string
          extracted_data?: Json | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          storage_path: string
          tags?: string[] | null
          transaction_ids?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          document_date?: string | null
          document_name?: string
          document_type?: string
          extracted_data?: Json | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          storage_path?: string
          tags?: string[] | null
          transaction_ids?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_documents_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_documents_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_research: {
        Row: {
          category: string
          content: Json
          conversation_id: string | null
          created_at: string | null
          id: string
          priority: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          content?: Json
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          content?: Json
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_research_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          account_id: string | null
          amount: number
          category: string | null
          conversation_id: string | null
          created_at: string | null
          currency: string | null
          description: string
          id: string
          merchant: string | null
          metadata: Json | null
          notes: string | null
          reference_number: string | null
          status: string | null
          subcategory: string | null
          tags: string[] | null
          transaction_date: string
          transaction_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category?: string | null
          conversation_id?: string | null
          created_at?: string | null
          currency?: string | null
          description: string
          id?: string
          merchant?: string | null
          metadata?: Json | null
          notes?: string | null
          reference_number?: string | null
          status?: string | null
          subcategory?: string | null
          tags?: string[] | null
          transaction_date: string
          transaction_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string | null
          conversation_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string
          id?: string
          merchant?: string | null
          metadata?: Json | null
          notes?: string | null
          reference_number?: string | null
          status?: string | null
          subcategory?: string | null
          tags?: string[] | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      foundation_board_inquiries: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          linkedin_url: string | null
          message: string | null
          organization: string | null
          profile_category: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          linkedin_url?: string | null
          message?: string | null
          organization?: string | null
          profile_category: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          linkedin_url?: string | null
          message?: string | null
          organization?: string | null
          profile_category?: string
        }
        Relationships: []
      }
      four_unders_waitlist: {
        Row: {
          amount_paid: number | null
          created_at: string | null
          email: string
          id: string
          last_score: string | null
          paid: boolean | null
          price_premium: string | null
          referral_code: string | null
          referred_by: string | null
          round_duration: string | null
          stripe_checkout_id: string | null
          stripe_payment_intent_id: string | null
          username: string | null
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string | null
          email: string
          id?: string
          last_score?: string | null
          paid?: boolean | null
          price_premium?: string | null
          referral_code?: string | null
          referred_by?: string | null
          round_duration?: string | null
          stripe_checkout_id?: string | null
          stripe_payment_intent_id?: string | null
          username?: string | null
        }
        Update: {
          amount_paid?: number | null
          created_at?: string | null
          email?: string
          id?: string
          last_score?: string | null
          paid?: boolean | null
          price_premium?: string | null
          referral_code?: string | null
          referred_by?: string | null
          round_duration?: string | null
          stripe_checkout_id?: string | null
          stripe_payment_intent_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      game_scores: {
        Row: {
          created_at: string | null
          game_data: Json | null
          id: string
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          game_data?: Json | null
          id?: string
          score: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          game_data?: Json | null
          id?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      gamepool_entries: {
        Row: {
          created_at: string | null
          gamepool_id: string | null
          id: string
          quantity: number | null
          stripe_checkout_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          gamepool_id?: string | null
          id?: string
          quantity?: number | null
          stripe_checkout_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          gamepool_id?: string | null
          id?: string
          quantity?: number | null
          stripe_checkout_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gamepool_entries_gamepool_id_fkey"
            columns: ["gamepool_id"]
            isOneToOne: false
            referencedRelation: "gamepools"
            referencedColumns: ["id"]
          },
        ]
      }
      gamepools: {
        Row: {
          created_at: string | null
          created_by: string | null
          current_players: number | null
          end_date: string | null
          entry_fee_points: number
          id: string
          max_players: number | null
          min_players: number | null
          name: string
          prize_pool_percentage: number | null
          start_date: string | null
          status: string
          total_prize_pool: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          current_players?: number | null
          end_date?: string | null
          entry_fee_points: number
          id?: string
          max_players?: number | null
          min_players?: number | null
          name: string
          prize_pool_percentage?: number | null
          start_date?: string | null
          status: string
          total_prize_pool?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          current_players?: number | null
          end_date?: string | null
          entry_fee_points?: number
          id?: string
          max_players?: number | null
          min_players?: number | null
          name?: string
          prize_pool_percentage?: number | null
          start_date?: string | null
          status?: string
          total_prize_pool?: number | null
        }
        Relationships: []
      }
      games: {
        Row: {
          adjusted_average_score: number | null
          course_id: string | null
          course_name: string
          created_at: string | null
          four_points_earned: number
          game_type: number | null
          ghin_handicap: number | null
          hole_categories: Json | null
          hole_scores: Json
          id: string
          leaderboard_type: string | null
          paid_entry: boolean | null
          player_name: string
          target_score: number
          tee_id: string | null
          tee_name: string
          total_points: number
          user_id: string | null
          user_type: string | null
          validated: boolean | null
        }
        Insert: {
          adjusted_average_score?: number | null
          course_id?: string | null
          course_name: string
          created_at?: string | null
          four_points_earned: number
          game_type?: number | null
          ghin_handicap?: number | null
          hole_categories?: Json | null
          hole_scores: Json
          id?: string
          leaderboard_type?: string | null
          paid_entry?: boolean | null
          player_name: string
          target_score: number
          tee_id?: string | null
          tee_name: string
          total_points: number
          user_id?: string | null
          user_type?: string | null
          validated?: boolean | null
        }
        Update: {
          adjusted_average_score?: number | null
          course_id?: string | null
          course_name?: string
          created_at?: string | null
          four_points_earned?: number
          game_type?: number | null
          ghin_handicap?: number | null
          hole_categories?: Json | null
          hole_scores?: Json
          id?: string
          leaderboard_type?: string | null
          paid_entry?: boolean | null
          player_name?: string
          target_score?: number
          tee_id?: string | null
          tee_name?: string
          total_points?: number
          user_id?: string | null
          user_type?: string | null
          validated?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "games_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_tee_id_fkey"
            columns: ["tee_id"]
            isOneToOne: false
            referencedRelation: "course_tees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      guest_users: {
        Row: {
          created_at: string | null
          games_played: number | null
          golfer_name: string
          id: string
          last_used: string | null
        }
        Insert: {
          created_at?: string | null
          games_played?: number | null
          golfer_name: string
          id?: string
          last_used?: string | null
        }
        Update: {
          created_at?: string | null
          games_played?: number | null
          golfer_name?: string
          id?: string
          last_used?: string | null
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          brand: string | null
          brand_confidence: number | null
          category: string
          color: string | null
          condition: string | null
          created_at: string
          description: string | null
          distinctive_features: string | null
          id: string
          item_number: number
          match_confidence: number | null
          material: string | null
          model: string | null
          name: string
          notes: string | null
          object_confidence: number | null
          project_id: string
          review_notes: string | null
          review_status: string
          subcategory: string | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          brand_confidence?: number | null
          category: string
          color?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          distinctive_features?: string | null
          id?: string
          item_number: number
          match_confidence?: number | null
          material?: string | null
          model?: string | null
          name: string
          notes?: string | null
          object_confidence?: number | null
          project_id: string
          review_notes?: string | null
          review_status?: string
          subcategory?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          brand_confidence?: number | null
          category?: string
          color?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          distinctive_features?: string | null
          id?: string
          item_number?: number
          match_confidence?: number | null
          material?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          object_confidence?: number | null
          project_id?: string
          review_notes?: string | null
          review_status?: string
          subcategory?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      item_detections: {
        Row: {
          created_at: string
          detection_id: string
          id: string
          inventory_item_id: string
        }
        Insert: {
          created_at?: string
          detection_id: string
          id?: string
          inventory_item_id: string
        }
        Update: {
          created_at?: string
          detection_id?: string
          id?: string
          inventory_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_detections_detection_id_fkey"
            columns: ["detection_id"]
            isOneToOne: false
            referencedRelation: "detections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_detections_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      item_images: {
        Row: {
          created_at: string
          display_order: number
          frame_id: string | null
          id: string
          image_url: string
          inventory_item_id: string
          quality_score: number | null
          selected: boolean
          timestamp: number | null
          video_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          frame_id?: string | null
          id?: string
          image_url: string
          inventory_item_id: string
          quality_score?: number | null
          selected?: boolean
          timestamp?: number | null
          video_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          frame_id?: string | null
          id?: string
          image_url?: string
          inventory_item_id?: string
          quality_score?: number | null
          selected?: boolean
          timestamp?: number | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_images_frame_id_fkey"
            columns: ["frame_id"]
            isOneToOne: false
            referencedRelation: "video_frames"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_images_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_images_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      ln_venues: {
        Row: {
          id: number
          url: string | null
          venue_city: string | null
          venue_id: string
          venue_name: string
        }
        Insert: {
          id: number
          url?: string | null
          venue_city?: string | null
          venue_id: string
          venue_name: string
        }
        Update: {
          id?: number
          url?: string | null
          venue_city?: string | null
          venue_id?: string
          venue_name?: string
        }
        Relationships: []
      }
      market_diagnostics: {
        Row: {
          created_at: string | null
          diagnostic_type: string
          event_id: string
          id: string
          notes: string | null
          recommended_action: string | null
        }
        Insert: {
          created_at?: string | null
          diagnostic_type: string
          event_id: string
          id?: string
          notes?: string | null
          recommended_action?: string | null
        }
        Update: {
          created_at?: string | null
          diagnostic_type?: string
          event_id?: string
          id?: string
          notes?: string | null
          recommended_action?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_diagnostics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      media_channels: {
        Row: {
          audience_size: number | null
          budget: number
          channel_type: string
          click_rate: number | null
          conversion_rate: number
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          event_id: string
          id: string
          incrementality_factor: number | null
          open_rate: number | null
          updated_at: string | null
        }
        Insert: {
          audience_size?: number | null
          budget?: number
          channel_type: string
          click_rate?: number | null
          conversion_rate?: number
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          event_id: string
          id?: string
          incrementality_factor?: number | null
          open_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          audience_size?: number | null
          budget?: number
          channel_type?: string
          click_rate?: number | null
          conversion_rate?: number
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          event_id?: string
          id?: string
          incrementality_factor?: number | null
          open_rate?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_channels_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      mind_maps: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      minting_price_configs: {
        Row: {
          config_id: string
          created_at: string | null
          custom_features: Json | null
          is_active: boolean
          price_cents: number
          price_type: string
          standard_features: Json | null
          stripe_price_id: string | null
          ticketcube_id: string
          updated_at: string | null
        }
        Insert: {
          config_id?: string
          created_at?: string | null
          custom_features?: Json | null
          is_active?: boolean
          price_cents?: number
          price_type: string
          standard_features?: Json | null
          stripe_price_id?: string | null
          ticketcube_id: string
          updated_at?: string | null
        }
        Update: {
          config_id?: string
          created_at?: string | null
          custom_features?: Json | null
          is_active?: boolean
          price_cents?: number
          price_type?: string
          standard_features?: Json | null
          stripe_price_id?: string | null
          ticketcube_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "minting_price_configs_ticketcube_id_fkey"
            columns: ["ticketcube_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
        ]
      }
      minting_transactions: {
        Row: {
          artist_revenue_cents: number
          artist_user_id: string
          buyer_user_id: string
          cloned_cube_id: string | null
          completed_at: string | null
          created_at: string | null
          platform_fee_cents: number
          price_cents: number
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          template_id: string
          transaction_id: string
        }
        Insert: {
          artist_revenue_cents?: number
          artist_user_id: string
          buyer_user_id: string
          cloned_cube_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          platform_fee_cents?: number
          price_cents: number
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          template_id: string
          transaction_id?: string
        }
        Update: {
          artist_revenue_cents?: number
          artist_user_id?: string
          buyer_user_id?: string
          cloned_cube_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          platform_fee_cents?: number
          price_cents?: number
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          template_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "minting_transactions_artist_user_id_fkey"
            columns: ["artist_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "minting_transactions_buyer_user_id_fkey"
            columns: ["buyer_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "minting_transactions_cloned_cube_id_fkey"
            columns: ["cloned_cube_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
          {
            foreignKeyName: "minting_transactions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
        ]
      }
      oauth_authorizations: {
        Row: {
          authorization_code: string | null
          authorized_at: string | null
          client_id: string
          code_challenge: string | null
          code_challenge_method: string | null
          code_expires_at: string | null
          code_used: boolean
          created_at: string | null
          expires_at: string | null
          id: string
          is_revoked: boolean
          last_used_at: string | null
          redirect_uri: string | null
          revoked_at: string | null
          scopes: string[]
          user_id: string
        }
        Insert: {
          authorization_code?: string | null
          authorized_at?: string | null
          client_id: string
          code_challenge?: string | null
          code_challenge_method?: string | null
          code_expires_at?: string | null
          code_used?: boolean
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_revoked?: boolean
          last_used_at?: string | null
          redirect_uri?: string | null
          revoked_at?: string | null
          scopes?: string[]
          user_id: string
        }
        Update: {
          authorization_code?: string | null
          authorized_at?: string | null
          client_id?: string
          code_challenge?: string | null
          code_challenge_method?: string | null
          code_expires_at?: string | null
          code_used?: boolean
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_revoked?: boolean
          last_used_at?: string | null
          redirect_uri?: string | null
          revoked_at?: string | null
          scopes?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_authorizations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      oauth_clients: {
        Row: {
          allowed_scopes: string[]
          client_description: string | null
          client_id: string
          client_logo_url: string | null
          client_name: string
          client_secret: string
          created_at: string | null
          id: string
          is_active: boolean
          redirect_uris: string[]
          updated_at: string | null
        }
        Insert: {
          allowed_scopes?: string[]
          client_description?: string | null
          client_id: string
          client_logo_url?: string | null
          client_name: string
          client_secret: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          redirect_uris: string[]
          updated_at?: string | null
        }
        Update: {
          allowed_scopes?: string[]
          client_description?: string | null
          client_id?: string
          client_logo_url?: string | null
          client_name?: string
          client_secret?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          redirect_uris?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      otw_artists: {
        Row: {
          album_buy_url: string | null
          album_date: string | null
          album_img: string | null
          album_title: Json | null
          audio_embed: string | null
          bio: Json | null
          created_at: string | null
          from: Json | null
          hero_buy_url: string | null
          hero_img: string | null
          id: string
          name: Json | null
          offer_msg: Json | null
          on_tour: string | null
          related_artist: Json | null
          sharing_fb: string | null
          sharing_twitter: string | null
          slug: string | null
          sort_order: string | null
          status: string | null
          tile_img: string | null
          tm_id: string | null
          updated_at: string | null
        }
        Insert: {
          album_buy_url?: string | null
          album_date?: string | null
          album_img?: string | null
          album_title?: Json | null
          audio_embed?: string | null
          bio?: Json | null
          created_at?: string | null
          from?: Json | null
          hero_buy_url?: string | null
          hero_img?: string | null
          id?: string
          name?: Json | null
          offer_msg?: Json | null
          on_tour?: string | null
          related_artist?: Json | null
          sharing_fb?: string | null
          sharing_twitter?: string | null
          slug?: string | null
          sort_order?: string | null
          status?: string | null
          tile_img?: string | null
          tm_id?: string | null
          updated_at?: string | null
        }
        Update: {
          album_buy_url?: string | null
          album_date?: string | null
          album_img?: string | null
          album_title?: Json | null
          audio_embed?: string | null
          bio?: Json | null
          created_at?: string | null
          from?: Json | null
          hero_buy_url?: string | null
          hero_img?: string | null
          id?: string
          name?: Json | null
          offer_msg?: Json | null
          on_tour?: string | null
          related_artist?: Json | null
          sharing_fb?: string | null
          sharing_twitter?: string | null
          slug?: string | null
          sort_order?: string | null
          status?: string | null
          tile_img?: string | null
          tm_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      patron_claim_codes: {
        Row: {
          claim_code: string
          claim_code_id: string
          claimed_at: string | null
          claimed_by_user_id: string | null
          client_id: string
          created_at: string | null
          created_by: string | null
          cube_id: string
          expires_at: string | null
          metadata: Json | null
          patron_email: string | null
          patron_name: string | null
          ticket_reference: string | null
        }
        Insert: {
          claim_code: string
          claim_code_id?: string
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          client_id: string
          created_at?: string | null
          created_by?: string | null
          cube_id: string
          expires_at?: string | null
          metadata?: Json | null
          patron_email?: string | null
          patron_name?: string | null
          ticket_reference?: string | null
        }
        Update: {
          claim_code?: string
          claim_code_id?: string
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          cube_id?: string
          expires_at?: string | null
          metadata?: Json | null
          patron_email?: string | null
          patron_name?: string | null
          ticket_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patron_claim_codes_claimed_by_user_id_fkey"
            columns: ["claimed_by_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "patron_claim_codes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "patron_claim_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "patron_claim_codes_cube_id_fkey"
            columns: ["cube_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          points_awarded: number | null
          status: string
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          points_awarded?: number | null
          status: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          points_awarded?: number | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      pending_artist_templates: {
        Row: {
          artist_name: string
          artist_payment_method: string
          artist_upfront_per_cube: number
          clone_price_fan: number
          completed_at: string | null
          created_at: string | null
          custom_features: Json | null
          description: string | null
          event_date: string | null
          event_name: string
          expires_at: string | null
          faces: Json
          fan_fee_model: string
          is_trial: boolean | null
          max_mint_count: number
          metadata: Json | null
          payment_status: string
          pending_id: string
          slug: string
          stripe_price_id: string | null
          stripe_session_id: string | null
          temp_cube_id: string
          update_notification_cost: number
          user_id: string
          venue: string | null
        }
        Insert: {
          artist_name: string
          artist_payment_method: string
          artist_upfront_per_cube?: number
          clone_price_fan?: number
          completed_at?: string | null
          created_at?: string | null
          custom_features?: Json | null
          description?: string | null
          event_date?: string | null
          event_name: string
          expires_at?: string | null
          faces?: Json
          fan_fee_model: string
          is_trial?: boolean | null
          max_mint_count: number
          metadata?: Json | null
          payment_status?: string
          pending_id?: string
          slug: string
          stripe_price_id?: string | null
          stripe_session_id?: string | null
          temp_cube_id: string
          update_notification_cost?: number
          user_id: string
          venue?: string | null
        }
        Update: {
          artist_name?: string
          artist_payment_method?: string
          artist_upfront_per_cube?: number
          clone_price_fan?: number
          completed_at?: string | null
          created_at?: string | null
          custom_features?: Json | null
          description?: string | null
          event_date?: string | null
          event_name?: string
          expires_at?: string | null
          faces?: Json
          fan_fee_model?: string
          is_trial?: boolean | null
          max_mint_count?: number
          metadata?: Json | null
          payment_status?: string
          pending_id?: string
          slug?: string
          stripe_price_id?: string | null
          stripe_session_id?: string | null
          temp_cube_id?: string
          update_notification_cost?: number
          user_id?: string
          venue?: string | null
        }
        Relationships: []
      }
      platform_config: {
        Row: {
          config_key: string
          config_value: string
          description: string | null
          updated_at: string | null
        }
        Insert: {
          config_key: string
          config_value: string
          description?: string | null
          updated_at?: string | null
        }
        Update: {
          config_key?: string
          config_value?: string
          description?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      playlist_tracks: {
        Row: {
          artist_name: string
          created_at: string
          duration_seconds: number
          id: string
          order_position: number
          playlist_id: string
          spotify_url: string | null
          track_title: string
        }
        Insert: {
          artist_name: string
          created_at?: string
          duration_seconds: number
          id?: string
          order_position: number
          playlist_id: string
          spotify_url?: string | null
          track_title: string
        }
        Update: {
          artist_name?: string
          created_at?: string
          duration_seconds?: number
          id?: string
          order_position?: number
          playlist_id?: string
          spotify_url?: string | null
          track_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      points_ledger: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_roadmap_comments: {
        Row: {
          content: string
          created_at: string | null
          id: number
          parent_comment_id: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: number
          parent_comment_id?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: number
          parent_comment_id?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_roadmap_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "product_roadmap_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      project_boards: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      project_columns: {
        Row: {
          board_id: string
          color: string | null
          created_at: string | null
          id: string
          position: number | null
          title: string
        }
        Insert: {
          board_id: string
          color?: string | null
          created_at?: string | null
          id?: string
          position?: number | null
          title: string
        }
        Update: {
          board_id?: string
          color?: string | null
          created_at?: string | null
          id?: string
          position?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_columns_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "project_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assigned_to: string | null
          board_id: string
          column_id: string
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          position: number | null
          priority: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          board_id: string
          column_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number | null
          priority?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          board_id?: string
          column_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number | null
          priority?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "project_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "project_columns"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      scenarios: {
        Row: {
          budget_multiplier: number
          conversion_multiplier: number
          created_at: string | null
          demand_multiplier: number
          event_id: string
          id: string
          notes: string | null
          scenario_name: string
        }
        Insert: {
          budget_multiplier?: number
          conversion_multiplier?: number
          created_at?: string | null
          demand_multiplier?: number
          event_id: string
          id?: string
          notes?: string | null
          scenario_name: string
        }
        Update: {
          budget_multiplier?: number
          conversion_multiplier?: number
          created_at?: string | null
          demand_multiplier?: number
          event_id?: string
          id?: string
          notes?: string | null
          scenario_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_slots: {
        Row: {
          block_name: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          playlist_id: string
          start_time: string
        }
        Insert: {
          block_name: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          playlist_id: string
          start_time: string
        }
        Update: {
          block_name?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          playlist_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_slots_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      search_cache: {
        Row: {
          created_at: string | null
          expires_at: string
          hit_count: number | null
          id: string
          query: string
          results: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          hit_count?: number | null
          id?: string
          query: string
          results: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          hit_count?: number | null
          id?: string
          query?: string
          results?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      seat_assignment_history: {
        Row: {
          action_type: string | null
          assigned_at: string | null
          assigned_by: string | null
          assignment_method: string | null
          batch_id: string | null
          cube_id: string
          history_id: string
          row: string
          seat_id: string
          seat_number: string
          section: string
        }
        Insert: {
          action_type?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_method?: string | null
          batch_id?: string | null
          cube_id: string
          history_id?: string
          row: string
          seat_id: string
          seat_number: string
          section: string
        }
        Update: {
          action_type?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_method?: string | null
          batch_id?: string | null
          cube_id?: string
          history_id?: string
          row?: string
          seat_id?: string
          seat_number?: string
          section?: string
        }
        Relationships: [
          {
            foreignKeyName: "seat_assignment_history_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      stripe_prices: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          member_cat: string
          price_id: string
          product_name: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          member_cat: string
          price_id: string
          product_name: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          member_cat?: string
          price_id?: string
          product_name?: string
        }
        Relationships: []
      }
      stubhub_config: {
        Row: {
          access_token: string | null
          client_id: string
          client_secret: string
          created_at: string | null
          id: string
          is_active: boolean | null
          scope: string | null
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          client_id: string
          client_secret: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          scope?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          client_id?: string
          client_secret?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          scope?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stubhub_event_mappings: {
        Row: {
          created_at: string | null
          event_date: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          performer_name: string | null
          stubhub_event_id: string
          stubhub_listing_url: string
          ticketcube_id: string | null
          ticketmaster_event_id: string | null
          updated_at: string | null
          venue_name: string | null
        }
        Insert: {
          created_at?: string | null
          event_date?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          performer_name?: string | null
          stubhub_event_id: string
          stubhub_listing_url: string
          ticketcube_id?: string | null
          ticketmaster_event_id?: string | null
          updated_at?: string | null
          venue_name?: string | null
        }
        Update: {
          created_at?: string | null
          event_date?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          performer_name?: string | null
          stubhub_event_id?: string
          stubhub_listing_url?: string
          ticketcube_id?: string | null
          ticketmaster_event_id?: string | null
          updated_at?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stubhub_event_mappings_ticketcube_id_fkey"
            columns: ["ticketcube_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
          {
            foreignKeyName: "stubhub_event_mappings_ticketmaster_event_id_fkey"
            columns: ["ticketmaster_event_id"]
            isOneToOne: false
            referencedRelation: "ticketmaster_events"
            referencedColumns: ["id"]
          },
        ]
      }
      stubhub_events: {
        Row: {
          artist_id: string | null
          created_at: string | null
          event_date: string
          event_name: string
          event_time: string | null
          event_url: string | null
          id: string
          is_active: boolean | null
          performer_name: string | null
          primary_event_image: string | null
          primary_venue_image: string | null
          search_keyword: string | null
          stubhub_event_id: string
          updated_at: string | null
          venue_city: string | null
          venue_country: string | null
          venue_name: string | null
          venue_state: string | null
        }
        Insert: {
          artist_id?: string | null
          created_at?: string | null
          event_date: string
          event_name: string
          event_time?: string | null
          event_url?: string | null
          id?: string
          is_active?: boolean | null
          performer_name?: string | null
          primary_event_image?: string | null
          primary_venue_image?: string | null
          search_keyword?: string | null
          stubhub_event_id: string
          updated_at?: string | null
          venue_city?: string | null
          venue_country?: string | null
          venue_name?: string | null
          venue_state?: string | null
        }
        Update: {
          artist_id?: string | null
          created_at?: string | null
          event_date?: string
          event_name?: string
          event_time?: string | null
          event_url?: string | null
          id?: string
          is_active?: boolean | null
          performer_name?: string | null
          primary_event_image?: string | null
          primary_venue_image?: string | null
          search_keyword?: string | null
          stubhub_event_id?: string
          updated_at?: string | null
          venue_city?: string | null
          venue_country?: string | null
          venue_name?: string | null
          venue_state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stubhub_events_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["artist_id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          drop_off_step: number | null
          id: string
          ip_address: unknown
          question_1_answer: string | null
          question_2_answer: string | null
          question_3_answer: string | null
          session_id: string
          started_at: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          drop_off_step?: number | null
          id?: string
          ip_address?: unknown
          question_1_answer?: string | null
          question_2_answer?: string | null
          question_3_answer?: string | null
          session_id: string
          started_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          drop_off_step?: number | null
          id?: string
          ip_address?: unknown
          question_1_answer?: string | null
          question_2_answer?: string | null
          question_3_answer?: string | null
          session_id?: string
          started_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          enable_ai: boolean | null
          id: string
          max_conversation_length: number | null
          openai_api_key: string | null
          openai_model: string | null
          system_prompt: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enable_ai?: boolean | null
          id?: string
          max_conversation_length?: number | null
          openai_api_key?: string | null
          openai_model?: string | null
          system_prompt?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enable_ai?: boolean | null
          id?: string
          max_conversation_length?: number | null
          openai_api_key?: string | null
          openai_model?: string | null
          system_prompt?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tcube_rewards: {
        Row: {
          amount: number
          claimed: boolean | null
          claimed_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          reference_id: string | null
          reward_type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          reference_id?: string | null
          reward_type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          reference_id?: string | null
          reward_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tcube_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tcube_stakes: {
        Row: {
          amount: number
          claimed: boolean | null
          created_at: string | null
          event_id: string | null
          id: string
          reward_amount: number | null
          staked_at: string | null
          unlock_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          claimed?: boolean | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          reward_amount?: number | null
          staked_at?: string | null
          unlock_at: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          claimed?: boolean | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          reward_amount?: number | null
          staked_at?: string | null
          unlock_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tcube_stakes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tcube_transactions: {
        Row: {
          amount: number
          created_at: string | null
          cube_id: string | null
          id: string
          metadata: Json | null
          sui_transaction_hash: string | null
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          cube_id?: string | null
          id?: string
          metadata?: Json | null
          sui_transaction_hash?: string | null
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          cube_id?: string | null
          id?: string
          metadata?: Json | null
          sui_transaction_hash?: string | null
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tcube_transactions_cube_id_fkey"
            columns: ["cube_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
          {
            foreignKeyName: "tcube_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ticketcube_seats: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assignment_method: string | null
          batch_id: string | null
          created_at: string | null
          cube_id: string
          event_date: string | null
          event_time: string | null
          event_title: string | null
          row: string
          seat_id: string
          seat_number: string
          section: string
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_method?: string | null
          batch_id?: string | null
          created_at?: string | null
          cube_id: string
          event_date?: string | null
          event_time?: string | null
          event_title?: string | null
          row: string
          seat_id?: string
          seat_number: string
          section: string
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_method?: string | null
          batch_id?: string | null
          created_at?: string | null
          cube_id?: string
          event_date?: string | null
          event_time?: string | null
          event_title?: string | null
          row?: string
          seat_id?: string
          seat_number?: string
          section?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticketcube_seats_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ticketcube_seats_cube_id_fkey"
            columns: ["cube_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
        ]
      }
      ticketcubes: {
        Row: {
          artist_id: string | null
          artist_name: string | null
          artist_payment_method: string | null
          artist_tier: string | null
          artist_upfront_per_cube: number | null
          client_id: string | null
          clone_price_fan: number | null
          created_at: string | null
          cube_id: string
          cube_type: string
          current_mint_count: number | null
          description: string | null
          distribution_model: string | null
          event_date: string | null
          event_name: string | null
          fan_fee_model: string | null
          glb_url: string | null
          is_active: boolean | null
          is_marketplace_visible: boolean | null
          is_minting_enabled: boolean | null
          is_secured: boolean | null
          is_template: boolean | null
          is_trial_template: boolean | null
          max_free_refreshes: number
          max_mint_count: number | null
          mint_price_artist: number | null
          parent_cube_id: string | null
          payment_model: string | null
          platform_revenue_share: number | null
          premium_features: Json | null
          refresh_count: number
          revenue_recovered: number | null
          revenue_recovered_cents: number | null
          revenue_recovery_target_cents: number | null
          slug: string | null
          stripe_payment_intent_id: string | null
          stripeurl_face: string | null
          tcube_contract_address: string | null
          theme_config: Json | null
          tier: string | null
          title: string
          truetix_deep_link: string | null
          truetix_event_id: string | null
          update_notification_cost: number | null
          updated_at: string | null
          upfront_fee_paid: boolean | null
          upfront_payment_amount_cents: number | null
          upfront_payment_bypassed: boolean | null
          upfront_payment_completed: boolean | null
          upfront_stripe_payment_intent_id: string | null
          user_id: string
          uses_revenue_recovery: boolean | null
          venue: string | null
        }
        Insert: {
          artist_id?: string | null
          artist_name?: string | null
          artist_payment_method?: string | null
          artist_tier?: string | null
          artist_upfront_per_cube?: number | null
          client_id?: string | null
          clone_price_fan?: number | null
          created_at?: string | null
          cube_id?: string
          cube_type: string
          current_mint_count?: number | null
          description?: string | null
          distribution_model?: string | null
          event_date?: string | null
          event_name?: string | null
          fan_fee_model?: string | null
          glb_url?: string | null
          is_active?: boolean | null
          is_marketplace_visible?: boolean | null
          is_minting_enabled?: boolean | null
          is_secured?: boolean | null
          is_template?: boolean | null
          is_trial_template?: boolean | null
          max_free_refreshes?: number
          max_mint_count?: number | null
          mint_price_artist?: number | null
          parent_cube_id?: string | null
          payment_model?: string | null
          platform_revenue_share?: number | null
          premium_features?: Json | null
          refresh_count?: number
          revenue_recovered?: number | null
          revenue_recovered_cents?: number | null
          revenue_recovery_target_cents?: number | null
          slug?: string | null
          stripe_payment_intent_id?: string | null
          stripeurl_face?: string | null
          tcube_contract_address?: string | null
          theme_config?: Json | null
          tier?: string | null
          title: string
          truetix_deep_link?: string | null
          truetix_event_id?: string | null
          update_notification_cost?: number | null
          updated_at?: string | null
          upfront_fee_paid?: boolean | null
          upfront_payment_amount_cents?: number | null
          upfront_payment_bypassed?: boolean | null
          upfront_payment_completed?: boolean | null
          upfront_stripe_payment_intent_id?: string | null
          user_id: string
          uses_revenue_recovery?: boolean | null
          venue?: string | null
        }
        Update: {
          artist_id?: string | null
          artist_name?: string | null
          artist_payment_method?: string | null
          artist_tier?: string | null
          artist_upfront_per_cube?: number | null
          client_id?: string | null
          clone_price_fan?: number | null
          created_at?: string | null
          cube_id?: string
          cube_type?: string
          current_mint_count?: number | null
          description?: string | null
          distribution_model?: string | null
          event_date?: string | null
          event_name?: string | null
          fan_fee_model?: string | null
          glb_url?: string | null
          is_active?: boolean | null
          is_marketplace_visible?: boolean | null
          is_minting_enabled?: boolean | null
          is_secured?: boolean | null
          is_template?: boolean | null
          is_trial_template?: boolean | null
          max_free_refreshes?: number
          max_mint_count?: number | null
          mint_price_artist?: number | null
          parent_cube_id?: string | null
          payment_model?: string | null
          platform_revenue_share?: number | null
          premium_features?: Json | null
          refresh_count?: number
          revenue_recovered?: number | null
          revenue_recovered_cents?: number | null
          revenue_recovery_target_cents?: number | null
          slug?: string | null
          stripe_payment_intent_id?: string | null
          stripeurl_face?: string | null
          tcube_contract_address?: string | null
          theme_config?: Json | null
          tier?: string | null
          title?: string
          truetix_deep_link?: string | null
          truetix_event_id?: string | null
          update_notification_cost?: number | null
          updated_at?: string | null
          upfront_fee_paid?: boolean | null
          upfront_payment_amount_cents?: number | null
          upfront_payment_bypassed?: boolean | null
          upfront_payment_completed?: boolean | null
          upfront_stripe_payment_intent_id?: string | null
          user_id?: string
          uses_revenue_recovery?: boolean | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticketcubes_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["artist_id"]
          },
          {
            foreignKeyName: "ticketcubes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "ticketcubes_parent_cube_id_fkey"
            columns: ["parent_cube_id"]
            isOneToOne: false
            referencedRelation: "ticketcubes"
            referencedColumns: ["cube_id"]
          },
        ]
      }
      ticketmaster_events: {
        Row: {
          all_classifications: Json | null
          artist_id: string | null
          artist_image: string | null
          artist_name: string | null
          artist_videolink: string | null
          attraction_id: string
          classification_family: boolean | null
          classification_primary: boolean | null
          created_at: string | null
          event_date: string
          event_id: string
          event_name: string
          event_time: string | null
          event_url: string | null
          genre_id: string | null
          genre_name: string | null
          id: string
          inventory_last_checked: string | null
          inventory_status: string | null
          inventory_status_detail: string | null
          is_active: boolean | null
          price_currency: string | null
          price_extends_beyond_max: boolean | null
          price_max: number | null
          price_min: number | null
          primary_attraction_image: string | null
          primary_event_image: string | null
          primary_venue_image: string | null
          resale_status: string | null
          resale_status_detail: string | null
          search_keyword: string | null
          segment_id: string | null
          segment_name: string | null
          subgenre_id: string | null
          subgenre_name: string | null
          subtype_id: string | null
          subtype_name: string | null
          type_id: string | null
          type_name: string | null
          updated_at: string | null
          venue_city: string | null
          venue_country: string | null
          venue_name: string | null
          venue_state: string | null
        }
        Insert: {
          all_classifications?: Json | null
          artist_id?: string | null
          artist_image?: string | null
          artist_name?: string | null
          artist_videolink?: string | null
          attraction_id: string
          classification_family?: boolean | null
          classification_primary?: boolean | null
          created_at?: string | null
          event_date: string
          event_id: string
          event_name: string
          event_time?: string | null
          event_url?: string | null
          genre_id?: string | null
          genre_name?: string | null
          id?: string
          inventory_last_checked?: string | null
          inventory_status?: string | null
          inventory_status_detail?: string | null
          is_active?: boolean | null
          price_currency?: string | null
          price_extends_beyond_max?: boolean | null
          price_max?: number | null
          price_min?: number | null
          primary_attraction_image?: string | null
          primary_event_image?: string | null
          primary_venue_image?: string | null
          resale_status?: string | null
          resale_status_detail?: string | null
          search_keyword?: string | null
          segment_id?: string | null
          segment_name?: string | null
          subgenre_id?: string | null
          subgenre_name?: string | null
          subtype_id?: string | null
          subtype_name?: string | null
          type_id?: string | null
          type_name?: string | null
          updated_at?: string | null
          venue_city?: string | null
          venue_country?: string | null
          venue_name?: string | null
          venue_state?: string | null
        }
        Update: {
          all_classifications?: Json | null
          artist_id?: string | null
          artist_image?: string | null
          artist_name?: string | null
          artist_videolink?: string | null
          attraction_id?: string
          classification_family?: boolean | null
          classification_primary?: boolean | null
          created_at?: string | null
          event_date?: string
          event_id?: string
          event_name?: string
          event_time?: string | null
          event_url?: string | null
          genre_id?: string | null
          genre_name?: string | null
          id?: string
          inventory_last_checked?: string | null
          inventory_status?: string | null
          inventory_status_detail?: string | null
          is_active?: boolean | null
          price_currency?: string | null
          price_extends_beyond_max?: boolean | null
          price_max?: number | null
          price_min?: number | null
          primary_attraction_image?: string | null
          primary_event_image?: string | null
          primary_venue_image?: string | null
          resale_status?: string | null
          resale_status_detail?: string | null
          search_keyword?: string | null
          segment_id?: string | null
          segment_name?: string | null
          subgenre_id?: string | null
          subgenre_name?: string | null
          subtype_id?: string | null
          subtype_name?: string | null
          type_id?: string | null
          type_name?: string | null
          updated_at?: string | null
          venue_city?: string | null
          venue_country?: string | null
          venue_name?: string | null
          venue_state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticketmaster_events_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["artist_id"]
          },
        ]
      }
      tts_usage_logs: {
        Row: {
          characters: number
          cost: number
          created_at: string | null
          id: string
          user_id: string | null
          voice: string
        }
        Insert: {
          characters: number
          cost: number
          created_at?: string | null
          id?: string
          user_id?: string | null
          voice: string
        }
        Update: {
          characters?: number
          cost?: number
          created_at?: string | null
          id?: string
          user_id?: string | null
          voice?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          id: string
          total_points: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          total_points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          total_points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          fandragon_id: string | null
          full_name: string | null
          has_used_trial: boolean | null
          is_admin: boolean
          role: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          stripe_subscription_status: string | null
          subscription_ends_at: string | null
          subscription_started_at: string | null
          sui_wallet_address: string | null
          tcube_balance: number | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          fandragon_id?: string | null
          full_name?: string | null
          has_used_trial?: boolean | null
          is_admin?: boolean
          role?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          stripe_subscription_status?: string | null
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          sui_wallet_address?: string | null
          tcube_balance?: number | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          fandragon_id?: string | null
          full_name?: string | null
          has_used_trial?: boolean | null
          is_admin?: boolean
          role?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          stripe_subscription_status?: string | null
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          sui_wallet_address?: string | null
          tcube_balance?: number | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      video_frames: {
        Row: {
          created_at: string
          id: string
          image_url: string
          metadata: Json | null
          timestamp: number
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          metadata?: Json | null
          timestamp: number
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          metadata?: Json | null
          timestamp?: number
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_frames_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string
          duration: number | null
          error_message: string | null
          filename: string
          id: string
          processing_stage: string | null
          processing_status: string
          project_id: string
          storage_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration?: number | null
          error_message?: string | null
          filename: string
          id?: string
          processing_stage?: string | null
          processing_status?: string
          project_id: string
          storage_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration?: number | null
          error_message?: string | null
          filename?: string
          id?: string
          processing_stage?: string | null
          processing_status?: string
          project_id?: string
          storage_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          avail_1: string
          avail_2: string | null
          avail_3: string | null
          created_at: string | null
          id: string
        }
        Insert: {
          avail_1: string
          avail_2?: string | null
          avail_3?: string | null
          created_at?: string | null
          id: string
        }
        Update: {
          avail_1?: string
          avail_2?: string | null
          avail_3?: string | null
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_user_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_artist_revenue_split: {
        Args: { p_fan_payment_amount: number; p_template_id: string }
        Returns: {
          artist_share: number
          platform_share: number
          revenue_recovered: number
        }[]
      }
      claim_cube_with_code: {
        Args: { p_claim_code: string; p_user_id: string }
        Returns: Json
      }
      cleanup_expired_pending_templates: { Args: never; Returns: undefined }
      cleanup_expired_search_cache: { Args: never; Returns: undefined }
      cleanup_expired_sessions: { Args: never; Returns: undefined }
      cleanup_old_conversations: { Args: never; Returns: undefined }
      decrement_mint_count: {
        Args: { template_cube_id: string }
        Returns: boolean
      }
      generate_api_key: { Args: never; Returns: string }
      generate_api_secret: { Args: never; Returns: string }
      generate_claim_code: {
        Args: {
          p_client_id: string
          p_cube_id: string
          p_length?: number
          p_prefix?: string
        }
        Returns: string
      }
      migrate_artists_to_clients: { Args: never; Returns: undefined }
    }
    Enums: {
      action_type: "static" | "link" | "video" | "seating" | "truetickets"
      client_type:
        | "venue"
        | "arts_organization"
        | "promoter"
        | "artist"
        | "ticketing_provider"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      action_type: ["static", "link", "video", "seating", "truetickets"],
      client_type: [
        "venue",
        "arts_organization",
        "promoter",
        "artist",
        "ticketing_provider",
      ],
    },
  },
} as const
