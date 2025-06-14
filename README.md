# CorpFlow

## Grupo

Eduardo Stein Ra: 1292414517
João Vitor Cruz da Silva Ra: 1292327668
Leandro Alves Barreto Ra: 12924112129
Matheus Gesteira Gunça Ra: 1292221149
Pedro Norton Zembruski Ra: 1292426388


## Visão Geral do Projeto

O CorpFlow é uma interface web simples para gerenciamento de processos e atividades de colaboradores, desenvolvida para ajudar gerentes a organizar e acompanhar tarefas de forma visual e intuitiva. Esta ferramenta permite a criação de fluxos de trabalho usando blocos de arrastar e soltar, garantindo que as tarefas sigam uma ordem lógica e que as regras de negócio sejam respeitadas.

## Funcionalidades

- Paleta de Blocos: Inclui blocos "INÍCIO", "FAZER TAREFA", "VERIFICAR", "APROVAR" e "FIM".

- Área de Fluxo (Canvas): Uma área interativa onde os blocos podem ser arrastados e posicionados livremente.

- Conexões Automáticas e Sequenciais: Ao adicionar um novo bloco (exceto "INÍCIO"), ele é automaticamente conectado ao bloco funcional anterior no fluxo, promovendo uma estrutura linear.

- Campo de Título do Fluxo: Permite ao usuário inserir um título para o fluxo, que é salvo junto com os dados do fluxo.

- Gerenciamento de Fluxos Salvos: Uma página auxiliar (modal) permite visualizar, carregar e excluir fluxos salvos no armazenamento local do navegador.

- Desfazer/Refazer Ações: Botões dedicados permitem desfazer a última ação realizada e refazer ações desfeitas.

- Apagar Último Bloco: Uma função específica para remover o último bloco adicionado ao fluxo, independente do histórico de "desfazer".

- Validações em Tempo Real e ao Salvar:

    - Ordem de Adição: Impede a adição de blocos em ordens ilógicas (ex: "APROVAR" sem "VERIFICAR" anterior).

    - Blocos INÍCIO/FIM: Garante que o fluxo comece com "INÍCIO" e tenha apenas um "FIM".

    - Validação de Contexto (Simulada): Simula a regra "somente gerentes podem aprovar". Se a opção "Sou Gerente" não estiver marcada e um bloco "APROVAR" estiver presente, um erro é exibido.

## Como Usar

1. **Abra** o index.html em seu navegador.

2. **Comece um Fluxo:** Arraste o bloco "INÍCIO" da paleta para a área de fluxo. Este deve ser sempre o primeiro bloco.

3. **Adicione Blocos:** Arraste outros blocos (FAZER TAREFA, VERIFICAR, APROVAR, FIM) para a área de fluxo. Eles serão automaticamente conectados ao bloco anterior.
    - Para blocos "FAZER TAREFA", você pode adicionar uma descrição no campo de texto que aparece no bloco.

4. **Repositionar Blocos:** Todos os blocos podem ser arrastados e soltos para reorganizar o layout visual do fluxo.

5. **Controle de Gerente:** Marque/desmarque a caixa "Sou Gerente" para testar a validação de contexto para o bloco "APROVAR".

6. **Desfazer/Refazer:** Utilize os botões "Desfazer" e "Refazer" para navegar pelo histórico de suas ações de adição/movimentação de blocos.

7. **Apagar Último Bloco:** Use o botão "Apagar Último Bloco" para remover o último bloco do fluxo.

8. **Salvar Fluxo:** Insira um título no campo "Título do Fluxo" e clique em "Salvar Fluxo". O fluxo será salvo no armazenamento local do seu navegador. O sistema realizará validações sintáticas e de contexto. Se houver erros, mensagens claras serão exibidas.

9. **Gerenciar Fluxos:** Clique em "Gerenciar Fluxos" para abrir um modal onde você pode:

    - Carregar um fluxo salvo para vizualização e edição. (Basta salvar com o mesmo título para atualizar o fluxo)

    - Excluir um fluxo individual.

    - Limpar Todos os fluxos salvos.

## Desafio

1. Como organizar blocos visuais para criar fluxos de tarefas que sigam uma ordem lógica (Linguagens Livres de Contexto)?
-> O CorpFlow utiliza uma interface de arrastar e soltar para blocos visuais. A ordem lógica é imposta por conexões automáticas e validações estritas no momento da adição de blocos. Cada bloco funcional (FAZER TAREFA, VERIFICAR, APROVAR) é automaticamente conectado ao bloco anterior, e as regras como "APROVAR só pode vir depois de VERIFICAR" são verificadas imediatamente.

2. Como verificar regras especiais, como "só gerentes podem aprovar" (Linguagens Sensíveis ao Contexto)?
-> O CorpFlow simula essa regra com uma variável booleana (isManager). A validação é realizada ao clicar em "Salvar Fluxo". Se isManager for false e houver um bloco "APROVAR" no fluxo, uma mensagem de erro é exibida. Isso simula a interface perguntando ao servidor quem é o usuário logado de forma simplificada no frontend.

3. Como identificar comandos válidos, como "FAZER" ou "APROVAR", e evitar erros, como palavras erradas (Análise Léxica)?
-> O CorpFlow usa blocos pré-definidos ("FAZER TAREFA", "VERIFICAR", "APROVAR", "INÍCIO", "FIM"), que atuam como "tokens" válidos. Isso evita a necessidade de uma análise léxica complexa para comandos, pois os comandos são selecionados, não digitados.

4. Como garantir que o fluxo de tarefas está correto, como ter uma tarefa antes de aprová-la (Análise Sintática)?
-> A validação sintática é crucial e é implementada da seguinte maneira: Ao adicionar um bloco a interface verifica a ordem dos blocos antes de permitir sua adição (ex: "VERIFICAR" após "FAZER TAREFA", "APROVAR" após "VERIFICAR"). Se a regra for violada, o bloco não é adicionado.

5. É melhor processar o fluxo no navegador para rapidez ou no servidor para segurança (Compilação/Interpretação)?
-> Esse protótipo garante o teste de todas as funcionalidades principais planejadas de maneira barata e simples. O CorpFlow, como implementado, processa os fluxos diretamente no navegador (interpretação). A lógica de validação (addBlockToFlow, saveFlow) e o gerenciamento de estado (blocks, connections) são todos executados no cliente. A segurança e a complexidade da compilação em servidor seriam uma etapa futura.