export interface Database {
  public: {
    Tables: {
      videos: {
        Row: {
          id: string
          title: string
          course: string
          topic: string
          drive_url: string
          summary: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          course: string
          topic: string
          drive_url: string
          summary?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          course?: string
          topic?: string
          drive_url?: string
          summary?: string | null
          updated_at?: string
        }
      }
      learning_content: {
        Row: {
          id: string
          video_id: string
          content: any
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          content: any
          created_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          content?: any
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          video_id: string
          xp_earned: number
          quiz_score: number | null
          challenge_completed: boolean
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_id: string
          xp_earned?: number
          quiz_score?: number | null
          challenge_completed?: boolean
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_id?: string
          xp_earned?: number
          quiz_score?: number | null
          challenge_completed?: boolean
        }
      }
    }
  }
}
