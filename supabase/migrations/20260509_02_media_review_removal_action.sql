do $$
begin
  alter type moderation_action_type add value if not exists 'removal';
exception
  when undefined_object then
    create type moderation_action_type as enum ('warning', 'recommendation', 'block', 'removal');
end $$;
