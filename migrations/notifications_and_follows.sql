-- 1. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'follow', 'like', 'comment', 'collection_add', 'ai_edit', 'mention', 'system'
    target_id UUID, -- blog_id, comment_id, collection_id, etc.
    target_type TEXT, -- 'blog', 'comment', 'collection', 'profile', etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Enable Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 2. Follower counts in profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- 3. Functions to sync counts
CREATE OR REPLACE FUNCTION public.sync_user_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
        UPDATE public.profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
        UPDATE public.profiles SET follower_count = follower_count - 1 WHERE id = OLD.following_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_change ON public.user_follows;
CREATE TRIGGER on_follow_change
AFTER INSERT OR DELETE ON public.user_follows
FOR EACH ROW EXECUTE PROCEDURE public.sync_user_follow_counts();

-- 4. Notification triggers

-- Follow Notification
CREATE OR REPLACE FUNCTION public.on_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, actor_id, type, target_id, target_type)
    VALUES (NEW.following_id, NEW.follower_id, 'follow', NEW.following_id, 'profile');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_notification_trigger ON public.user_follows;
CREATE TRIGGER on_follow_notification_trigger
AFTER INSERT ON public.user_follows
FOR EACH ROW EXECUTE PROCEDURE public.on_follow_notification();

-- Like Notification
CREATE OR REPLACE FUNCTION public.on_like_notification()
RETURNS TRIGGER AS $$
DECLARE
    blog_owner_id UUID;
BEGIN
    SELECT user_id INTO blog_owner_id FROM public.blogs WHERE id = NEW.blog_id;
    IF blog_owner_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, target_id, target_type)
        VALUES (blog_owner_id, NEW.user_id, 'like', NEW.blog_id, 'blog');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_notification_trigger ON public.likes;
CREATE TRIGGER on_like_notification_trigger
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE PROCEDURE public.on_like_notification();

-- Comment Notification
CREATE OR REPLACE FUNCTION public.on_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    blog_owner_id UUID;
    parent_comment_owner_id UUID;
BEGIN
    SELECT user_id INTO blog_owner_id FROM public.blogs WHERE id = NEW.blog_id;

    -- Notify blog owner
    IF blog_owner_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, target_id, target_type)
        VALUES (blog_owner_id, NEW.user_id, 'comment', NEW.blog_id, 'blog');
    END IF;

    -- Notify parent comment owner if it's a reply
    IF NEW.parent_id IS NOT NULL THEN
        SELECT user_id INTO parent_comment_owner_id FROM public.comments WHERE id = NEW.parent_id;
        IF parent_comment_owner_id IS NOT NULL AND parent_comment_owner_id != NEW.user_id AND parent_comment_owner_id != blog_owner_id THEN
            INSERT INTO public.notifications (user_id, actor_id, type, target_id, target_type)
            VALUES (parent_comment_owner_id, NEW.user_id, 'comment', NEW.blog_id, 'blog');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_notification_trigger ON public.comments;
CREATE TRIGGER on_comment_notification_trigger
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE PROCEDURE public.on_comment_notification();

-- Collection Add Notification
CREATE OR REPLACE FUNCTION public.on_collection_add_notification()
RETURNS TRIGGER AS $$
DECLARE
    blog_owner_id UUID;
    collection_owner_id UUID;
BEGIN
    SELECT user_id INTO blog_owner_id FROM public.blogs WHERE id = NEW.blog_id;
    SELECT user_id INTO collection_owner_id FROM public.collections WHERE id = NEW.collection_id;

    IF blog_owner_id != collection_owner_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, target_id, target_type)
        VALUES (blog_owner_id, collection_owner_id, 'collection_add', NEW.collection_id, 'collection');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_collection_add_notification_trigger ON public.collection_items;
CREATE TRIGGER on_collection_add_notification_trigger
AFTER INSERT ON public.collection_items
FOR EACH ROW EXECUTE PROCEDURE public.on_collection_add_notification();

-- Mention Notification parsing
CREATE OR REPLACE FUNCTION public.parse_mentions_and_notify()
RETURNS TRIGGER AS $$
DECLARE
    mention_username TEXT;
    mentioned_user_id UUID;
BEGIN
    FOR mention_username IN
        SELECT DISTINCT (regexp_matches(NEW.content, '@([a-zA-Z0-9_]+)', 'g'))[1]
    LOOP
        SELECT id INTO mentioned_user_id FROM public.profiles WHERE name = mention_username;

        IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.user_id THEN
            -- Check if notification already exists to avoid duplicates if someone is mentioned twice
            IF NOT EXISTS (
                SELECT 1 FROM public.notifications
                WHERE user_id = mentioned_user_id
                  AND actor_id = NEW.user_id
                  AND type = 'mention'
                  AND target_id = NEW.blog_id
            ) THEN
                INSERT INTO public.notifications (user_id, actor_id, type, target_id, target_type)
                VALUES (mentioned_user_id, NEW.user_id, 'mention', NEW.blog_id, 'blog');
            END IF;
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_mention_trigger ON public.comments;
CREATE TRIGGER on_comment_mention_trigger
AFTER INSERT OR UPDATE ON public.comments
FOR EACH ROW EXECUTE PROCEDURE public.parse_mentions_and_notify();

DROP TRIGGER IF EXISTS on_blog_mention_trigger ON public.blogs;
CREATE TRIGGER on_blog_mention_trigger
AFTER INSERT OR UPDATE ON public.blogs
FOR EACH ROW EXECUTE PROCEDURE public.parse_mentions_and_notify();

-- 5. Cleanup triggers
-- Remove notification when unliked
CREATE OR REPLACE FUNCTION public.on_like_removed_notification()
RETURNS TRIGGER AS $$
DECLARE
    blog_owner_id UUID;
BEGIN
    SELECT user_id INTO blog_owner_id FROM public.blogs WHERE id = OLD.blog_id;
    DELETE FROM public.notifications
    WHERE user_id = blog_owner_id
      AND actor_id = OLD.user_id
      AND type = 'like'
      AND target_id = OLD.blog_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_removed_notification_trigger ON public.likes;
CREATE TRIGGER on_like_removed_notification_trigger
AFTER DELETE ON public.likes
FOR EACH ROW EXECUTE PROCEDURE public.on_like_removed_notification();

-- Remove notification when unfollowed
CREATE OR REPLACE FUNCTION public.on_follow_removed_notification()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.notifications
    WHERE user_id = OLD.following_id
      AND actor_id = OLD.follower_id
      AND type = 'follow';
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_removed_notification_trigger ON public.user_follows;
CREATE TRIGGER on_follow_removed_notification_trigger
AFTER DELETE ON public.user_follows
FOR EACH ROW EXECUTE PROCEDURE public.on_follow_removed_notification();

-- 6. Initialize counts for existing data
UPDATE public.profiles p
SET
    follower_count = (SELECT count(*) FROM public.user_follows WHERE following_id = p.id),
    following_count = (SELECT count(*) FROM public.user_follows WHERE follower_id = p.id);
