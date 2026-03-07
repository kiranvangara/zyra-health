-- Multi-Dimensional Reviews: Add review_responses table
-- Each review has 3 emoji-based responses from a pool of 8 questions

CREATE TABLE IF NOT EXISTS public.review_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  question_key TEXT NOT NULL,
  score INTEGER CHECK (score >= 1 AND score <= 5) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for aggregating scores per doctor per question
CREATE INDEX IF NOT EXISTS idx_review_responses_review_id ON public.review_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_question_key ON public.review_responses(question_key);

-- Enable RLS
ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;

-- Public can read responses for approved reviews
CREATE POLICY "Public can view review responses"
  ON public.review_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews
      WHERE reviews.id = review_responses.review_id
      AND reviews.is_approved = true
    )
  );

-- Patients can insert their own responses (via the review they created)
CREATE POLICY "Patients can insert review responses"
  ON public.review_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews
      WHERE reviews.id = review_responses.review_id
      AND reviews.patient_id = auth.uid()
    )
  );
