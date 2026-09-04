// Bancos de questões de idiomas (Inglês e Espanhol) organizados por tema da
// unidade, para que cada unidade traga atividades realmente relacionadas ao
// assunto estudado.

import { normalizeText } from "./topics";

export type LangExercise =
  | { kind: "select"; prompt: string; options: string[]; answer: number }
  | { kind: "assemble"; prompt: string; sentence: string }
  | { kind: "truefalse"; prompt: string; answer: boolean };

const s = (prompt: string, options: string[], answer = 0): LangExercise => ({
  kind: "select",
  prompt,
  options,
  answer,
});
const a = (prompt: string, sentence: string): LangExercise => ({ kind: "assemble", prompt, sentence });
const t = (prompt: string, answer: boolean): LangExercise => ({ kind: "truefalse", prompt, answer });

export type LangTheme =
  | "greetings"
  | "numbers"
  | "colors"
  | "family"
  | "animals"
  | "school"
  | "present"
  | "continuous"
  | "past"
  | "future"
  | "comparatives"
  | "advanced";

const THEME_RULES: [LangTheme, RegExp][] = [
  ["greetings", /greeting|hello|saluda|saludo|presenta|cultur|apresenta/i],
  ["numbers", /number|númer|numer|day|month|calendar|fecha|hora|time/i],
  ["colors", /color|cores|clothes|ropa|vestu/i],
  ["family", /family|famil|body|cuerpo|corpo/i],
  ["animals", /animal|food|comida|drink|bebida|aliment|fruta/i],
  ["school", /school|escuela|escola|house|casa|hogar|places|lugar|town|ciudad/i],
  ["continuous", /continuous|continuo|gerundio|possessive|posesiv|preposition|preposici|weather|clima|tiempo atmosf/i],
  ["past", /past|pasado|pretérito|preterito|perfect|perfecto|history/i],
  ["future", /future|futuro|modal|travel|viaje|technolog|tecnolog|plans/i],
  ["comparatives", /comparativ|superlativ|phrasal|idiom|expres/i],
  ["advanced", /conditional|condicional|passive|pasiva|reported|indirect|reading|lectura|writing|escrit|vocabul|exam|enem|grammar|gramática|gramatica|advanced|avanzad|interpret|global|academic|subjuntivo|subjunctive/i],
  ["present", /present|presente|routine|rutina|hobby|hobbies|verb|verbo|ser|estar|to be|daily|diária|diaria/i],
];

export function langTheme(unitTitle: string): LangTheme {
  for (const [key, re] of THEME_RULES) if (re.test(unitTitle) || re.test(normalizeText(unitTitle))) return key;
  return "present";
}

