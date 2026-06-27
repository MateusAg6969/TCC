# Diretrizes e Instruções para o Assistente AI (Antigravity)

Este arquivo define as regras e diretrizes que o assistente deve sempre seguir ao trabalhar no projeto **IF REDE**.

## Regras Obrigatórias do Usuário

1. **Idioma de Resposta**: Sempre responda em português (do Brasil).
2. **Atualização de Documentação**: Sempre que fizer alguma alteração no código, caso seja necessário, atualize o arquivo `README.md` (por exemplo, documentando novas rotas, variáveis de ambiente necessárias, novos pacotes ou instruções de execução).
3. **Padrão de Commit e Push Automáticos**: Sempre que terminar uma alteração ou tarefa, realize automaticamente o push. O título do commit deve seguir obrigatoriamente o modelo: `DD/MM/AA - <Descrição da melhoria/alteração feita>` (exemplo: `26/06/26 - Correção de comentários`).

## Diretrizes Recomendadas de Qualidade e Segurança

- **Segurança de Credenciais**: Nunca adicione segredos, chaves de API, credenciais ou tokens de acesso diretamente no código ou arquivos commitados. Mantenha-os sempre no arquivo `.env` (que deve estar listado no `.gitignore`).
- **Validação de Código**: Garanta que o código compila sem erros de TypeScript e passe nos testes locais antes de propor o envio ou finalização de uma funcionalidade.
