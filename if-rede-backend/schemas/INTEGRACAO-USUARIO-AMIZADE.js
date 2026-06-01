/**
 * ============================================================================
 * GUIA DE INTEGRAÇÃO: USUARIO + AMIZADE SCHEMAS
 * ============================================================================
 * Estratégia para manter integridade de dados, sincronizar stats e
 * implementar relacionamentos complexos.
 *
 * PROBLEMA CENTRAL:
 * Usuários têm stats.total_amigos que devem estar sempre sincronizados
 * com o número real de documentos em amizades com status='aceito'
 * ============================================================================
 */

// ============================================================================
// PARTE 1: INICIALIZAÇÃO DE SCHEMAS E MODELOS
// ============================================================================

const mongoose = require('mongoose');
const usuarioSchema = require('./usuario-otimizado.schema');
const amizadeSchema = require('./amizade.schema');

// Criar modelos
const Usuario = mongoose.model('Usuario', usuarioSchema);
const Amizade = mongoose.model('Amizade', amizadeSchema);

// ============================================================================
// PARTE 2: MIDDLEWARE PRE/POST PARA INTEGRIDADE
// ============================================================================

/**
 * Middleware: Ao aceitar amizade, atualizar stats de ambos usuários
 */
amizadeSchema.pre('save', async function (next) {
  // Se é nova amizade (insert)
  if (this.isNew) {
    return next();
  }

  // Se status mudou para 'aceito', sincronizar stats
  if (this.isModified('status') && this.status === 'aceito') {
    try {
      // Incrementar stats em ambos usuários
      await Usuario.atualizarStats(this.usuarioId, 'total_amigos', 1);
      await Usuario.atualizarStats(this.amigoId, 'total_amigos', 1);
      next();
    } catch (error) {
      next(error);
    }
  }

  next();
});

/**
 * Middleware: Ao remover amizade, decrementar stats
 */
amizadeSchema.post('deleteOne', async function (doc) {
  if (doc.status === 'aceito') {
    try {
      await Usuario.atualizarStats(doc.usuarioId, 'total_amigos', -1);
      await Usuario.atualizarStats(doc.amigoId, 'total_amigos', -1);
    } catch (error) {
      console.error('Erro ao sincronizar stats após deletion:', error);
    }
  }
});

// ============================================================================
// PARTE 3: SERVIÇO DE AMIZADE (Business Logic)
// ============================================================================

/**
 * Serviço centralizado para operações de amizade
 * Garante integridade em casos complexos
 */
class ServicoAmizade {
  /**
   * Enviar solicitação de amizade (validado)
   * @param {ObjectId} usuarioIdSolicitante - Quem está enviando
   * @param {ObjectId} usuarioIdDestino - Quem vai receber
   * @returns {Promise<Object>} Documento de amizade criado
   */
  static async enviarSolicitacao(usuarioIdSolicitante, usuarioIdDestino) {
    // 1. Validar que ambos usuários existem e estão ativos
    const [usuarioA, usuarioB] = await Promise.all([
      Usuario.findOne({
        _id: usuarioIdSolicitante,
        ativo: true,
      }),
      Usuario.findOne({
        _id: usuarioIdDestino,
        ativo: true,
      }),
    ]);

    if (!usuarioA) {
      throw new Error('Usuário solicitante não encontrado ou inativo');
    }
    if (!usuarioB) {
      throw new Error('Usuário destino não encontrado ou inativo');
    }

    // 2. Verificar se não é auto-solicitação
    if (usuarioIdSolicitante.equals(usuarioIdDestino)) {
      throw new Error('Não é possível enviar solicitação para si mesmo');
    }

    // 3. Verificar se já existe relação
    const jaExiste = await Amizade.findOne({
      $or: [
        {
          usuarioId: usuarioIdDestino,
          amigoId: usuarioIdSolicitante,
          status: { $in: ['pendente', 'aceito'] },
        },
        {
          usuarioId: usuarioIdSolicitante,
          amigoId: usuarioIdDestino,
          status: { $in: ['pendente', 'aceito'] },
        },
      ],
    });

    if (jaExiste) {
      throw new Error(
        'Já existe uma relação de amizade ou solicitação entre estes usuários'
      );
    }

    // 4. Criar solicitação
    // Convenção: usuarioId = recebedor, amigoId = remetente
    const amizade = new Amizade({
      usuarioId: usuarioIdDestino, // Quem recebe
      amigoId: usuarioIdSolicitante, // Quem envia
      status: 'pendente',
    });

    return amizade.save();
  }

