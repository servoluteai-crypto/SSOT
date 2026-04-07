CREATE TABLE review_response_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  venue text NOT NULL DEFAULT 'sole',
  manager text NOT NULL,
  review_text text NOT NULL,
  generated_response text NOT NULL,
  final_response text,
  was_edited boolean,
  edit_distance int,
  copied boolean NOT NULL DEFAULT false,
  not_useful boolean NOT NULL DEFAULT false,
  not_useful_reason text
);

CREATE INDEX idx_review_logs_venue_created ON review_response_logs (venue, created_at DESC);
CREATE INDEX idx_review_logs_manager_created ON review_response_logs (manager, created_at DESC);
