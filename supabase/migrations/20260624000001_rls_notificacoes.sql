-- Habilitar RLS na tabela notificacoes com políticas otimizadas
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_veem_proprias_notificacoes"
ON public.notificacoes FOR SELECT TO authenticated
USING (usuario_id = (SELECT auth.uid()));

CREATE POLICY "usuarios_atualizam_proprias_notificacoes"
ON public.notificacoes FOR UPDATE TO authenticated
USING (usuario_id = (SELECT auth.uid()));

CREATE POLICY "usuarios_deletam_proprias_notificacoes"
ON public.notificacoes FOR DELETE TO authenticated
USING (usuario_id = (SELECT auth.uid()));
