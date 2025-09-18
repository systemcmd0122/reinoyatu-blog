create or replace function get_tags_with_counts()
returns table (name text, count bigint) as $$
begin
  return query
  select
    t.name,
    count(bt.blog_id)
  from tags as t
  join blog_tags as bt on t.id = bt.tag_id
  group by t.name
  order by count desc;
end; 
$$ language plpgsql; 
