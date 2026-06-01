/**
 * ============================================================================
 * EXEMPLOS: SISTEMA DE NOTIFICAÇÕES - IF REDE
 * ============================================================================
 * Este arquivo demonstra como disparar notificações quando eventos ocorrem.
 * 
 * O sistema de notificações é composto por:
 * 1. Backend: Schema Mongoose + Controllers + Routes + Service
 * 2. Frontend: Context (com polling) + Components (Bell + Modal + Página)
 * 3. API: GET /notificacoes, PATCH /notificacoes/:id/lida, DELETE /notificacoes/:id
 * 4. Eventos: Disparados quando like, comentário, seguidor, etc
 */

// ============================================================================
// EXEMPLO 1: Disparar notificação quando usuário recebe um like
// ============================================================================
// Arquivo: controllers/postagens.controller.js

const { notificarLike } = require('../services/notificacoes.service');

exports.adicionarLike = async (req, res) => {
  try {
    const { postagem_id } = req.params;
    const usuario_id = req.user._id;

    // ... validações ...

    // Buscar postagem para conhecer o autor
    const postagem = await Postagem.findById(postagem_id);
    if (!postagem) {
      return res.status(404).json({ sucesso: false, mensagem: 'Postagem não encontrada' });
    }

    // ... adicionar like ao banco ...

    // NOTIFICAÇÃO: Disparar notificação ao autor da postagem
    if (postagem.autor_id.toString() !== usuario_id.toString()) {
      await notificarLike(postagem.autor_id, usuario_id, postagem_id);
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Like adicionado com sucesso',
    });
  } catch (erro) {
    console.error('Erro ao adicionar like:', erro);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao adicionar like',
      erro: erro.message,
    });
  }
};

// ============================================================================
// EXEMPLO 2: Disparar notificação quando usuário comenta uma postagem
// ============================================================================
// Arquivo: controllers/comentarios.controller.js

const { notificarComentario } = require('../services/notificacoes.service');

exports.criarComentario = async (req, res) => {
  try {
    const { postagem_id } = req.params;
    const usuario_id = req.user._id;
    const { conteudo } = req.body;

    // ... validações ...

    // Buscar postagem para conhecer o autor
    const postagem = await Postagem.findById(postagem_id);
    if (!postagem) {
      return res.status(404).json({ sucesso: false, mensagem: 'Postagem não encontrada' });
    }

    // ... criar comentário ...
    const comentario = new Comentario({
      usuario_id,
      postagem_id,
      conteudo,
    });
    await comentario.save();

    // NOTIFICAÇÃO: Disparar notificação ao autor da postagem
    if (postagem.autor_id.toString() !== usuario_id.toString()) {
      await notificarComentario(postagem.autor_id, usuario_id, postagem_id, comentario._id);
    }

    return res.status(201).json({
      sucesso: true,
      dados: comentario,
      mensagem: 'Comentário criado com sucesso',
    });
  } catch (erro) {
    console.error('Erro ao criar comentário:', erro);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao criar comentário',
      erro: erro.message,
    });
  }
};

// ============================================================================
// EXEMPLO 3: Disparar notificação quando usuário passa a seguir outro
// ============================================================================
// Arquivo: routes/usuarios.routes.js (nova rota POST /usuarios/:id/seguir)

const { notificarNovoSeguidor } = require('../services/notificacoes.service');

router.post('/:id/seguir', verificaToken, async (req, res) => {
  try {
    const usuario_seguido_id = req.params.id;
    const usuario_seguidor_id = req.user._id;

    // Validar se não é a mesma pessoa
    if (usuario_seguido_id === usuario_seguidor_id.toString()) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Você não pode seguir a si mesmo',
      });
    }

    // Verificar se já segue
    const jaSegue = await Seguidor.findOne({
      usuario_seguidor_id,
      usuario_seguido_id,
    });

    if (jaSegue) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Você já segue esse usuário',
      });
    }

    // Criar relação de seguidor
    const seguidor = new Seguidor({
      usuario_seguidor_id,
      usuario_seguido_id,
    });
    await seguidor.save();

    // NOTIFICAÇÃO: Disparar notificação ao usuário seguido
    await notificarNovoSeguidor(usuario_seguido_id, usuario_seguidor_id);

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Você agora segue esse usuário',
    });
  } catch (erro) {
    console.error('Erro ao seguir usuário:', erro);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao seguir usuário',
      erro: erro.message,
    });
  }
});

