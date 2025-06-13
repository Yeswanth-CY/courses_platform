-- Update database schema to use YouTube URLs instead of Google Drive
-- Rename drive_url column to video_url for clarity

ALTER TABLE public.videos 
RENAME COLUMN drive_url TO video_url;

-- Update existing sample data to use YouTube URLs
UPDATE public.videos 
SET video_url = 'https://www.youtube.com/watch?v=rfscVS0vtbw'
WHERE video_url LIKE '%drive.google.com%';

-- Update summary to reflect YouTube content
UPDATE public.videos 
SET summary = '🎥 Learn ' || topic || ' through this engaging YouTube lesson! Master key concepts with clear explanations and practical examples. 🚀'
WHERE summary IS NOT NULL;

-- Add index for video_url if needed
CREATE INDEX IF NOT EXISTS idx_videos_url ON public.videos(video_url);
