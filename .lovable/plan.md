# Painel de compras Premium

## Objetivo
Criar no Painel Admin uma área para acompanhar compras Premium, ver quando e como cada acesso foi liberado e executar testes controlados.

## O que será criado
- Uma nova opção **Premium** no Painel Admin.
- Lista pesquisável de compras com nome, usuário, valor, situação, data da compra e data da liberação.
- Filtros para pendentes, aprovadas, recusadas e testes.
- Seleção de uma compra pendente e confirmação antes da aprovação manual.
- Identificação clara da origem da liberação: automática, manual ou teste.
- Aba **Testes** com duas opções:
  - simular uma compra sem conceder Premium real;
  - testar a liberação real em uma conta selecionada, com confirmação explícita.
- Registros de teste visualmente separados das compras reais.

## Segurança e regras
- Todas as consultas e aprovações serão validadas no servidor.
- Apenas contas com função de administrador poderão abrir dados, aprovar compras ou executar testes reais.
- A aprovação registrará quem aprovou e quando ocorreu.
- Uma compra já aprovada não poderá ser aprovada novamente.
- A simulação segura não alterará o Premium do usuário.
- O fluxo automático continuará sendo a única forma normal de liberação; a aprovação manual ficará restrita ao painel.

## Dados
- Ampliar o histórico de compras para registrar origem da liberação e identificar registros de teste.
- Manter os compradores e compras existentes intactos.
- Usar perfis existentes para exibir nome e identificação do comprador.

## Validação
- Verificar acesso administrativo e bloqueio para usuários comuns.
- Testar listagem, filtros, aprovação manual, simulação e liberação real.
- Confirmar no aplicativo que uma aprovação real ativa o Premium.
- Validar em celular e computador e corrigir eventuais erros de compilação.