// ---------------------------------------------------------------- Inglês ----
const EN: Record<LangTheme, LangExercise[]> = {
  greetings: [
    s("Como se diz 'olá' em inglês?", ["Hello", "Goodbye", "Please", "Thanks"]),
    s("'Good morning' é usado:", ["De manhã", "À noite", "À tarde", "Na madrugada"]),
    s("Alguém diz 'Thank you'. Você responde:", ["You're welcome", "Good night", "See you", "How old"]),
    a("Monte a apresentação", "hello my name is Ana"),
    s("'Nice to meet you' significa:", ["Prazer em conhecer você", "Até logo", "Bom dia", "Por favor"]),
    t("'Goodbye' é uma forma de despedida.", true),
    s("Para perguntar o nome de alguém:", ["What's your name?", "How old are you?", "Where is it?", "What time?"]),
    s("'How are you?' pede saber:", ["Como você está", "Sua idade", "Seu endereço", "Sua cor favorita"]),
  ],
  numbers: [
    s("'Seven' em português é:", ["Sete", "Seis", "Oito", "Nove"]),
    s("Qual é o número 'twelve'?", ["12", "20", "2", "21"]),
    s("O primeiro dia da semana em inglês (calendário americano):", ["Sunday", "Monday", "Friday", "Saturday"]),
    s("'August' é o mês de:", ["Agosto", "Abril", "Outubro", "Julho"]),
    s("'It's half past three' significa:", ["3h30", "3h15", "2h30", "4h45"]),
    a("Monte a frase", "today is Monday the tenth"),
    t("'Thirty' significa 13.", false),
    s("'Wednesday' é:", ["Quarta-feira", "Terça-feira", "Quinta-feira", "Domingo"]),
  ],
  colors: [
    s("What is 'blue'?", ["Azul", "Verde", "Amarelo", "Roxo"]),
    s("A cor 'yellow' é:", ["Amarelo", "Preto", "Branco", "Cinza"]),
    s("'Black and white' são:", ["Preto e branco", "Azul e verde", "Rosa e roxo", "Marrom e cinza"]),
    s("Você usa 'shoes' nos:", ["Pés", "Braços", "Cabelo", "Olhos"]),
    s("'T-shirt' é:", ["Camiseta", "Calça", "Sapato", "Chapéu"]),
    a("Monte a frase", "she is wearing a red dress"),
    t("'Green' é a cor verde.", true),
    s("'Trousers/pants' significam:", ["Calças", "Meias", "Casaco", "Luvas"]),
  ],
  family: [
    s("'Sister' é:", ["Irmã", "Irmão", "Prima", "Tia"]),
    s("O pai da sua mãe é seu:", ["Grandfather", "Uncle", "Cousin", "Nephew"]),
    s("'Hand' é parte do corpo:", ["Mão", "Pé", "Cabeça", "Ombro"]),
    s("'Eyes' são:", ["Olhos", "Orelhas", "Dentes", "Dedos"]),
    a("Monte a frase", "my brother is ten years old"),
    t("'Aunt' significa tia.", true),
    s("'Parents' significa:", ["Pais", "Parentes distantes", "Avós", "Filhos"]),
    s("Complete: 'This is my ___ and she is a doctor.'", ["mother", "father", "brother", "uncle"]),
  ],
  animals: [
    s("How do you say 'macaco'?", ["Monkey", "Donkey", "Turkey", "Mouse"]),
    s("'Cow' é:", ["Vaca", "Cavalo", "Cabra", "Ovelha"]),
    s("'Breakfast' é:", ["Café da manhã", "Almoço", "Jantar", "Sobremesa"]),
    s("Qual é uma fruta?", ["Apple", "Bread", "Cheese", "Rice"]),
    a("Monte a frase", "I like to eat apples every day"),
    t("'Water' significa água.", true),
    s("'Chicken' pode significar:", ["Frango", "Peixe", "Carne bovina", "Ovo"]),
    s("'I'm thirsty' quer dizer que você está com:", ["Sede", "Fome", "Sono", "Frio"]),
  ],
  school: [
    s("'Notebook' é:", ["Caderno", "Mochila", "Borracha", "Régua"]),
    s("'Eraser' serve para:", ["Apagar", "Escrever", "Medir", "Cortar"]),
    s("Onde você compra remédios?", ["Pharmacy", "Bakery", "Library", "Bank"]),
    s("'Kitchen' é o cômodo onde:", ["Cozinhamos", "Dormimos", "Tomamos banho", "Recebemos visitas"]),
    a("Monte a frase", "there is a book on the desk"),
    t("'Library' significa livraria.", false),
    s("'Bedroom' é:", ["Quarto", "Sala", "Cozinha", "Banheiro"]),
    s("'Turn left' significa:", ["Vire à esquerda", "Vire à direita", "Siga em frente", "Pare"]),
  ],
  present: [
    s("Complete: I ___ a student.", ["am", "is", "are", "be"]),
    s("Complete: She ___ soccer every Sunday.", ["plays", "play", "playing", "played"]),
    s("Forma negativa: 'He ___ like coffee.'", ["doesn't", "don't", "isn't", "aren't"]),
    s("Pergunta correta:", ["Do you study English?", "You study English?", "Does you study?", "Are you study?"]),
    a("Monte a frase", "I wake up at seven every day"),
    t("Com he/she/it, o verbo no present simple recebe -s.", true),
    s("'They ___ my friends.'", ["are", "is", "am", "be"]),
    s("'My hobby is ___ books.'", ["reading", "read", "reads", "to reads"]),
  ],
  continuous: [
    s("Complete: 'She ___ studying now.'", ["is", "are", "am", "be"]),
    s("Present continuous de 'run':", ["running", "runing", "runned", "runs"]),
    s("'It is raining' significa:", ["Está chovendo", "Está frio", "Está nevando", "Está ensolarado"]),
    s("Possessivo correto: 'This is ___ book.' (de mim)", ["my", "mine", "me", "I"]),
    s("Preposição correta: 'The cat is ___ the table.'", ["under", "in", "at", "of"]),
    a("Monte a frase", "they are playing in the park now"),
    t("O present continuous usa verbo to be + verbo com -ing.", true),
    s("'What's the weather like?' pergunta sobre:", ["O tempo/clima", "A hora", "O lugar", "O preço"]),
  ],
  past: [
    s("Past of 'go':", ["went", "goed", "gone", "going"]),
    s("Past of 'see':", ["saw", "seed", "seen", "sees"]),
    s("Complete: 'I ___ to school yesterday.'", ["walked", "walk", "walking", "walks"]),
    s("Present perfect: 'I ___ finished my homework.'", ["have", "has", "had", "having"]),
    s("'She has lived here ___ 2010.'", ["since", "for", "ago", "from"]),
    a("Monte a frase", "we visited our grandparents last weekend"),
    t("O passado simples de verbos regulares termina em -ed.", true),
    s("Past of 'buy':", ["bought", "buyed", "brought", "buy"]),
  ],
  future: [
    s("Future com 'will': 'I ___ call you later.'", ["will", "am", "did", "would"]),
    s("'I'm going to travel' indica:", ["Plano futuro", "Passado", "Rotina", "Ordem"]),
    s("Modal de habilidade:", ["can", "must", "should", "may"]),
    s("'You must wear a seatbelt' expressa:", ["Obrigação", "Possibilidade", "Desejo", "Dúvida"]),
    s("'Boarding pass' é usado:", ["No aeroporto", "No hospital", "Na escola", "No mercado"]),
    a("Monte a frase", "I will study abroad next year"),
    t("'Should' é usado para dar conselhos.", true),
    s("'Download' em português é:", ["Baixar", "Enviar", "Apagar", "Ligar"]),
  ],
  comparatives: [
    s("'This book is ___ than that one.'", ["better", "best", "gooder", "more good"]),
    s("Comparativo de 'big':", ["bigger", "more big", "biggest", "bigges"]),
    s("Superlativo de 'expensive':", ["the most expensive", "expensiver", "the expensivest", "more expensive"]),
    s("'As tall as' indica:", ["Igualdade", "Superioridade", "Inferioridade", "Negação"]),
    s("O phrasal verb 'give up' significa:", ["Desistir", "Continuar", "Entregar", "Levantar"]),
    a("Monte a frase", "she is the fastest runner in the team"),
    t("Adjetivos curtos formam o superlativo com -est.", true),
    s("'It's raining cats and dogs' é um idiom que significa:", ["Chover muito", "Fazer sol", "Nevar", "Ventar"]),
  ],
  advanced: [
    s("'If I had money, I ___ travel.'", ["would", "will", "am", "did"]),
    s("Passive voice de 'They built the house':", ["The house was built", "The house builds", "The house is build", "House built was"]),
    s("Reported speech: He said he ___ tired.", ["was", "is", "will be", "be"]),
    s("'Actually' é falso cognato e significa:", ["Na verdade", "Atualmente", "Rapidamente", "Talvez"]),
    s("A ideia central de um texto é o:", ["Main idea / gist", "Detail", "Reference", "Prefix"]),
    a("Build the sentence", "climate change affects everyone in the world"),
    t("'Despite' é seguido por substantivo ou gerúndio.", true),
    s("Em provas como o ENEM, ler o enunciado ajuda a:", ["Identificar o objetivo da questão", "Ignorar o texto", "Chutar mais rápido", "Traduzir tudo"]),
  ],
};

