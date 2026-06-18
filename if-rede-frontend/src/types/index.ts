export type PostType = 'texto' | 'imagem' | 'audio' | 'msc' | 'video';

export interface Perfil {
  nome: string;
  username?: string;
  email?: string;
  bio?: string;
  privacidade?: 'publico' | 'privado';
}

export interface Medalha {
  _id: string;
  nome: string;
  descricao: string;
  icone_url: string;
  awarded_at?: string;
}

export interface PortfolioItem extends Post {
  posicao: number;
  fixado_em: string;
}

export interface Customizacao {
  cor_fundo?: string;
  cor_botoes?: string;
  avatar_url?: string;
  banner_url?: string;
  medalhas?: Medalha[];
  portfolio?: PortfolioItem[];
  tema?: 'light' | 'dark';
}

export interface Usuario {
  id?: string;
  _id?: string;
  perfil: Perfil;
  customizacao?: Customizacao;
  stats?: {
    total_seguidores?: number;
    total_postagens?: number;
  };
}

export interface Post {
  _id: string;
  titulo: string;
  descricao?: string;
  tipo: PostType;
  subtipo?: string;
  conteudo: {
    texto_longo?: string;
    url?: string;
    arquivo?: {
      nome_original?: string;
      nome_servidor?: string;
      mimetype?: string;
      tamanho_bytes?: number;
    };
  };
  tags?: string[];
  stats?: {
    likes?: number;
    usuarios_que_curtiram?: string[];
    comentarios_count?: number;
    shares?: number;
    alcance?: number;
  };
  autor_id?: {
    _id?: string;
    perfil?: {
      nome?: string;
    };
  };
  denuncias?: {
    total: number;
    motivos: Array<{
      usuario_id: string;
      motivo: string;
      data: string;
    }>;
    bloqueado: boolean;
    motivo_bloqueio?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiSuccess<T> {
  ok: true;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  ok: false;
  error: {
    message: string;
    details?: unknown;
  };
}

export interface PalavraFiltro {
  _id: string;
  termo: string;
  termo_normalizado: string;
  ativo: boolean;
  severidade: 'baixa' | 'media' | 'alta';
  createdAt?: string;
  updatedAt?: string;
}

export interface TagSubtipo {
  _id: string;
  nome: string;
  slug: string;
  tipo: 'imagem' | 'audio' | 'texto';
  ativo: boolean;
}

export type TipoNotificacao = 'like' | 'comentario' | 'seguidor' | 'repost' | 'tag' | 'resposta';

export interface Notificacao {
  _id: string;
  usuario_id: string;
  ator_id: {
    _id: string;
    perfil: {
      nome: string;
      email: string;
    };
  };
  tipo: TipoNotificacao;
  mensagem: string;
  objeto_id?: string;
  objeto_tipo?: 'postagem' | 'comentario' | 'usuario';
  lida: boolean;
  data_leitura?: string;
  criada_em: string;
}

export type HighlightType = 'NORMAL' | 'OFFICIAL_ANSWER' | 'PEDAGOGICAL_HIGHLIGHT';

export interface Comentario {
  _id: string;
  postagem_id: string;
  autor_id: {
    _id: string;
    perfil: {
      nome: string;
      status_vinculo?: 'estudante' | 'egresso' | 'servidor';
    };
    customizacao?: {
      avatar_url?: string;
    };
  };
  texto: string;
  parent_id?: string | null;
  highlight_type: HighlightType;
  stats: {
    likes: number;
    usuarios_que_curtiram: string[];
  };
  respostas?: Comentario[];
  createdAt: string;
}
