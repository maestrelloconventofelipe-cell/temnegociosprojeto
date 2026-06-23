import { useState, useEffect, useRef, useCallback } from 'react'
import { Bot, X, Send, Sparkles, RotateCcw, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const BOT_NAME = 'TN Assistente'

const KB = [
  {
    tags: ['dashboard','painel','inicio','início','home','visão geral','kpi','gráfico'],
    rota: '/dashboard',
    resposta: `O **Dashboard** é sua central de controle! 📊\n\nO que você encontra lá:\n• KPIs em tempo real (imóveis, clientes, propostas abertas)\n• Funil de vendas interativo\n• Gráficos de receitas vs despesas\n• Tarefas do dia e próximos compromissos da agenda\n• Ranking de top corretores\n\n💡 Todos os cards são clicáveis e te levam direto ao módulo.`,
  },
  {
    tags: ['imóvel','imovel','imóveis','imoveis','cadastrar imóvel','propriedade','foto','fotos','área','area'],
    rota: '/imoveis',
    resposta: `O módulo de **Imóveis** permite gerenciar todo seu portfólio! 🏠\n\nPrincipais funções:\n• Cadastrar imóveis com fotos, valores e características completas\n• Filtrar por tipo (casa, apartamento...), finalidade (Venda/Aluguel) e status\n• Vincular corretor e captador responsáveis\n• Marcar imóveis como destaque\n• Upload de múltiplas fotos\n\nPara cadastrar: clique em **"Novo Imóvel"** no canto superior direito da tela.`,
  },
  {
    tags: ['cliente','clientes','lead','comprador','vendedor','locatário','locador','cadastrar cliente'],
    rota: '/clientes',
    resposta: `O módulo de **Clientes** centraliza seus contatos! 👥\n\nO que você pode fazer:\n• Cadastrar compradores, vendedores, locatários e locadores\n• Registrar CPF, telefone, e-mail e endereço\n• Adicionar observações e acompanhar o status do cliente\n• Buscar por nome, e-mail ou CPF rapidamente\n\nPara adicionar um cliente: clique em **"Novo Cliente"** na tela de Clientes.`,
  },
  {
    tags: ['proposta','propostas','negociação','negociacao','oferta','aprovar proposta','recusar proposta'],
    rota: '/propostas',
    resposta: `O módulo de **Propostas** gerencia suas negociações! 📋\n\nFuncionalidades:\n• Criar propostas vinculando imóvel, cliente e corretor\n• Registrar valor ofertado e condições de pagamento\n• Aprovar ou recusar propostas\n• Acompanhar o status (aberta → aprovada → contrato)\n• Receber notificação automática ao criar ou alterar status\n\nUma proposta aprovada pode ser convertida em contrato diretamente.`,
  },
  {
    tags: ['contrato','contratos','assinatura','vigência','vigencia','locação','locacao','venda'],
    rota: '/contratos',
    resposta: `O módulo de **Contratos** formaliza seus negócios! 📝\n\nVocê pode:\n• Criar contratos de venda ou locação\n• Definir datas de início, fim e valor mensal\n• Acompanhar contratos ativos, encerrados e próximos do vencimento\n• Vincular ao imóvel, cliente, corretor e proposta de origem\n\n⚠️ Acesso restrito a administradores e jurídico.`,
  },
  {
    tags: ['agenda','agendamento','compromisso','visita','reunião','reuniao','evento','lembrete'],
    rota: '/agenda',
    resposta: `A **Agenda** organiza seus compromissos! 📅\n\nFunções disponíveis:\n• Criar eventos (visitas, reuniões, ligações, vencimentos)\n• Definir data, hora, local e participantes\n• Receber notificação automática ao criar novo evento\n• Visualizar compromissos por dia no dashboard\n\nPara criar: clique em **"Novo Evento"** na tela de Agenda.`,
  },
  {
    tags: ['tarefa','tarefas','to do','afazer','a fazer','pendência','pendencia','responsável','responsavel'],
    rota: '/tarefas',
    resposta: `O módulo de **Tarefas** mantém sua equipe organizada! ✅\n\nComo funciona:\n• Crie tarefas com título, descrição, prioridade e responsável\n• Defina data de vencimento\n• Atualize o status: pendente → em andamento → concluída\n• O responsável recebe notificação ao ser atribuído\n• Ao concluir, o criador da tarefa é notificado automaticamente\n\nPrioridades: baixa, média, alta e urgente.`,
  },
  {
    tags: ['financeiro','finança','financas','finanças','receita','despesa','fluxo','caixa','pagamento'],
    rota: '/financeiro',
    resposta: `O módulo **Financeiro** controla seu fluxo de caixa! 💰\n\nRecursos:\n• Registrar receitas e despesas\n• Categorizar lançamentos (aluguel, comissão, manutenção...)\n• Definir status: pendente, pago, vencido\n• Visualizar gráficos de receitas vs despesas\n• Relatório de fluxo mensal\n\n⚠️ Acesso restrito a administradores e financeiro.`,
  },
  {
    tags: ['comissão','comissao','comissões','comissoes','corretor','percentual','ganho'],
    rota: '/comissoes',
    resposta: `O módulo de **Comissões** controla os ganhos da equipe! 🏆\n\nFunções:\n• Registrar comissões por venda ou locação\n• Vincular ao corretor responsável e ao contrato\n• Definir percentual e valor calculado\n• Acompanhar status do pagamento (pendente / pago)\n• Relatório por corretor e período`,
  },
  {
    tags: ['vistoria','vistorias','inspeção','inspecao','laudo','estado do imóvel'],
    rota: '/vistorias',
    resposta: `O módulo de **Vistorias** registra o estado dos imóveis! 🔍\n\nVocê pode:\n• Criar laudos de entrada e saída\n• Descrever o estado de cada cômodo\n• Anexar observações e fotos\n• Vincular ao imóvel e ao contrato\n\nEssencial para locações — protege tanto o proprietário quanto o inquilino.`,
  },
  {
    tags: ['temporada','temporadas','aluguel temporada','curta duração','airbnb','diária','diaria'],
    rota: '/temporadas',
    resposta: `O módulo de **Temporadas** gerencia aluguéis de curta duração! 🌴\n\nRecursos:\n• Registrar reservas por período (diárias)\n• Controlar disponibilidade do imóvel\n• Definir valor por diária e desconto por período\n• Acompanhar status da reserva`,
  },
  {
    tags: ['documento','documentos','arquivo','contrato pdf','pasta'],
    rota: '/documentos',
    resposta: `O módulo de **Documentos** centraliza seus arquivos! 📁\n\nFunções:\n• Upload e organização de documentos por categoria\n• Associar documentos a imóveis, clientes ou contratos\n• Controle de versões e datas\n• Acesso rápido de qualquer módulo do sistema`,
  },
  {
    tags: ['relatório','relatorio','relatórios','relatorios','métricas','metricas','exportar','análise','analise'],
    rota: '/relatorios',
    resposta: `O módulo de **Relatórios** oferece visão estratégica! 📈\n\nDisponível para administradores:\n• Desempenho de corretores\n• Imóveis mais visitados\n• Conversão proposta → contrato\n• Receitas e despesas por período\n• Exportação de dados\n\nAcesse pelo menu lateral em **"Relatórios"**.`,
  },
  {
    tags: ['franquia','franquias','filial','unidade','rede'],
    rota: '/franquias',
    resposta: `O módulo de **Franquias** gerencia a rede de unidades! 🏢\n\nFunções (somente administradores):\n• Cadastrar e editar franquias\n• Configurar cidade, estado e responsável\n• Cada franquia tem seus próprios dados isolados (multi-tenancy)\n\nOs dados de cada unidade são completamente separados por segurança.`,
  },
  {
    tags: ['usuário','usuario','usuários','usuarios','equipe','colaborador','acesso','permissão','permissao','senha','role'],
    rota: '/usuarios',
    resposta: `O módulo **Equipe** gerencia os acessos ao sistema! 👤\n\nFunções (somente administradores):\n• Cadastrar usuários e definir perfis de acesso\n• Perfis disponíveis: administrador, diretor, franqueado, corretor, captador, financeiro, jurídico, administrativo, auditor\n• Ativar e desativar usuários\n• Redefinir senhas\n\nCada perfil tem acesso apenas aos módulos permitidos.`,
  },
  {
    tags: ['configuração','configuracao','configurações','configuracoes','sistema','preferência','preferencia'],
    rota: '/configuracoes',
    resposta: `Em **Configurações** você personaliza o sistema! ⚙️\n\nOpções disponíveis:\n• Dados da franquia (nome, endereço, logo)\n• Configurações de notificações\n• Preferências do sistema\n\n⚠️ Acesso restrito a administradores.`,
  },
  {
    tags: ['notificação','notificacao','notificações','notificacoes','alerta','sino','aviso'],
    resposta: `As **Notificações** te mantêm sempre atualizado! 🔔\n\nVocê recebe alertas automáticos quando:\n• Um novo imóvel é cadastrado\n• Uma proposta é criada ou tem status alterado\n• Uma tarefa é atribuída a você\n• Um evento é adicionado à agenda\n• Um novo cliente é cadastrado\n\nClique no sino no topo direito para ver todas. É possível marcar como lida ou remover individualmente.`,
  },
  {
    tags: ['perfil','meu perfil','conta','minha conta','nome','email','foto perfil'],
    rota: '/perfil',
    resposta: `Em **Meu Perfil** você gerencia seus dados pessoais! 👤\n\nVocê pode:\n• Atualizar nome e e-mail\n• Alterar sua senha\n• Ver suas informações de acesso\n\nAcesse clicando no avatar no canto superior direito da tela.`,
  },
  {
    tags: ['sair','logout','deslogar','desconectar','encerrar sessão','encerrar sessao'],
    resposta: `Para **sair do sistema**, clique em **"Sair da Conta"** no rodapé do menu lateral esquerdo. 🚪\n\nSua sessão será encerrada com segurança. Para voltar, basta fazer login novamente com suas credenciais.`,
  },
  {
    tags: ['modo escuro','tema escuro','dark mode','claro','dark','tema'],
    resposta: `Para alternar entre **modo claro e escuro**, clique no ícone de lua 🌙 (ou sol ☀️) na barra superior direita.\n\nSua preferência é salva automaticamente no navegador.`,
  },
  {
    tags: ['busca','pesquisa','pesquisar','buscar','procurar','encontrar'],
    resposta: `A **busca global** fica na barra superior da tela! 🔍\n\nDigite o nome de um imóvel, cliente ou qualquer informação para localizar rapidamente. A busca funciona em tempo real enquanto você digita.`,
  },
]

const TOPICOS_RAPIDOS = [
  { label: '🏠 Como cadastrar um imóvel?',    query: 'como cadastrar imovel' },
  { label: '👥 Como adicionar um cliente?',   query: 'como cadastrar cliente' },
  { label: '📋 Como criar uma proposta?',      query: 'como criar proposta' },
  { label: '📅 Como usar a agenda?',           query: 'como usar agenda' },
  { label: '💰 Como funciona o financeiro?',  query: 'como funciona financeiro' },
  { label: '🔔 Como funcionam as notificações?', query: 'notificacoes' },
]

function buscarResposta(texto) {
  const t = texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const scores = KB.map(item => {
    const hits = item.tags.filter(tag =>
      t.includes(tag.normalize('NFD').replace(/[̀-ͯ]/g, ''))
    ).length
    return { item, hits }
  }).filter(x => x.hits > 0).sort((a, b) => b.hits - a.hits)

  if (scores.length === 0) return null
  return scores[0].item
}

function formatarMensagem(texto) {
  return texto
    .split('\n')
    .map((linha, i) => {
      const bold = linha.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      if (linha.startsWith('•')) return `<div key=${i} style="margin-left:4px">${bold}</div>`
      if (linha.startsWith('⚠️') || linha.startsWith('💡') || linha.startsWith('💡')) {
        return `<div key=${i} style="margin-top:6px">${bold}</div>`
      }
      return `<div key=${i}>${bold}</div>`
    })
    .join('')
}

export default function ChatBot() {
  const [aberto, setAberto]     = useState(false)
  const [mensagens, setMensagens] = useState([])
  const [input, setInput]       = useState('')
  const [digitando, setDigitando] = useState(false)
  const [novas, setNovas]       = useState(false)
  const listaRef  = useRef(null)
  const inputRef  = useRef(null)
  const navigate  = useNavigate()

  useEffect(() => {
    if (aberto && mensagens.length === 0) {
      setTimeout(() => adicionarBot(
        `Olá! 👋 Sou o **TN Assistente**, estou aqui para te ajudar a usar o sistema da Tem Negócios.\n\nEscolha um tópico abaixo ou me faça uma pergunta sobre qualquer funcionalidade!`
      ), 300)
    }
    if (aberto) { setNovas(false); setTimeout(() => inputRef.current?.focus(), 200) }
  }, [aberto])

  useEffect(() => {
    if (listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight
    }
  }, [mensagens, digitando])

  function adicionarBot(texto, rota) {
    setMensagens(prev => [...prev, { de: 'bot', texto, rota, ts: Date.now() }])
  }

  function adicionarUser(texto) {
    setMensagens(prev => [...prev, { de: 'user', texto, ts: Date.now() }])
  }

  const responder = useCallback((texto) => {
    adicionarUser(texto)
    setDigitando(true)
    setTimeout(() => {
      setDigitando(false)
      const resultado = buscarResposta(texto)
      if (resultado) {
        adicionarBot(resultado.resposta, resultado.rota)
      } else {
        adicionarBot(
          `Não encontrei uma resposta específica para isso. 🤔\n\nTente perguntar sobre:\n• Imóveis, Clientes, Propostas\n• Contratos, Agenda, Tarefas\n• Financeiro, Relatórios, Notificações\n\nOu clique em um dos tópicos abaixo!`
        )
      }
    }, 900)
  }, [])

  function enviar() {
    const txt = input.trim()
    if (!txt) return
    setInput('')
    responder(txt)
  }

  function reiniciar() {
    setMensagens([])
    setTimeout(() => adicionarBot(
      `Conversa reiniciada! 😊 Como posso te ajudar?\n\nEscolha um tópico ou faça sua pergunta.`
    ), 200)
  }

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setAberto(!aberto)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg,#4f46e5,#2563eb)',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(79,70,229,0.5)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.boxShadow='0 6px 24px rgba(79,70,229,0.6)' }}
        onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(79,70,229,0.5)' }}
        title="TN Assistente"
      >
        {aberto ? <X size={22} color="white" /> : <Bot size={24} color="white" />}
        {novas && !aberto && (
          <span style={{
            position:'absolute', top:'2px', right:'2px', width:'12px', height:'12px',
            background:'#ef4444', borderRadius:'50%', border:'2px solid white',
          }} />
        )}
      </button>

      {/* Pulso decorativo */}
      {!aberto && (
        <span style={{
          position:'fixed', bottom:'24px', right:'24px', zIndex:9998,
          width:'56px', height:'56px', borderRadius:'50%',
          background:'rgba(79,70,229,0.25)', animation:'pulse-ring 2s ease-out infinite',
        }} />
      )}

      {/* Janela do chat */}
      {aberto && (
        <div style={{
          position: 'fixed', bottom: '90px', right: '24px', zIndex: 9998,
          width: '360px', height: '520px',
          background: 'white', borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'slide-up 0.25s ease',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg,#4f46e5,#2563eb)',
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <div style={{
              width: '36px', height: '36px', background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Bot size={18} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.88rem' }}>{BOT_NAME}</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%', display: 'inline-block' }} />
                Online agora
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={reiniciar} title="Reiniciar conversa"
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'white', display: 'flex' }}>
                <RotateCcw size={14} />
              </button>
              <button onClick={() => setAberto(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'white', display: 'flex' }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Mensagens */}
          <div ref={listaRef} style={{
            flex: 1, overflowY: 'auto', padding: '14px', display: 'flex',
            flexDirection: 'column', gap: '10px', background: '#f8fafc',
          }}>
            {mensagens.map((m, i) => (
              <div key={m.ts + i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.de === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.de === 'bot' && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                    <div style={{ width: '26px', height: '26px', background: 'linear-gradient(135deg,#4f46e5,#2563eb)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Sparkles size={12} color="white" />
                    </div>
                    <div style={{
                      background: 'white', borderRadius: '14px 14px 14px 2px',
                      padding: '10px 13px', maxWidth: '270px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
                      fontSize: '0.8rem', color: '#1e293b', lineHeight: 1.55,
                    }}
                      dangerouslySetInnerHTML={{ __html: formatarMensagem(m.texto) }}
                    />
                  </div>
                )}
                {m.de === 'user' && (
                  <div style={{
                    background: 'linear-gradient(135deg,#4f46e5,#2563eb)', borderRadius: '14px 14px 2px 14px',
                    padding: '10px 13px', maxWidth: '240px',
                    fontSize: '0.8rem', color: 'white', lineHeight: 1.5,
                  }}>
                    {m.texto}
                  </div>
                )}
                {m.de === 'bot' && m.rota && (
                  <button onClick={() => { navigate(m.rota); setAberto(false) }}
                    style={{
                      marginLeft: '32px', marginTop: '5px', background: 'none',
                      border: '1px solid #4f46e5', borderRadius: '8px', padding: '5px 10px',
                      color: '#4f46e5', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                    Ir para o módulo <ChevronRight size={12} />
                  </button>
                )}
              </div>
            ))}

            {/* Digitando */}
            {digitando && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                <div style={{ width: '26px', height: '26px', background: 'linear-gradient(135deg,#4f46e5,#2563eb)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={12} color="white" />
                </div>
                <div style={{ background: 'white', borderRadius: '14px 14px 14px 2px', padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[0, 1, 2].map(n => (
                    <span key={n} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#a5b4fc', animation: `bounce 1.2s ease-in-out ${n * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Tópicos rápidos — só quando sem mensagens do usuário ainda */}
            {mensagens.length <= 1 && !digitando && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tópicos rápidos</span>
                {TOPICOS_RAPIDOS.map(t => (
                  <button key={t.query} onClick={() => responder(t.query)}
                    style={{
                      background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px',
                      padding: '8px 12px', textAlign: 'left', cursor: 'pointer',
                      fontSize: '0.77rem', color: '#334155', fontWeight: 500,
                      transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='#4f46e5'; e.currentTarget.style.background='#f5f3ff' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='white' }}
                  >
                    {t.label} <ChevronRight size={12} color="#94a3b8" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding: '12px', borderTop: '1px solid #e2e8f0', background: 'white',
            display: 'flex', gap: '8px', alignItems: 'center',
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
              placeholder="Digite sua dúvida..."
              style={{
                flex: 1, padding: '9px 13px', borderRadius: '10px',
                border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.82rem',
                background: '#f8fafc', color: '#1e293b',
              }}
              onFocus={e => e.target.style.borderColor='#4f46e5'}
              onBlur={e => e.target.style.borderColor='#e2e8f0'}
            />
            <button onClick={enviar} disabled={!input.trim() || digitando}
              style={{
                width: '38px', height: '38px', borderRadius: '10px', border: 'none',
                background: input.trim() && !digitando ? 'linear-gradient(135deg,#4f46e5,#2563eb)' : '#e2e8f0',
                cursor: input.trim() && !digitando ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s',
              }}>
              <Send size={15} color={input.trim() && !digitando ? 'white' : '#94a3b8'} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%            { transform: translateY(-5px); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);    opacity: 0.6; }
          100% { transform: scale(1.65); opacity: 0; }
        }
      `}</style>
    </>
  )
}
