// Classificação de unidades em tópicos, para que os exercícios de uma lição
// combinem com o assunto da unidade (ex.: "Formas e figuras" -> geometria).

export type TopicKey =
  | "numeros"
  | "operacoes"
  | "geometria"
  | "medidas"
  | "dinheirotempo"
  | "fracoes"
  | "porcentagem"
  | "estatistica"
  | "algebra"
  | "potencias"
  | "trigonometria"
  | "combinatoria"
  | "funcoes"
  | "sequencias"
  | "financeira"
  | "complexos"
  | "generico";

const RULES: [TopicKey, RegExp][] = [
  ["geometria", /geometr|forma|figura|ângulo|angulo|polígono|poligono|pitágoras|pitagoras|semelhan|espacial|analítica|analitica|círculo|circulo|triângulo|triangulo/i],
  ["medidas", /medida|perímetro|perimetro|área|area|volume|comprimento|massa|capacidade/i],
  ["dinheirotempo", /dinheiro|tempo|hora|calendário|calendario|moeda/i],
  ["fracoes", /fração|fracao|frações|fracoes|decimal|decimais|racional/i],
  ["porcentagem", /porcentagem|proporção|proporcao|regra de três|regra de tres|razão|razao/i],
  ["estatistica", /estatíst|estatist|gráfico|grafico|média|media|probabilidade|dados/i],
  ["combinatoria", /combinat|arranjo|permuta|contagem de possibilidades/i],
  ["trigonometria", /trigonometr|seno|cosseno|tangente/i],
  ["potencias", /potenc|radicia|raiz|notação científica|notacao cientifica|expoente/i],
  ["sequencias", /progress|sequência|sequencia|\bpa\b|\bpg\b/i],
  ["financeira", /financeir|juros|montante/i],
  ["complexos", /complexo|polinômio|polinomio|matriz|determinante|sistemas lineares/i],
  ["funcoes", /função|funcao|funções|funcoes|conjunto|logaritmo|exponencial/i],
  ["algebra", /equação|equacao|equações|equacoes|incógnita|incognita|fatoração|fatoracao|produto notável|produtos notáveis|sistema|inteiro|negativo/i],
  ["operacoes", /somar|adição|adicao|subtra|multiplic|divis|dobro|metade|operaç|operac|múltiplo|multiplo|divisor/i],
  ["numeros", /número|numero|números|numeros|centena|milhar|contagem|natural/i],
];

export function unitTopic(unitTitle: string): TopicKey {
  for (const [key, re] of RULES) if (re.test(unitTitle)) return key;
  return "generico";
}

/** Palavras significativas do título da unidade, para casar com bancos de questões. */
const STOP = new Set([
  "e", "de", "do", "da", "dos", "das", "a", "o", "as", "os", "com", "em", "no", "na",
  "para", "por", "um", "uma", "ao", "à", "sobre", "the", "and", "of",
]);

export function unitKeywords(unitTitle: string): string[] {
  return normalizeText(unitTitle)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3 && !STOP.has(w))
    .map((w) => w.replace(/(coes|oes|ais|es|s)$/, ""))
    .filter((w) => w.length > 3);
}

export function normalizeText(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Pontua o quanto um texto de questão combina com a unidade. */
export function topicScore(text: string, keywords: string[]): number {
  const t = normalizeText(text);
  let score = 0;
  for (const k of keywords) if (t.includes(k)) score += 1;
  return score;
}
