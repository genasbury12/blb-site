-- Migration 1300: link each Elite client's Claude board (I-54, owner decision 2026-11-03, option 1).
--
-- Day to day collaboration (tasks, roadmap, files, notes) moves to a Claude artifact board per client. The portal
-- keeps what must be enforced: payment linked access, the DFY hours ledger, weekly check-ins before calls, private
-- sessions and implementation requests. The portal stores only the board link and shows it to that client.
-- Existing elite_items and elite_files rows are kept (nothing is deleted); the pages just stop showing them.

alter table public.elite_boards
  add column claude_board_url text
  check (claude_board_url is null or claude_board_url ~ '^https://claude\.ai/[A-Za-z0-9._~/?#&=%-]+$');

-- Board staff (admin, the board's coach, or the client's assigned coach) set or clear the link. A function rather
-- than an UPDATE policy so a coach can change this one column and nothing else on the board row. Every change is
-- written to the append only admin audit log.
create or replace function public.staff_set_claude_board(p_board uuid, p_url text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text := nullif(btrim(coalesce(p_url, '')), '');
begin
  if not app.board_staff(p_board) then
    raise exception 'Not permitted' using errcode = '42501';
  end if;
  if v_url is not null and v_url !~ '^https://claude\.ai/[A-Za-z0-9._~/?#&=%-]+$' then
    raise exception 'Use the board''s claude.ai link (it starts with https://claude.ai/).' using errcode = '22023';
  end if;
  update public.elite_boards set claude_board_url = v_url where id = p_board;
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, changed_fields)
  values (auth.uid(), case when v_url is null then 'elite_board.claude_link_removed' else 'elite_board.claude_link_set' end,
          'elite_board', p_board::text, jsonb_build_object('claude_board_url', v_url));
end;
$$;
revoke execute on function public.staff_set_claude_board(uuid, text) from public, anon;
grant execute on function public.staff_set_claude_board(uuid, text) to authenticated, service_role;
