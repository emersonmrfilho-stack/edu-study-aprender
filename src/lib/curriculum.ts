// Currículo completo: 1º ano do Fundamental até o 3º ano do Ensino Médio.

export type Band = "f1" | "f2" | "f3" | "em";

export type Grade = {
  id: string;
  label: string;
  short: string;
  band: Band;
  level: number; // 1..12
};

export const GRADES: Grade[] = [
  { id: "f1a", label: "1º ano — Fundamental", short: "1º EF", band: "f1", level: 1 },
  { id: "f2a", label: "2º ano — Fundamental", short: "2º EF", band: "f1", level: 2 },
  { id: "f3a", label: "3º ano — Fundamental", short: "3º EF", band: "f1", level: 3 },
  { id: "f4a", label: "4º ano — Fundamental", short: "4º EF", band: "f2", level: 4 },
  { id: "f5a", label: "5º ano — Fundamental", short: "5º EF", band: "f2", level: 5 },
  { id: "f6a", label: "6º ano — Fundamental", short: "6º EF", band: "f2", level: 6 },
  { id: "f7a", label: "7º ano — Fundamental", short: "7º EF", band: "f3", level: 7 },
  { id: "f8a", label: "8º ano — Fundamental", short: "8º EF", band: "f3", level: 8 },
  { id: "f9a", label: "9º ano — Fundamental", short: "9º EF", band: "f3", level: 9 },
  { id: "em1", label: "1º ano — Ensino Médio", short: "1º EM", band: "em", level: 10 },
  { id: "em2", label: "2º ano — Ensino Médio", short: "2º EM", band: "em", level: 11 },
  { id: "em3", label: "3º ano — Ensino Médio", short: "3º EM", band: "em", level: 12 },
];

export function getGrade(id: string): Grade {
  return GRADES.find((g) => g.id === id) ?? GRADES[0]!;
}

export type Subject = {
  id: string;
  name: string;
  color: string; // css var name in styles.css
};

export const SUBJECTS: Record<string, Subject> = {
  matematica: { id: "matematica", name: "Matemática", color: "subject-math" },
  portugues: { id: "portugues", name: "Português", color: "subject-lang" },
  ciencias: { id: "ciencias", name: "Ciências", color: "subject-science" },
  historia: { id: "historia", name: "História", color: "subject-history" },
  geografia: { id: "geografia", name: "Geografia", color: "subject-geo" },
  ingles: { id: "ingles", name: "Inglês", color: "subject-english" },
  fisica: { id: "fisica", name: "Física", color: "subject-physics" },
  quimica: { id: "quimica", name: "Química", color: "subject-chem" },
  biologia: { id: "biologia", name: "Biologia", color: "subject-bio" },
  literatura: { id: "literatura", name: "Literatura", color: "subject-lit" },
  filosofia: { id: "filosofia", name: "Filosofia", color: "subject-phil" },
  sociologia: { id: "sociologia", name: "Sociologia", color: "subject-socio" },
};

export function subjectsForGrade(gradeId: string): Subject[] {
  const g = getGrade(gradeId);
  if (g.band === "em") {
    return [
      "matematica",
      "portugues",
      "literatura",
      "fisica",
      "quimica",
      "biologia",
      "historia",
      "geografia",
      "ingles",
      "filosofia",
      "sociologia",
    ].map((s) => SUBJECTS[s]!);
  }
  const base = ["matematica", "portugues", "ciencias", "historia", "geografia"];
  if (g.level >= 3) base.push("ingles");
  return base.map((s) => SUBJECTS[s]!);
}

// ---------------------------------------------------------------------------
// Unidades por matéria e ano
// ---------------------------------------------------------------------------

type UnitMap = Record<string, string[]>;