  /**
   * Aceitar solicitação de amizade
   * @param {ObjectId} usuarioIdQuemAceita
   * @param {ObjectId} usuarioIdQuemSolicitou
   * @returns {Promise<Object>} Amizade atualizada
   */
  static async aceitar(usuarioIdQuemAceita, usuarioIdQuemSolicitou) {
    // Encontrar solicitação
    const amizade = await Amizade.findOne({
      usuarioId: usuarioIdQuemAceita,
      amigoId: usuarioIdQuemSolicitou,
      status: 'pendente',
    });

    if (!amizade) {
      throw new Error('Solicitação de amizade não encontrada');
    }

    // Atualizar status
    amizade.status = 'aceito';
    amizade.dataResposta = new Date();

    // Salvar (middleware pós-save atualizará stats)
    await amizade.save();

    // Atualizar stats manualmente (se middleware não funcionar)
    await Promise.all([
      Usuario.atualizarStats(usuarioIdQuemAceita, 'total_amigos', 1),
      Usuario.atualizarStats(usuarioIdQuemSolicitou, 'total_amigos', 1),
    ]);

    return amizade;
  }

  /**
   * Recusar solicitação
   * @param {ObjectId} usuarioIdQuemRecusa
   * @param {ObjectId} usuarioIdQuemSolicitou
   * @param {String} motivo
   * @returns {Promise<Object>}
   */
  static async recusar(usuarioIdQuemRecusa, usuarioIdQuemSolicitou, motivo = '') {
    const amizade = await Amizade.findOne({
      usuarioId: usuarioIdQuemRecusa,
      amigoId: usuarioIdQuemSolicitou,
      status: 'pendente',
    });

    if (!amizade) {
      throw new Error('Solicitação de amizade não encontrada');
    }

    amizade.status = 'recusado';
    amizade.motivoRecusa = motivo;
    amizade.dataResposta = new Date();

    return amizade.save();
  }

  /**
   * Desfazer amizade (remover ambas as relações se bidirecionais)
   * @param {ObjectId} usuarioIdA
   * @param {ObjectId} usuarioIdB
   * @returns {Promise<Array>} Documentos atualizados
   */
  static async desfazer(usuarioIdA, usuarioIdB) {
    // Encontrar ambos os lados da relação
    const amizades = await Amizade.find({
      $or: [
        { usuarioId: usuarioIdA, amigoId: usuarioIdB, status: 'aceito' },
        { usuarioId: usuarioIdB, amigoId: usuarioIdA, status: 'aceito' },
      ],
    });

    if (amizades.length === 0) {
      throw new Error('Amizade não encontrada');
    }

    // Atualizar ambos para recusado
    const resultados = await Promise.all(
      amizades.map((doc) => {
        doc.status = 'recusado';
        doc.motivoRecusa = 'Amizade desfeita pelo usuário';
        doc.dataResposta = new Date();
        return doc.save();
      })
    );

    // Decrementar stats
    await Promise.all([
      Usuario.atualizarStats(usuarioIdA, 'total_amigos', -1),
      Usuario.atualizarStats(usuarioIdB, 'total_amigos', -1),
    ]);

    return resultados;
  }

  /**
   * Sincronizar stats de um usuário
   * Útil para correção após inconsistências
   * @param {ObjectId} usuarioId
   * @returns {Promise<Object>} Usuário atualizado
   */
  static async sincronizarStats(usuarioId) {
    // Contar amigos aceitos
    const totalAmigos = await Amizade.countDocuments({
      $or: [
        { usuarioId, status: 'aceito' },
        { amigoId: usuarioId, status: 'aceito' },
      ],
    });

    // Atualizar usuário
    const usuario = await Usuario.findByIdAndUpdate(
      usuarioId,
      { 'stats.total_amigos': totalAmigos },
      { new: true }
    );

    return usuario;
  }
}

// ============================================================================
// PARTE 4: QUERIES OTIMIZADAS (Usar nos Controllers)
// ============================================================================

/**
 * Listar amigos com paginação
 */
async function listarAmigos(usuarioId, pagina = 1, limite = 20) {
  const skip = (pagina - 1) * limite;

  const amigos = await Amizade.find({
    $or: [
      { usuarioId, status: 'aceito' },
      { amigoId: usuarioId, status: 'aceito' },
    ],
  })
    .populate({
      path: 'usuarioId amigoId',
      select: 'perfil stats customizacao',
    })
    .skip(skip)
    .limit(limite)
    .sort({ dataSolicitacao: -1 });

  const total = await Amizade.countDocuments({
    $or: [
      { usuarioId, status: 'aceito' },
      { amigoId: usuarioId, status: 'aceito' },
    ],
  });

  return {
    amigos,
    total,
    pagina,
    totalPaginas: Math.ceil(total / limite),
  };
}

/**
 * Verificar status de relação entre dois usuários
 */