// ============================================================================
// EXEMPLO 4: Frontend - Buscar notificações (automático com polling)
// ============================================================================
// O NotificationContext faz polling a cada 30 segundos automaticamente
// Você não precisa fazer nada - o sistema busca as notificações em background

// Exemplo de uso no componente:
// import { useNotifications } from '@/context/NotificationContext';
//
// export default function MyComponent() {
//   const { notificacoes, naoLidas } = useNotifications();
//   return <div>Você tem {naoLidas} notificações</div>;
// }

// ============================================================================
// EXEMPLO 5: Frontend - Marcar como lida
// ============================================================================
// const { marcarComoLida } = useNotifications();
// marcarComoLida(notificacao._id); // marca uma notificação específica
//
// const { marcarTudasComoLidas } = useNotifications();
// marcarTudasComoLidas(); // marca todas como lidas

// ============================================================================
// EXEMPLO 6: Endpoints da API de Notificações
// ============================================================================

/*
GET /api/notificacoes
- Busca notificações do usuário autenticado
- Params: pagina (default 1), limite (default 20), filtro (all|nao-lidas)
- Response:
  {
    "sucesso": true,
    "dados": [...notificacoes],
    "paginacao": { "pagina": 1, "limite": 20, "total": 50, "paginas": 3 },
    "nao_lidas": 5
  }

GET /api/notificacoes/nao-lidas/contador
- Conta notificações não lidas
- Response: { "sucesso": true, "nao_lidas": 5 }

PATCH /api/notificacoes/:id/lida
- Marca uma notificação como lida
- Response: { "sucesso": true, "dados": {...notificacao} }

PATCH /api/notificacoes/marcar-tudo-lido
- Marca todas as notificações como lidas
- Response: { "sucesso": true, "modificadas": 5 }

DELETE /api/notificacoes/:id
- Deleta uma notificação específica
- Response: { "sucesso": true }

DELETE /api/notificacoes
- Deleta todas as notificações do usuário
- Response: { "sucesso": true, "deletadas": 10 }
*/

// ============================================================================
// ESTRUTURA DO DOCUMENTO DE NOTIFICAÇÃO
// ============================================================================

/*
{
  "_id": ObjectId,
  "usuario_id": ObjectId, // Quem recebe a notificação
  "ator_id": ObjectId,   // Quem gerou a ação
  "tipo": "like|comentario|seguidor|repost|tag|resposta",
  "mensagem": "curtiu sua postagem", // Texto da notificação
  "objeto_id": ObjectId, // ID da postagem/comentário/usuário relacionado
  "objeto_tipo": "postagem|comentario|usuario",
  "lida": false,         // Status de leitura
  "data_leitura": null,  // Quando foi lida
  "criada_em": Date,     // Timestamp (expira em 30 dias com TTL)
}
*/

// ============================================================================
// TIPOS DE NOTIFICAÇÕES SUPORTADAS
// ============================================================================

/*
1. like: quando alguém curte sua postagem
   - Mensagem: "{nome} curtiu sua postagem"
   - Ícone: ❤️

2. comentario: quando alguém comenta sua postagem
   - Mensagem: "{nome} comentou na sua postagem"
   - Ícone: 💬

3. seguidor: quando alguém passa a te seguir
   - Mensagem: "{nome} começou a te seguir"
   - Ícone: 👥

4. repost: quando alguém compartilha sua postagem
   - Mensagem: "{nome} compartilhou sua postagem"
   - Ícone: 🔄

5. tag: quando alguém te marca em uma postagem
   - Mensagem: "{nome} te marcou em uma postagem"
   - Ícone: 🏷️

6. resposta: quando alguém responde seu comentário
   - Mensagem: "{nome} respondeu seu comentário"
   - Ícone: ↩️
*/

// ============================================================================
// COMPONENTES DISPONÍVEIS
// ============================================================================

/*
1. NotificationBell (src/components/NotificationBell.tsx)
   - Ícone de campainha na navbar
   - Mostra badge com número de não lidas
   - Dropdown com últimas 20 notificações
   - Botões para marcar como lida e deletar

2. NotificationProvider (src/context/NotificationContext.tsx)
   - Context global para gerenciar notificações
   - Polling automático a cada 30 segundos
   - Métodos: buscarNotificacoes(), marcarComoLida(), etc

3. Página de Notificações (src/app/notificacoes/page.tsx)
   - Visualização completa de todas as notificações
   - Filtros: todas / não lidas
   - Ações: marcar como lida, deletar

Usar em qualquer componente com:
const { notificacoes, naoLidas, marcarComoLida } = useNotifications();
*/

module.exports = {};
