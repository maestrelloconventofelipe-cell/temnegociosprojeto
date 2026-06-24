-- Corrigir funções SECURITY DEFINER:
-- 1. Usar (SELECT auth.uid()) para melhor performance em RLS
-- 2. Fixar search_path para evitar ataques de search_path injection
-- 3. Restringir EXECUTE: revogar de PUBLIC/anon, conceder apenas a authenticated

CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT tenant_id FROM public.usuarios WHERE id = (SELECT auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = (SELECT auth.uid()) AND perfil IN ('admin', 'administrador_matriz')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_tenant_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_my_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
