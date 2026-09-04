CREATE TABLE public.custom_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id text NOT NULL,
  subject_id text NOT NULL,
  unit_index integer NOT NULL DEFAULT 0,
  kind text NOT NULL DEFAULT 'select',
  prompt text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  answer_index integer NOT NULL DEFAULT 0,
  answer_text text,
  answer_bool boolean,
  explanation text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_activities TO authenticated;
GRANT SELECT ON public.custom_activities TO anon;
GRANT ALL ON public.custom_activities TO service_role;

ALTER TABLE public.custom_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read activities" ON public.custom_activities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated can create activities" ON public.custom_activities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update activities" ON public.custom_activities FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete activities" ON public.custom_activities FOR DELETE TO authenticated USING (true);

CREATE INDEX custom_activities_lookup_idx ON public.custom_activities (grade_id, subject_id, unit_index);

CREATE TRIGGER custom_activities_updated_at
BEFORE UPDATE ON public.custom_activities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();