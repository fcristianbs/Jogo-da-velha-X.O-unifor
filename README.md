# Jogo da Velha Web - UNIFOR

Aplicação web interativa e moderna do clássico **Jogo da Velha** desenvolvida com a identidade visual da **Universidade de Fortaleza (UNIFOR)**. O projeto inclui modos PvP local e contra IA, suporte a Partida Única ou Melhor de 3 (MD3), efeitos visuais com linha vitoriosa dinâmica e confetes, além de efeitos sonoros sintetizados via **Web Audio API** sem arquivos externos.

---

## 🌐 Demonstração Online

- **GitHub Pages:** [Link da Aplicação no GitHub Pages]  (https://fcristianbs.github.io/Jogo-da-velha-X.O-unifor/)
- Equipe / Integrantes: Cristian Sampaio (2310539) Gilberto de Souza (2214606) Davi Alves (2520357)

---

## 🏛️ Identidade Visual e Tecnologias

- **HTML5 Semântico:** Estrutura acessível com elementos padronizados.
- **CSS3 Moderno:** Paleta de cores institucional da UNIFOR (Azul `#003366`, Azul Destaque `#0056b3`, Laranja `#d97706`, Fundo `#f4f6f9`), layout responsivo em Grid e Flexbox, animações de transição e efeitos de acabamento refinado.
- **JavaScript Puro (ES6+):** Motor de regras do jogo, controle de turnos, lógica de IA para modo computador, suporte a séries MD3 e sintetizador de áudio nativo usando Web Audio API.

---

## 📁 Estrutura do Repositório

```text
jogo-da-velha-unifor/
├── docs/
│   └── cdu_JogarJogodavelha.md   # Especificação de Requisitos Funcionais (CDU)
├── src/
│   └── index.html                # Código-fonte completo (HTML + CSS + JS unificado)
├── README.md                     # Documentação geral do projeto
└── RELATORIO_PROMPTS.md          # Registro e relatório das interações com a IA
```

---

## 🎮 Funcionalidades e Regras

1. **Modos de Jogo:**
   - **2 Jogadores (PvP Local):** Partida entre dois jogadores no mesmo dispositivo alternando entre 'X' e 'O'.
   - **Contra o Computador:** Jogador disputa contra a IA (que joga como 'O' com tempo de resposta humanizado de ~400ms).
2. **Formatos de Partida:**
   - **Partida Única:** Disputa simples (1/1).
   - **Melhor de 3 (MD3):** Série em até 3 rodadas; o primeiro a atingir 2 vitórias é declarado campeão da partida.
3. **Efeitos Visuais e Sonoros:**
   - **Linha Vitoriosa:** Traçado contínuo animado calculado exatamente sobre o trio de células vencedor.
   - **Confetes:** Celebração animada disparada na vitória.
   - **Áudio Sintetizado:** Frequências sonoras para jogadas de 'X', 'O', vitória e empate geradas em tempo real pela Web Audio API nativa.

---

## 🚀 Como Executar Localmente

Como a aplicação é 100% autônoma e executada no navegador:

1. Clone o repositório ou faça o download dos arquivos:
   ```bash
   git clone https://github.com/seu-usuario/jogo-da-velha-unifor.git
   ```
2. Abra o arquivo `src/index.html` diretamente em qualquer navegador moderno (Chrome, Edge, Firefox, Safari).
3. Não é necessária instalação de dependências ou inicialização de servidor back-end.

---

## 📄 Documentação dos Requisitos

A especificação completa do Caso de Uso com critérios de aceite, matriz de rastreabilidade e dicionário de dados pode ser consultada em:
- [docs/cdu_JogarJogodavelha.md](docs/cdu_JogarJogodavelha.md)

---

## 📝 Histórico de Prompts e IA

Para consultar todas as instruções e interações realizadas durante o desenvolvimento orientado a IA, consulte:
- [RELATORIO_PROMPTS.md](RELATORIO_PROMPTS.md)