const MAT: UnitMap = {
  f1a: ["Números até 20", "Somar e subtrair", "Formas e figuras", "Medidas do dia a dia", "Dinheiro e tempo"],
  f2a: ["Números até 100", "Adição com reserva", "Subtração", "Dobro e metade", "Gráficos simples"],
  f3a: ["Centenas e milhares", "Multiplicação", "Divisão", "Frações iniciais", "Medidas e horas"],
  f4a: ["Números até 10 000", "Multiplicação por 2 dígitos", "Divisão com resto", "Frações", "Perímetro e área"],
  f5a: ["Números decimais", "Operações com frações", "Porcentagem básica", "Geometria plana", "Média e gráficos"],
  f6a: ["Números naturais", "Múltiplos e divisores", "Frações e decimais", "Números negativos", "Ângulos e polígonos"],
  f7a: ["Números inteiros", "Números racionais", "Equações do 1º grau", "Proporção e regra de três", "Áreas e volumes"],
  f8a: ["Potenciação e notação científica", "Produtos notáveis", "Fatoração", "Sistemas de equações", "Geometria: ângulos"],
  f9a: ["Radiciação", "Equação do 2º grau", "Teorema de Pitágoras", "Semelhança e trigonometria", "Probabilidade e estatística"],
  em1: ["Conjuntos e funções", "Função afim", "Função quadrática", "Função exponencial e logaritmo", "Progressões (PA e PG)"],
  em2: ["Trigonometria", "Matrizes e determinantes", "Sistemas lineares", "Análise combinatória", "Probabilidade"],
  em3: ["Geometria espacial", "Geometria analítica", "Números complexos", "Polinômios", "Estatística e matemática financeira"],
};

const POR: UnitMap = {
  f1a: ["Alfabeto e sons", "Sílabas", "Primeiras palavras", "Frases simples", "Histórias curtas"],
  f2a: ["Encontros vocálicos", "Substantivos", "Frase e pontuação", "Leitura e sentido", "Escrita de bilhetes"],
  f3a: ["Adjetivos", "Verbos no presente", "Acentuação básica", "Sinônimos e antônimos", "Parágrafos"],
  f4a: ["Classes de palavras", "Tempos verbais", "Ortografia", "Interpretação de texto", "Narrativa"],
  f5a: ["Sujeito e predicado", "Concordância", "Pontuação avançada", "Gêneros textuais", "Produção de texto"],
  f6a: ["Fonologia", "Substantivo e adjetivo", "Verbos: modos", "Tipos de texto", "Coesão textual"],
  f7a: ["Pronomes", "Advérbios e preposições", "Período composto", "Figuras de linguagem", "Notícia e reportagem"],
  f8a: ["Vozes verbais", "Orações coordenadas", "Regência e crase", "Argumentação", "Resenha crítica"],
  f9a: ["Orações subordinadas", "Colocação pronominal", "Semântica", "Análise de textos", "Dissertação"],
  em1: ["Variação linguística", "Morfologia completa", "Sintaxe do período simples", "Gêneros e mídias", "Redação: estrutura"],
  em2: ["Sintaxe do período composto", "Crase e regência", "Coerência e coesão", "Texto argumentativo", "Interpretação avançada"],
  em3: ["Semântica e estilística", "Norma culta no ENEM", "Intertextualidade", "Redação nota 1000", "Revisão geral"],
};

const CIE: UnitMap = {
  f1a: ["Meu corpo", "Os cinco sentidos", "Animais", "Plantas", "Dia e noite"],
  f2a: ["Seres vivos", "Higiene e saúde", "Água", "Ar", "Estações do ano"],
  f3a: ["Cadeia alimentar", "Solo", "Materiais", "Sistema solar", "Alimentação"],
  f4a: ["Sistemas do corpo", "Ecossistemas", "Estados da matéria", "Energia", "Reciclagem"],
  f5a: ["Sistema digestório", "Sistema respiratório", "Misturas", "Luz e som", "Meio ambiente"],
  f6a: ["Células", "Rochas e minerais", "Atmosfera", "Máquinas simples", "Biodiversidade"],
  f7a: ["Reinos dos seres vivos", "Corpo humano avançado", "Calor e temperatura", "Ecologia", "Saúde pública"],
  f8a: ["Reprodução", "Sistema nervoso", "Eletricidade", "Ondas", "Universo"],
  f9a: ["Química: átomos", "Reações químicas", "Leis de Newton", "Genética inicial", "Tecnologia e sociedade"],
};

