-- PROFILES
CREATE TABLE public.profiles (
  user_id uuid NOT NULL PRIMARY KEY,
  username text NOT NULL,
  display_name text NOT NULL,
  grade_id text,
  xp integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_username_format CHECK (username ~ '^[a-z0-9._]{3,20}$')
);
CREATE UNIQUE INDEX profiles_username_key ON public.profiles (lower(username));

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can search profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FRIENDSHIPS
CREATE TABLE public.friendships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid NOT NULL,
  addressee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT friendships_status_check CHECK (status IN ('pending','accepted')),
  CONSTRAINT friendships_not_self CHECK (requester_id <> addressee_id),
  CONSTRAINT friendships_unique_pair UNIQUE (requester_id, addressee_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read friendships" ON public.friendships
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());
CREATE POLICY "Users can request friendship" ON public.friendships
  FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Participants can update friendship" ON public.friendships
  FOR UPDATE TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid())
  WITH CHECK (requester_id = auth.uid() OR addressee_id = auth.uid());
CREATE POLICY "Participants can delete friendship" ON public.friendships
  FOR DELETE TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BATTLES
CREATE TABLE public.battles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id uuid NOT NULL,
  opponent_id uuid NOT NULL,
  subject_id text NOT NULL DEFAULT 'matematica',
  grade_id text NOT NULL DEFAULT 'f5a',
  seed integer NOT NULL DEFAULT 1,
  question_count integer NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'pending',
  challenger_score integer NOT NULL DEFAULT 0,
  opponent_score integer NOT NULL DEFAULT 0,
  challenger_finished boolean NOT NULL DEFAULT false,
  opponent_finished boolean NOT NULL DEFAULT false,
  winner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT battles_status_check CHECK (status IN ('pending','active','finished','declined')),
  CONSTRAINT battles_not_self CHECK (challenger_id <> opponent_id)
);

CREATE INDEX battles_challenger_idx ON public.battles (challenger_id, created_at DESC);
CREATE INDEX battles_opponent_idx ON public.battles (opponent_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.battles TO authenticated;
GRANT ALL ON public.battles TO service_role;
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read battles" ON public.battles
  FOR SELECT TO authenticated
  USING (challenger_id = auth.uid() OR opponent_id = auth.uid());
CREATE POLICY "Challenger can create battle" ON public.battles
  FOR INSERT TO authenticated WITH CHECK (challenger_id = auth.uid());
CREATE POLICY "Participants can update battle" ON public.battles
  FOR UPDATE TO authenticated
  USING (challenger_id = auth.uid() OR opponent_id = auth.uid())
  WITH CHECK (challenger_id = auth.uid() OR opponent_id = auth.uid());

CREATE TRIGGER update_battles_updated_at BEFORE UPDATE ON public.battles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
