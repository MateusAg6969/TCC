1. Contexto e Propósito
  O IFRede é uma plataforma de nicho acadêmico projetada para conectar estudantes e servidores, permitindo o
  compartilhamento de produções intelectuais e artísticas (textos, imagens, áudios e vídeos). O objetivo principal é
  fomentar o engajamento e a visibilidade de talentos internos através de um grafo social (seguidores) e um algoritmo de
  feed híbrido.

  ---

  1. Análise de Usabilidade e UX (Pontos Fortes)

* Identidade Visual Coesa: O uso da paleta "Roxo/Oliva" (#2D1B2D, #8F9972) cria uma estética moderna e profissional,
     alinhada a um ambiente acadêmico diferenciado.
* Micro-interações de Qualidade: Implementação de atualizações otimistas no botão de curtir e animações suaves
     (escalonamento, transições de opacidade) que elevam a percepção de performance.
* Navegação Facilitada: O botão global de "Home" fixo e os botões de retorno nas páginas internas ("Voltar") garantem
     que o usuário nunca se sinta perdido.
* Feedback em Tempo Real: O sistema de notificações via polling e o sinalizador visual (sino com contador)
     proporcionam uma experiência dinâmica, essencial para redes sociais.

  ---

  1. Relatório de Melhorias (Correções e Otimizações)

A. Lista de Melhorias Necessárias
  ┌────────────┬─────────────────┬────────────────────────────────────────┬────────────────────────────────────────┐
  │ Prioridade │ Localização     │ Problema                               │ Sugestão de Solução                    │
  ├────────────┼─────────────────┼────────────────────────────────────────┼────────────────────────────────────────┤
  │ 🔴 Crítica │ Geral (PostCard │ Erros de rede (likes, seguidores) são  │ Implementar Toasts ou Snackbars (ex:   │
  │            │ / Social)       │ logados no console mas não exibidos ao │ Sonner ou React Hot Toast) para erros. │
  │            │                 │ usuário.                               │                                        │
  │ 🟠 Alta    │ Geral           │ Falta de acessibilidade básica         │ Adicionar aria-label descritivos e     │
  │            │                 │ (aria-label em botões de ícone como    │ garantir navegação via teclado         │
  │            │                 │ Curtir, Sino, Comentar).               │ (tabindex).                            │
  │ 🟠 Alta    │ Feed / Busca    │ Mudanças bruscas de conteúdo durante o │ Implementar Skeleton Screens no        │
  │            │                 │ carregamento de dados assíncronos.     │ HomeFeedClient e SearchClient para     │
  │            │                 │                                        │ suavizar o carregamento.               │
  │ 🟡 Média   │ PostCard        │ Player de vídeo e áudio são            │ Integrar componentes de player nativos │
  │            │                 │ representados por placeholders         │ ou customizados (ex: video-js ou tags  │
  │            │                 │ estáticos.                             │ HTML5 estilizadas).                    │
  │ 🟡 Média   │ Navegação       │ Falta de uma barra de navegação        │ Criar um menu lateral persistente com  │
  │            │                 │ principal (Sidebar/Navbar) no Desktop. │ links rápidos para Search,             │
  │            │                 │                                        │ Notificações e Perfil.                 │
  │ ⚪ Baixa   │ NewPostPage     │ Usuário pode digitar títulos longos    │ Adicionar contador de caracteres em    │
  │            │                 │ sem saber se serão cortados (limite    │ tempo real nos inputs de Título e      │
  │            │                 │ visual).                               │ Descrição.                             │
  └────────────┴─────────────────┴────────────────────────────────────────┴────────────────────────────────────────┘
  ---

  1. Funcionalidades Ausentes e Sugestões de Implementação

  ┌──────────────────────────┬──────────────────────────────────────────────────────────────────────┬────────────┐
  │ Funcionalidade           │ Justificativa                                                        │ Prioridade │
  ├──────────────────────────┼──────────────────────────────────────────────────────────────────────┼────────────┤
  │ Mensagens Diretas (Chat) │ Essencial para a colaboração acadêmica privada entre alunos e        │ Essencial  │
  │                          │ orientadores.                                                        │            │
  │ Lógica de Repostagem     │ O botão existe na UI (Repeat2), mas não há funcionalidade. Aumenta a │ Essencial  │
  │                          │ viralidade de bons conteúdos.                                        │            │
  │ Painel de Moderação      │ Gerenciamento das solicitações de novas tags e moderação de palavras │ Importante │
  │                          │ proibidas (filtro já existente no backend).                          │            │
  │ Configurações de Conta   │ Troca de senha, exclusão de conta e preferências de                  │ Importante │
  │                          │ privacidade/e-mail.                                                  │            │
  │ Busca Avançada           │ Filtros por data de publicação, curso/campus do autor e tags         │ Desejável  │
  │                          │ específicas.                                                         │            │
  │ Sistema de               │ Reconhecimento visual no perfil para usuários que publicam           │ Desejável  │
  │ Medalhas/Gamificação     │ frequentemente ou ganham muitos likes.                               │            │
  └──────────────────────────┴──────────────────────────────────────────────────────────────────────┴────────────┘

  ---

  1. Resumo Executivo

  Nota Geral: 8.2 / 10

* Pontos Fortes: Arquitetura técnica robusta (JWT, Hybrid Feed), design visual atraente e performance percebida
     excelente devido às atualizações otimistas.
* Pontos Fracos: Lacunas em acessibilidade, falta de feedback de erro visual para o usuário e ausência de uma central
     de mensagens (Chat).

  Recomendação Estratégica:
  O foco imediato deve ser a Acessibilidade e Feedback de Erro (🔴/🟠). Uma rede social que falha silenciosamente
  frustra o usuário. Em seguida, a implementação da Lógica de Repostagem e Chat transformará o IFRede de um mural de
  publicações em uma rede de colaboração completa.