const HIS: UnitMap = {
  f1a: ["Eu e minha família", "Minha escola", "Tempo e memória", "Brincadeiras de antes", "Comunidade"],
  f2a: ["Meu bairro", "Trabalho e profissões", "Datas comemorativas", "Fontes históricas", "Mudanças no tempo"],
  f3a: ["Povos indígenas", "Colonização", "Cidade e campo", "Migrações", "Patrimônio cultural"],
  f4a: ["Pré-história", "Primeiras civilizações", "Brasil indígena", "Grandes navegações", "Escravidão"],
  f5a: ["Brasil Colônia", "Independência", "Império", "República", "Cidadania"],
  f6a: ["Egito e Mesopotâmia", "Grécia Antiga", "Roma Antiga", "Idade Média", "Feudalismo"],
  f7a: ["Renascimento", "Reformas religiosas", "Absolutismo", "Colonização da América", "Iluminismo"],
  f8a: ["Revolução Francesa", "Revolução Industrial", "Independências americanas", "Brasil Império", "Abolição"],
  f9a: ["Primeira Guerra", "Era Vargas", "Segunda Guerra", "Guerra Fria", "Ditadura militar no Brasil"],
  em1: ["Antiguidade e Medievo", "Modernidade europeia", "Brasil Colônia", "Revoluções burguesas", "Século XIX"],
  em2: ["Imperialismo", "Guerras mundiais", "Brasil República", "Era Vargas", "Guerra Fria"],
  em3: ["Ditaduras na América Latina", "Redemocratização", "Globalização", "Brasil contemporâneo", "Século XXI"],
};

const GEO: UnitMap = {
  f1a: ["Onde eu moro", "Paisagens", "Escola e rua", "Natureza", "Mapas simples"],
  f2a: ["Cidade e campo", "Moradias", "Transportes", "Tempo e clima", "Meio ambiente"],
  f3a: ["Município", "Zona urbana e rural", "Água e rios", "Relevo", "Trabalho e paisagem"],
  f4a: ["Estados e regiões", "Mapas e legendas", "Clima do Brasil", "Vegetação", "População"],
  f5a: ["Brasil: regiões", "Economia", "Urbanização", "Recursos naturais", "Problemas ambientais"],
  f6a: ["Cartografia", "Estrutura da Terra", "Hidrografia", "Climas do mundo", "Biomas"],
  f7a: ["Regiões brasileiras", "Indústria no Brasil", "Agropecuária", "Cidades brasileiras", "Meio ambiente no Brasil"],
  f8a: ["América Latina", "América Anglo-saxônica", "África", "Europa", "Globalização"],
  f9a: ["Ásia", "Oriente Médio", "Oceania e Antártida", "Geopolítica", "Blocos econômicos"],
  em1: ["Cartografia e geotecnologias", "Geologia e relevo", "Clima e biomas", "Hidrografia", "Questões ambientais"],
  em2: ["População mundial", "Urbanização", "Indústria", "Agricultura", "Energia"],
  em3: ["Geopolítica mundial", "Globalização", "Brasil no mundo", "Conflitos atuais", "Sustentabilidade"],
};

const ING: UnitMap = {
  f3a: ["Greetings", "Numbers", "Colors", "Family", "Animals"],
  f4a: ["School objects", "Days and months", "Food", "Verb to be", "My house"],
  f5a: ["Present simple", "Hobbies", "Clothes", "Body parts", "Places in town"],
  f6a: ["Present continuous", "Possessives", "Prepositions", "Daily routine", "Weather"],
  f7a: ["Simple past", "Comparatives", "Modal verbs", "Food and drinks", "Travel"],
  f8a: ["Future forms", "Present perfect", "Superlatives", "Phrasal verbs", "Technology"],
  f9a: ["Conditionals", "Passive voice", "Reported speech", "Reading skills", "Writing emails"],
  em1: ["Tenses review", "Reading strategies", "Vocabulary building", "Conditionals", "Culture"],
  em2: ["Advanced grammar", "Text interpretation", "Idioms", "Academic English", "Listening cues"],
  em3: ["ENEM English", "Cognates and false friends", "Argumentative texts", "Global issues", "Exam practice"],
};

