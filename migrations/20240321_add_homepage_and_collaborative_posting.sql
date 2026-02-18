-- Add homepage_url to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS homepage_url TEXT;

-- Migrate data from website to homepage_url
UPDATE profiles SET homepage_url = website WHERE homepage_url IS NULL AND website IS NOT NULL;

-- Create article_authors table
CREATE TABLE IF NOT EXISTS article_authors (
    article_id UUID REFERENCES blogs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor')),
    PRIMARY KEY (article_id, user_id)
);

-- Enable RLS on article_authors
ALTER TABLE article_authors ENABLE ROW LEVEL SECURITY;

-- Policy for article_authors: anyone can read
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read article authors') THEN
        CREATE POLICY "Anyone can read article authors" ON article_authors FOR SELECT USING (true);
    END IF;
END
$$;

-- Policy for article_authors: owners can manage
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners can manage co-authors') THEN
        CREATE POLICY "Owners can manage co-authors" ON article_authors
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM blogs
                WHERE blogs.id = article_authors.article_id
                AND blogs.user_id = auth.uid()
            )
        );
    END IF;
END
$$;

-- Update blogs RLS to allow editors to update
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Editors can update blogs') THEN
        CREATE POLICY "Editors can update blogs" ON blogs
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM article_authors
                WHERE article_authors.article_id = blogs.id
                AND article_authors.user_id = auth.uid()
            )
        );
    END IF;
END
$$;