// -------------------------------------------------------------- Espanhol ----
const ES: Record<LangTheme, LangExercise[]> = {
  greetings: [
    s("Como se diz 'olá' em espanhol?", ["Hola", "Adiós", "Gracias", "Por favor"]),
    s("'Buenos días' é usado:", ["De manhã", "À noite", "À tarde", "Na madrugada"]),
    s("Alguém diz 'Gracias'. Você responde:", ["De nada", "Hasta luego", "Buenas noches", "¿Qué tal?"]),
    a("Monte a apresentação", "hola me llamo Ana"),
    s("'Mucho gusto' significa:", ["Muito prazer", "Até logo", "Boa noite", "Com licença"]),
    t("'Adiós' é uma despedida.", true),
    s("Para perguntar o nome:", ["¿Cómo te llamas?", "¿Cuántos años?", "¿Dónde está?", "¿Qué hora es?"]),
    s("'¿Qué tal?' quer saber:", ["Como você está", "Sua idade", "Seu nome completo", "Seu endereço"]),
  ],
  numbers: [
    s("'Siete' em português é:", ["Sete", "Seis", "Oito", "Nove"]),
    s("Qual é o número 'doce'?", ["12", "2", "20", "10"]),
    s("'Miércoles' é:", ["Quarta-feira", "Terça-feira", "Quinta-feira", "Sábado"]),
    s("'Enero' é o mês de:", ["Janeiro", "Junho", "Julho", "Março"]),
    s("'Son las tres y media' significa:", ["3h30", "3h15", "2h30", "4h30"]),
    a("Monte a frase", "hoy es lunes diez de mayo"),
    t("'Treinta' significa trinta.", true),
    s("'Cuarenta' é:", ["40", "14", "4", "44"]),
  ],
  colors: [
    s("'Azul' em português é:", ["Azul", "Verde", "Amarelo", "Vermelho"]),
    s("A cor 'amarillo' é:", ["Amarelo", "Preto", "Branco", "Roxo"]),
    s("'Rojo y negro' são:", ["Vermelho e preto", "Verde e azul", "Rosa e roxo", "Branco e cinza"]),
    s("'Zapatos' são usados nos:", ["Pés", "Braços", "Olhos", "Cabelo"]),
    s("'Camiseta' em espanhol significa:", ["Camiseta", "Calça", "Casaco", "Meia"]),
    a("Monte a frase", "ella lleva un vestido rojo"),
    t("'Blanco' significa branco.", true),
    s("'Pantalones' são:", ["Calças", "Sapatos", "Luvas", "Chapéus"]),
  ],
  family: [
    s("'Hermana' é:", ["Irmã", "Irmão", "Prima", "Tia"]),
    s("O pai da sua mãe é seu:", ["Abuelo", "Tío", "Primo", "Sobrino"]),
    s("'Mano' é parte do corpo:", ["Mão", "Pé", "Cabeça", "Ombro"]),
    s("'Ojos' são:", ["Olhos", "Orelhas", "Dentes", "Dedos"]),
    a("Monte a frase", "mi hermano tiene diez años"),
    t("'Tía' significa tia.", true),
    s("'Padres' significa:", ["Pais", "Padres religiosos", "Avós", "Filhos"]),
    s("Cuidado com o falso amigo: 'embarazada' significa:", ["Grávida", "Envergonhada", "Cansada", "Apressada"]),
  ],
  animals: [
    s("'Perro' é:", ["Cachorro", "Gato", "Cavalo", "Pássaro"]),
    s("'Vaca' em espanhol significa:", ["Vaca", "Cabra", "Ovelha", "Porco"]),
    s("'Desayuno' é:", ["Café da manhã", "Almoço", "Jantar", "Sobremesa"]),
    s("Qual é uma fruta?", ["Manzana", "Pan", "Queso", "Arroz"]),
    a("Monte a frase", "me gusta comer manzanas todos los días"),
    t("'Agua' significa água.", true),
    s("Falso amigo: 'exquisito' significa:", ["Delicioso", "Estranho", "Esquisito", "Barato"]),
    s("'Tengo hambre' significa:", ["Estou com fome", "Estou com sede", "Estou com sono", "Estou com frio"]),
  ],
  school: [
    s("'Cuaderno' é:", ["Caderno", "Mochila", "Borracha", "Régua"]),
    s("'Borrador' serve para:", ["Apagar", "Escrever", "Medir", "Colar"]),
    s("Onde você compra remédios?", ["Farmacia", "Panadería", "Librería", "Banco"]),
    s("'Cocina' é o cômodo onde:", ["Cozinhamos", "Dormimos", "Tomamos banho", "Estudamos"]),
    a("Monte a frase", "hay un libro sobre la mesa"),
    t("Falso amigo: 'oficina' significa escritório.", true),
    s("'Dormitorio' é:", ["Quarto", "Sala", "Cozinha", "Banheiro"]),
    s("'Gira a la izquierda' significa:", ["Vire à esquerda", "Vire à direita", "Siga em frente", "Pare"]),
  ],
  present: [
    s("Complete: Yo ___ estudiante.", ["soy", "estoy", "es", "eres"]),
    s("Complete: Ella ___ fútbol los domingos.", ["juega", "jugar", "juego", "jugamos"]),
    s("'Estar' é usado para:", ["Estados e lugares", "Profissão permanente", "Nacionalidade", "Origem"]),
    s("Conjugação de 'comer' para 'nosotros':", ["comemos", "comen", "come", "coméis"]),
    a("Monte a frase", "me levanto a las siete todos los días"),
    t("Verbos regulares em -ar fazem 'yo' terminando em -o.", true),
    s("'Ellos ___ mis amigos.'", ["son", "están", "es", "somos"]),
    s("'Mi pasatiempo es ___ libros.'", ["leer", "leo", "leyendo mucho", "lees"]),
  ],
  continuous: [
    s("Complete: 'Ella ___ estudiando ahora.'", ["está", "es", "son", "estoy"]),
    s("Gerúndio de 'correr':", ["corriendo", "correndo", "corrando", "corrido"]),
    s("'Está lloviendo' significa:", ["Está chovendo", "Está frio", "Está nevando", "Está sol"]),
    s("Possessivo correto: 'Este es ___ libro.' (meu)", ["mi", "mío de mí", "me", "yo"]),
    s("Preposição correta: 'El gato está ___ la mesa.'", ["debajo de", "en el", "a la", "de los"]),
    a("Monte a frase", "ellos están jugando en el parque"),
    t("O gerúndio em espanhol termina em -ando/-iendo.", true),
    s("'¿Qué tiempo hace?' pergunta sobre:", ["O clima", "A hora", "O lugar", "O preço"]),
  ],
  past: [
    s("Pretérito de 'ir' (yo):", ["fui", "iba", "iré", "voy"]),
    s("Pretérito indefinido de 'comer' (yo):", ["comí", "comía", "comeré", "como"]),
    s("Complete: 'Ayer ___ a la escuela.'", ["caminé", "camino", "caminaré", "caminando"]),
    s("Pretérito perfecto: 'He ___ la tarea.'", ["terminado", "terminar", "terminé", "terminando"]),
    s("'Vivo aquí ___ 2010.'", ["desde", "hace de", "por que", "para"]),
    a("Monte a frase", "visitamos a nuestros abuelos el fin de semana"),
    t("O imperfeito descreve ações habituais no passado.", true),
    s("Pretérito de 'tener' (él):", ["tuvo", "tenió", "tenía sido", "tiene"]),
  ],
  future: [
    s("Futuro: 'Mañana ___ a la playa.'", ["iré", "fui", "iba", "voy ayer"]),
    s("'Voy a viajar' indica:", ["Plano futuro", "Passado", "Ordem", "Dúvida"]),
    s("Verbo que indica habilidade:", ["poder", "deber", "querer", "haber"]),
    s("'Debes usar cinturón' expressa:", ["Obrigação", "Possibilidade", "Desejo", "Passado"]),
    s("'Tarjeta de embarque' é usada:", ["No aeroporto", "No hospital", "Na escola", "No mercado"]),
    a("Monte a frase", "estudiaré en el extranjero el próximo año"),
    t("O futuro simples usa o infinitivo + terminações (-é, -ás, -á).", true),
    s("'Descargar' em português é:", ["Baixar", "Enviar", "Apagar", "Ligar"]),
  ],
  comparatives: [
    s("'Este libro es ___ que aquel.'", ["mejor", "más bueno", "el mejor", "buenísimo que"]),
    s("Comparativo de superioridade:", ["más ... que", "tan ... como", "menos ... de", "muy ... que"]),
    s("Superlativo de 'caro':", ["el más caro", "carísimo que", "más caro de que", "tan caro"]),
    s("'Tan alto como' indica:", ["Igualdade", "Superioridade", "Inferioridade", "Negação"]),
    s("A expressão 'echar de menos' significa:", ["Sentir falta", "Jogar fora", "Menosprezar", "Diminuir"]),
    a("Monte a frase", "ella es la más rápida del equipo"),
    t("'Menos ... que' expressa inferioridade.", true),
    s("'Estar en las nubes' significa:", ["Estar distraído", "Estar feliz", "Estar doente", "Estar atrasado"]),
  ],
  advanced: [
    s("'Si tuviera dinero, ___ de viaje.'", ["iría", "voy", "fui", "iré"]),
    s("Voz passiva de 'Ellos construyeron la casa':", ["La casa fue construida", "La casa construye", "La casa es construir", "Casa construida fue"]),
    s("Discurso indireto: Dijo que ___ cansado.", ["estaba", "está", "estará", "estar"]),
    s("Falso amigo: 'rato' em espanhol significa:", ["Momento", "Rato (animal)", "Ratinho", "Barato"]),
    s("A ideia central de um texto é a:", ["Idea principal", "Detalle", "Referencia", "Prefijo"]),
    a("Monte a frase", "el cambio climático afecta a todo el mundo"),
    t("O subjuntivo é usado para desejos e hipóteses.", true),
    s("No ENEM, os textos em espanhol costumam cobrar:", ["Interpretação", "Tradução literal", "Ditado", "Caligrafia"]),
  ],
};

export function langBanks(subjectId: string, unitTitle: string): { main: LangExercise[]; rest: LangExercise[] } {
  const theme = langTheme(unitTitle);
  const all = subjectId === "espanhol" ? ES : EN;
  const main = all[theme] ?? [];
  const rest = (Object.keys(all) as LangTheme[]).filter((k) => k !== theme).flatMap((k) => all[k]);
  return { main, rest };
}