async function verificarStatusRelacao(usuarioIdA, usuarioIdB) {
  // Tentar ambas as direções
  const relacao = await Amizade.findOne({
    $or: [
      { usuarioId: usuarioIdA, amigoId: usuarioIdB },
      { usuarioId: usuarioIdB, amigoId: usuarioIdA },
    ],
  });

  if (!relacao) {
    return 'nenhuma';
  }

  // Identificar quem é quem
  if (relacao.usuarioId.equals(usuarioIdA)) {
    return {
      status: relacao.status,
      enviou: false, // usuarioA recebeu
      recebeu: true,
    };
  } else {
    return {
      status: relacao.status,
      enviou: true, // usuarioA enviou
      recebeu: false,
    };
  }
}

/**
 * Agregação: Amigos com contagem de amigos em comum
 */
async function listarAmigosComEstatisticas(usuarioId) {
  return Amizade.aggregate([
    {
      $match: {
        $or: [
          { usuarioId: new mongoose.Types.ObjectId(usuarioId), status: 'aceito' },
          { amigoId: new mongoose.Types.ObjectId(usuarioId), status: 'aceito' },
        ],
      },
    },
    {
      $addFields: {
        amigoId: {
          $cond: [
            { $eq: ['$usuarioId', new mongoose.Types.ObjectId(usuarioId)] },
            '$amigoId',
            '$usuarioId',
          ],
        },
      },
    },
    {
      $lookup: {
        from: 'usuarios',
        localField: 'amigoId',
        foreignField: '_id',
        as: 'amigo',
      },
    },
    {
      $unwind: '$amigo',
    },
    {
      $project: {
        amigoId: 1,
        'amigo.perfil.nome': 1,
        'amigo.stats': 1,
        'amigo.customizacao.foto_perfil_url': 1,
        dataSolicitacao: 1,
      },
    },
    {
      $sort: { dataSolicitacao: -1 },
    },
  ]);
}

// ============================================================================
// PARTE 5: VALIDAÇÃO DE INTEGRIDADE (Jobs de Limpeza)
// ============================================================================

/**
 * Job: Verificar e corrigir inconsistências
 * Executar 1x por dia ou em demanda
 */
async function validarIntegridade() {
  const erros = [];
  const correcoes = [];

  // 1. Verificar auto-amizades
  const autoAmizades = await Amizade.find({
    $where: 'this.usuarioId === this.amigoId',
  });

  for (const amizade of autoAmizades) {
    erros.push(`Auto-amizade encontrada: ${amizade._id}`);
    await Amizade.deleteOne({ _id: amizade._id });
    correcoes.push(`Deletada auto-amizade ${amizade._id}`);
  }

  // 2. Verificar referências órfãs
  const amizadesOrfas = await Amizade.aggregate([
    {
      $lookup: {
        from: 'usuarios',
        localField: 'usuarioId',
        foreignField: '_id',
        as: 'usuario',
      },
    },
    {
      $lookup: {
        from: 'usuarios',
        localField: 'amigoId',
        foreignField: '_id',
        as: 'amigo',
      },
    },
    {
      $match: {
        $or: [{ usuario: { $size: 0 } }, { amigo: { $size: 0 } }],
      },
    },
  ]);

  for (const amizade of amizadesOrfas) {
    erros.push(`Referência órfã: ${amizade._id}`);
    await Amizade.deleteOne({ _id: amizade._id });
    correcoes.push(`Deletada amizade órfã ${amizade._id}`);
  }

  // 3. Sincronizar stats de todos usuários
  const usuarios = await Usuario.find({ ativo: true });

  for (const usuario of usuarios) {
    const totalAmigos = await Amizade.countDocuments({
      $or: [
        { usuarioId: usuario._id, status: 'aceito' },
        { amigoId: usuario._id, status: 'aceito' },
      ],
    });

    if (usuario.stats.total_amigos !== totalAmigos) {
      erros.push(
        `Stats desincronizado: usuário ${usuario._id} tem ${usuario.stats.total_amigos} mas deveria ter ${totalAmigos}`
      );

      await Usuario.updateOne(
        { _id: usuario._id },
        { 'stats.total_amigos': totalAmigos }
      );

      correcoes.push(`Sincronizado stats do usuário ${usuario._id}`);
    }
  }

  return {
    errosEncontrados: erros.length,
    correcoes,
    detalhes: {
      erros,
      correcoes,
    },
  };
}

// ============================================================================
// EXPORTAR
// ============================================================================

module.exports = {
  Usuario,
  Amizade,
  ServicoAmizade,
  queries: {
    listarAmigos,
    verificarStatusRelacao,
    listarAmigosComEstatisticas,
  },
  integridade: {
    validarIntegridade,
  },
};