const FIS: UnitMap = {
  em1: ["Cinemática", "Leis de Newton", "Trabalho e energia", "Estática", "Hidrostática"],
  em2: ["Termologia", "Calorimetria", "Óptica", "Ondulatória", "Termodinâmica"],
  em3: ["Eletrostática", "Eletrodinâmica", "Magnetismo", "Física moderna", "Revisão ENEM"],
};

const QUI: UnitMap = {
  em1: ["Matéria e energia", "Atomística", "Tabela periódica", "Ligações químicas", "Funções inorgânicas"],
  em2: ["Reações químicas", "Estequiometria", "Soluções", "Termoquímica", "Cinética e equilíbrio"],
  em3: ["Eletroquímica", "Química orgânica: introdução", "Funções orgânicas", "Isomeria", "Reações orgânicas"],
};

const BIO: UnitMap = {
  em1: ["Bioquímica celular", "Citologia", "Divisão celular", "Histologia", "Origem da vida"],
  em2: ["Genética", "Evolução", "Reino dos seres vivos", "Fisiologia humana", "Doenças e imunidade"],
  em3: ["Ecologia", "Biomas brasileiros", "Biotecnologia", "Meio ambiente", "Revisão ENEM"],
};

const LIT: UnitMap = {
  em1: ["Trovadorismo e Classicismo", "Quinhentismo", "Barroco", "Arcadismo", "Introdução à análise literária"],
  em2: ["Romantismo", "Realismo e Naturalismo", "Parnasianismo", "Simbolismo", "Pré-Modernismo"],
  em3: ["Modernismo 1ª fase", "Modernismo 2ª fase", "Modernismo 3ª fase", "Literatura contemporânea", "Obras do vestibular"],
};

const FIL: UnitMap = {
  em1: ["O que é filosofia", "Filósofos pré-socráticos", "Sócrates e Platão", "Aristóteles", "Filosofia medieval"],
  em2: ["Racionalismo e empirismo", "Kant", "Ética", "Filosofia política", "Existencialismo"],
  em3: ["Filosofia contemporânea", "Escola de Frankfurt", "Bioética", "Estética", "Lógica e argumentação"],
};

const SOC: UnitMap = {
  em1: ["O que é sociologia", "Clássicos: Durkheim", "Weber", "Marx", "Cultura e sociedade"],
  em2: ["Trabalho e sociedade", "Movimentos sociais", "Desigualdade social", "Cidadania e direitos", "Política e Estado"],
  em3: ["Globalização", "Violência e segurança", "Meio ambiente e sociedade", "Mídia e opinião", "Brasil contemporâneo"],
};

const UNITS: Record<string, UnitMap> = {
  matematica: MAT,
  portugues: POR,
  ciencias: CIE,
  historia: HIS,
  geografia: GEO,
  ingles: ING,
  fisica: FIS,
  quimica: QUI,
  biologia: BIO,
  literatura: LIT,
  filosofia: FIL,
  sociologia: SOC,
};

export const LESSONS_PER_UNIT = 5;

export type Unit = {
  index: number;
  title: string;
  subjectId: string;
  gradeId: string;
  lessons: LessonRef[];
};

export type LessonRef = {
  id: string;
  unitIndex: number;
  lessonIndex: number;
  gradeId: string;
  subjectId: string;
  unitTitle: string;
};

export function unitsFor(gradeId: string, subjectId: string): Unit[] {
  const titles = UNITS[subjectId]?.[gradeId] ?? [];
  return titles.map((title, i) => ({
    index: i,
    title,
    subjectId,
    gradeId,
    lessons: Array.from({ length: LESSONS_PER_UNIT }, (_, j) => ({
      id: `${gradeId}-${subjectId}-${i}-${j}`,
      unitIndex: i,
      lessonIndex: j,
      gradeId,
      subjectId,
      unitTitle: title,
    })),
  }));
}

export function parseLessonId(id: string): LessonRef | null {
  const [gradeId, subjectId, u, l] = id.split("-");
  if (!gradeId || !subjectId || u === undefined || l === undefined) return null;
  const units = unitsFor(gradeId, subjectId);
  const unit = units[Number(u)];
  if (!unit) return null;
  return unit.lessons[Number(l)] ?? null;
}

export function totalLessons(gradeId: string, subjectId: string) {
  return unitsFor(gradeId, subjectId).length * LESSONS_PER_UNIT;
}
