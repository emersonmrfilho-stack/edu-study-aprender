# Webhook da Kiwify

## Objetivo
Criar um endereço público no Edu Study para receber os avisos de pagamento da Kiwify com segurança.

## Implementação
- Criar o endereço `/api/public/kiwify` para receber notificações da Kiwify.
- Validar o token secreto configurado na Kiwify antes de aceitar qualquer atualização.
- Validar o conteúdo recebido e reconhecer compra aprovada, reembolso, chargeback e cancelamento.
- Relacionar a compra à conta do aluno pelo e-mail e atualizar o acesso Premium sem duplicar registros.
- Manter o endpoint respondendo corretamente aos testes e reenvios da Kiwify.
- Corrigir os erros de compilação atuais ligados ao trabalho de pagamento e testar o endereço localmente.

## Configuração final
Após publicar, usar `https://edustudy.space/api/public/kiwify` no campo URL da Kiwify. O mesmo token secreto será salvo com segurança no Edu Study e informado no cadastro do webhook.
