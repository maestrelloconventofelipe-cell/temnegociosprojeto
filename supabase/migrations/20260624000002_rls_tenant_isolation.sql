-- Políticas tenant_isolation para tabelas que estavam com RLS sem políticas
CREATE POLICY "tenant_isolation" ON public.agenda
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON public.documentos
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON public.propostas
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON public.tarefas
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON public.temporadas
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "tenant_isolation" ON public.vistorias
  FOR ALL TO authenticated
  USING (tenant_id = get_my_tenant_id());

-- Corrigir múltiplas políticas permissivas em usuarios (SELECT duplicado)
-- Separar ALL em operações distintas para admin
DROP POLICY IF EXISTS "usuarios_admin_write" ON public.usuarios;

CREATE POLICY "usuarios_admin_insert" ON public.usuarios
  FOR INSERT TO authenticated
  WITH CHECK ((tenant_id = get_my_tenant_id()) AND is_admin());

CREATE POLICY "usuarios_admin_update" ON public.usuarios
  FOR UPDATE TO authenticated
  USING ((tenant_id = get_my_tenant_id()) AND is_admin());

CREATE POLICY "usuarios_admin_delete" ON public.usuarios
  FOR DELETE TO authenticated
  USING ((tenant_id = get_my_tenant_id()) AND is_admin());
