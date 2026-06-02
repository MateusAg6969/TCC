export type PostType = 'texto' | 'imagem' | 'audio' | 'msc';

export interface Perfil {
  nome: string;
  username?: string;
  email?: string;
  bio?: string;
  privacidade?: 'publico' | 'privado';
}

export interface Customizacao {
  cor_fundo?: string;
  cor_botoes?: string;
  banner_url?: string;
  medalhas?: string[];
  tema?: 'claro' | 'escuro' | 'roxo' | string;
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
  stats?: {
    likes?: number;
    comentarios_count?: number;
    shares?: number;
  };
  autor_id?: {
    _id?: string;
    perfil?: {
      nome?: string;
    };
  };
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

// ============ AMIZADES ============
export type StatusAmizade = 'amigo' | 'solicitacao_enviada' | 'solicitacao_recebida' | 'nao_amigo';

export interface Amizade {
  _id: string;
  usuario_origem_id: string;
  usuario_destino_id: string;
  status: 'pendente' | 'aceita';
  criado_em: string;
  atualizado_em: string;
}

export interface SolicitacaoAmizade {
  _id: string;
  usuario_origem_id: Usuario;
  usuario_destino_id: Usuario;
  status: 'pendente' | 'aceita' | 'recusada';
  criado_em: string;
}

export interface UsuarioComStatus extends Usuario {
  statusAmizade?: StatusAmizade;
  totalAmigos?: number;
}

// ============ CUSTOMIZAÇÃO ============
export interface CustomizacaoCompleta {
  _id?: string;
  usuario_id?: string;
  cor_fundo: string;
  cor_botoes: string;
  tema: 'claro' | 'escuro' | 'roxo';
  banner_url?: string;
  medalhas?: string[];
  createdAt?: string;
  updatedAt?: string;
}
