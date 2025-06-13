-- Update learning_content table to support video-specific content
ALTER TABLE public.learning_content 
ADD COLUMN IF NOT EXISTS video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE;

-- Create index for video_id
CREATE INDEX IF NOT EXISTS idx_learning_content_video_id ON public.learning_content(video_id);

-- Update the table to make either module_id OR video_id required (not both mandatory)
ALTER TABLE public.learning_content 
ALTER COLUMN module_id DROP NOT NULL;

-- Add constraint to ensure either module_id or video_id is provided
ALTER TABLE public.learning_content 
ADD CONSTRAINT check_module_or_video_id 
CHECK (module_id IS NOT NULL OR video_id IS NOT NULL);
