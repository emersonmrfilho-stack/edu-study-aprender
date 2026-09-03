import { getGrade, parseLessonId, LESSONS_PER_UNIT, type Band } from "./curriculum";
import { EXTRA_BANKS } from "./questions-extra";
import { unitTopic, unitKeywords, topicScore, type TopicKey } from "./topics";

export type Exercise =
  | { kind: "select"; prompt: string; options: string[]; answer: number; hint?: string; explanation?: string; image?: string }
  | { kind: "type"; prompt: string; answer: string; hint?: string; explanation?: string; image?: string }
  | { kind: "assemble"; prompt: string; sentence: string; explanation?: string; image?: string }
  | { kind: "truefalse"; prompt: string; answer: boolean; explanation?: string; image?: string };

// ---------- helpers ----------
function sel(prompt: string, options: string[], answer: number): Exercise {
  return { kind: "select", prompt, options, answer };
}
function tf(prompt: string, answer: boolean): Exercise {
  return { kind: "truefalse", prompt, answer };
}
function asm(prompt: string, sentence: string): Exercise {
  return { kind: "assemble", prompt, sentence };
}
function typ(prompt: string, answer: string): Exercise {
  return { kind: "type", prompt, answer };
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Rng = () => number;
const ri = (r: Rng, min: number, max: number) => min + Math.floor(r() * (max - min + 1));
function shuffle<T>(arr: T[], r: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
function numOptions(r: Rng, correct: number, prompt: string): Exercise {
  const set = new Set<number>([correct]);
  while (set.size < 4) {
    const delta = ri(r, 1, Math.max(3, Math.round(Math.abs(correct) * 0.3) + 3));
    const cand = r() > 0.5 ? correct + delta : correct - delta;
    if (cand !== correct) set.add(cand);
  }
  const opts = shuffle([...set], r).map(String);
  return sel(prompt, opts, opts.indexOf(String(correct)));
}

// ---------- Geradores por tópico da unidade ----------
/**
 * Gera um exercício ligado ao assunto da unidade (geometria, frações, etc.).
 * Retorna null quando o tópico não tem gerador próprio para aquele nível.
 */
function topicMathExercise(topic: TopicKey, level: number, r: Rng, slot: number): Exercise | null {
  const pick = (fns: ((r: Rng) => Exercise)[]) => fns[slot % fns.length]!(r);

  if (topic === "geometria") {
    if (level <= 3) {
      return pick([
        () => sel("Qual figura tem 3 lados?", ["Triângulo", "Quadrado", "Círculo", "Retângulo"], 0),
        () => sel("Qual figura NÃO tem lados retos?", ["Círculo", "Quadrado", "Triângulo", "Pentágono"], 0),
        () => sel("Quantos lados tem um quadrado?", ["4", "3", "5", "6"], 0),
        () => tf("Um retângulo tem 4 cantos (vértices).", true),
        () => sel("Qual objeto tem forma de círculo?", ["Uma roda", "Uma porta", "Um livro", "Uma caixa"], 0),
        () => sel("Quantos lados tem um pentágono?", ["5", "4", "6", "3"], 0),
        () => sel("A forma de uma bola é:", ["Esfera", "Cubo", "Cilindro", "Cone"], 0),
        () => tf("O triângulo tem mais lados que o quadrado.", false),
      ]);
    }
    if (level <= 6) {
      return pick([
        (r) => {
          const l = ri(r, 3, 15);
          const w = ri(r, 3, 15);
          return numOptions(r, 2 * (l + w), `Qual é o perímetro de um retângulo de ${l} cm por ${w} cm? (em cm)`);
        },
        (r) => {
          const l = ri(r, 3, 15);
          return numOptions(r, l * l, `Qual é a área de um quadrado de lado ${l} cm? (em cm²)`);
        },
        (r) => {
          const b = ri(r, 4, 16);
          const h = ri(r, 2, 10) * 2;
          return numOptions(r, (b * h) / 2, `Qual é a área de um triângulo de base ${b} cm e altura ${h} cm? (em cm²)`);
        },
        () => sel("Um ângulo de 90° é chamado de:", ["Reto", "Agudo", "Obtuso", "Raso"], 0),
        () => sel("Quantos graus tem a soma dos ângulos internos de um triângulo?", ["180°", "90°", "360°", "270°"], 0),
        () => sel("Um polígono de 6 lados é o:", ["Hexágono", "Pentágono", "Octógono", "Heptágono"], 0),
        (r) => {
          const a = ri(r, 20, 70);
          return numOptions(r, 90 - a, `Dois ângulos são complementares. Se um mede ${a}°, quanto mede o outro?`);
        },
        () => tf("No quadrado todos os lados têm a mesma medida.", true),
      ]);
    }
    if (level <= 9) {
      return pick([
        (r) => {
          const t = [
            [3, 4, 5],
            [6, 8, 10],
            [5, 12, 13],
            [9, 12, 15],
          ][ri(r, 0, 3)]!;
          return numOptions(r, t[2]!, `Um triângulo retângulo tem catetos ${t[0]} e ${t[1]}. Qual é a hipotenusa?`);
        },
        (r) => {
          const a = ri(r, 30, 140);
          return numOptions(r, 180 - a, `Dois ângulos são suplementares. Se um mede ${a}°, quanto mede o outro?`);
        },
        (r) => {
          const n = ri(r, 4, 10);
          return numOptions(r, (n - 2) * 180, `Qual é a soma dos ângulos internos de um polígono de ${n} lados? (em graus)`);
        },
        (r) => {
          const rr = ri(r, 2, 12);
          return numOptions(r, 2 * rr, `Em uma circunferência de raio ${rr} cm, quanto mede o diâmetro? (em cm)`);
        },
        () => sel("Dois triângulos semelhantes têm:", ["Ângulos iguais e lados proporcionais", "Sempre a mesma área", "Lados iguais", "Perímetros iguais"], 0),
        (r) => {
          const b = ri(r, 4, 20);
          const h = ri(r, 3, 15);
          return numOptions(r, b * h, `Qual é a área de um paralelogramo de base ${b} cm e altura ${h} cm? (em cm²)`);
        },
        () => tf("O Teorema de Pitágoras vale apenas para triângulos retângulos.", true),
      ]);
    }
    return pick([
      (r) => {
        const a = ri(r, 2, 9);
        return numOptions(r, a * a * a, `Qual é o volume de um cubo de aresta ${a} cm? (em cm³)`);
      },
      (r) => {
        const rr = ri(r, 2, 8);
        const h = ri(r, 2, 10);
        return numOptions(r, rr * rr * h, `O volume do cilindro é πr²h. Com r = ${rr} e h = ${h}, qual é o coeficiente de π?`);
      },
      (r) => {
        const x1 = ri(r, 0, 5);
        const y1 = ri(r, 0, 5);
        const dx = [3, 6][ri(r, 0, 1)]!;
        const dy = dx === 3 ? 4 : 8;
        return numOptions(r, Math.sqrt(dx * dx + dy * dy), `Qual é a distância entre A(${x1}, ${y1}) e B(${x1 + dx}, ${y1 + dy})?`);
      },
      () => sel("A equação da circunferência de centro (0,0) e raio 5 é:", ["x² + y² = 25", "x² + y² = 5", "x + y = 25", "x² − y² = 25"], 0),
      (r) => {
        const a = ri(r, 2, 8);
        return numOptions(r, 6 * a * a, `Qual é a área total de um cubo de aresta ${a} cm? (em cm²)`);
      },
      () => sel("O coeficiente angular da reta y = 3x + 2 é:", ["3", "2", "−3", "1/3"], 0),
      (r) => {
        const b = ri(r, 3, 9);
        const h = ri(r, 3, 9);
        return numOptions(r, Math.round((b * b * h) / 3), `O volume da pirâmide de base quadrada é (a²·h)/3. Com a = ${b} e h = ${h}, quanto vale?`);
      },
    ]);
  }

  if (topic === "medidas") {
    return pick([
      (r) => {
        const m = ri(r, 2, 20);
        return numOptions(r, m * 100, `Quantos centímetros há em ${m} metros?`);
      },
      (r) => {
        const kg = ri(r, 2, 15);
        return numOptions(r, kg * 1000, `Quantos gramas há em ${kg} quilogramas?`);
      },
      (r) => {
        const l = ri(r, 2, 12);
        return numOptions(r, l * 1000, `Quantos mililitros há em ${l} litros?`);
      },
      (r) => {
        const a = ri(r, 3, 15);
        const b = ri(r, 3, 15);
        return numOptions(r, 2 * (a + b), `Um terreno retangular mede ${a} m por ${b} m. Qual é o perímetro em metros?`);
      },
      (r) => {
        const a = ri(r, 3, 15);
        const b = ri(r, 3, 15);
        return numOptions(r, a * b, `Qual é a área de um piso de ${a} m por ${b} m? (em m²)`);
      },
      () => sel("A unidade usada para medir massa é:", ["Quilograma", "Metro", "Litro", "Segundo"], 0),
      () => tf("1 km é igual a 1000 metros.", true),
    ]);
  }

  if (topic === "dinheirotempo") {
    return pick([
      (r) => {
        const a = ri(r, 2, 20);
        const b = ri(r, 2, 20);
        return numOptions(r, a + b, `Você tem R$ ${a} e ganha R$ ${b}. Com quantos reais você fica?`);
      },
      (r) => {
        const preco = ri(r, 3, 18);
        const pago = 20;
        return numOptions(r, pago - preco, `Um lanche custa R$ ${preco} e você paga com R$ 20. Qual é o troco?`);
      },
      (r) => {
        const h = ri(r, 1, 10);
        return numOptions(r, h * 60, `Quantos minutos há em ${h} horas?`);
      },
      () => sel("Quantos dias tem uma semana?", ["7", "5", "10", "30"], 0),
      () => sel("Quantos meses tem um ano?", ["12", "10", "11", "24"], 0),
      (r) => {
        const q = ri(r, 2, 6);
        const p = ri(r, 2, 12);
        return numOptions(r, q * p, `Cada caderno custa R$ ${p}. Quanto custam ${q} cadernos?`);
      },
      () => tf("Meia hora tem 30 minutos.", true),
    ]);
  }

  if (topic === "fracoes") {
    return pick([
      () => sel("Qual fração representa a metade de um inteiro?", ["1/2", "1/3", "1/4", "2/3"], 0),
      (r) => {
        const n = ri(r, 2, 9);
        return numOptions(r, n * 2, `Se 1/2 de um número é ${n}, qual é o número?`);
      },
      () => sel("Qual fração é equivalente a 2/4?", ["1/2", "2/3", "3/4", "1/4"], 0),
      (r) => {
        const d = ri(r, 3, 9);
        return sel(`Qual é maior: 1/${d} ou 1/${d + 2}?`, [`1/${d}`, `1/${d + 2}`, "São iguais", "Não dá para comparar"], 0),
      },
      () => sel("0,25 escrito como fração é:", ["1/4", "1/2", "2/5", "1/3"], 0),
      (r) => {
        const a = ri(r, 1, 8);
        const b = ri(r, 1, 8);
        return numOptions(r, Math.round((a / 10 + b / 10) * 10) / 10, `Quanto é ${a / 10} + ${b / 10}?`);
      },
      () => sel("A soma 1/4 + 1/4 é igual a:", ["1/2", "2/8", "1/8", "1"], 0),
      () => tf("Uma fração com numerador maior que o denominador é maior que 1.", true),
    ]);
  }

  if (topic === "porcentagem") {
    return pick([
      (r) => {
        const p = ri(r, 1, 9) * 10;
        const v = ri(r, 2, 20) * 10;
        return numOptions(r, (p * v) / 100, `Quanto é ${p}% de ${v}?`);
      },
      (r) => {
        const v = ri(r, 2, 20) * 10;
        return numOptions(r, v / 2, `Quanto é 50% de ${v}?`);
      },
      (r) => {
        const preco = ri(r, 10, 50) * 10;
        const d = 10;
        return numOptions(r, preco - (preco * d) / 100, `Um produto de R$ ${preco} teve ${d}% de desconto. Qual é o preço final?`);
      },
      (r) => {
        const a = ri(r, 2, 9);
        const k = ri(r, 2, 6);
        return numOptions(r, a * k * 3, `Se 3 cadernos custam R$ ${a * k * 3 / 1}, quanto custam 3 cadernos iguais?`);
      },
      () => sel("25% equivale à fração:", ["1/4", "1/2", "1/5", "2/5"], 0),
      (r) => {
        const q = ri(r, 2, 10);
        return numOptions(r, q * 3, `Se 2 litros custam R$ ${(q * 3) / 1} pela regra de três, quanto custam 2 litros?`);
      },
      () => tf("Aumentar 100% um valor significa dobrá-lo.", true),
    ]);
  }

  if (topic === "estatistica") {
    return pick([
      (r) => {
        const a = ri(r, 2, 10);
        const b = ri(r, 2, 10);
        const c = ri(r, 2, 10);
        const soma = a + b + c;
        return numOptions(r, Math.round((soma / 3) * 100) / 100, `Qual é a média de ${a}, ${b} e ${c}?`);
      },
      () => sel("A probabilidade de sair cara ao lançar uma moeda é:", ["50%", "25%", "75%", "100%"], 0),
      () => sel("Ao lançar um dado, a probabilidade de sair um número par é:", ["1/2", "1/3", "1/6", "2/3"], 0),
      () => sel("O gráfico de barras serve para:", ["Comparar quantidades", "Medir tempo", "Desenhar formas", "Resolver equações"], 0),
      (r) => {
        const vals = [ri(r, 1, 9), ri(r, 1, 9), ri(r, 1, 9), ri(r, 1, 9), ri(r, 1, 9)].sort((x, y) => x - y);
        return numOptions(r, vals[2]!, `Qual é a mediana de ${vals.join(", ")}?`);
      },
      () => sel("Moda de um conjunto de dados é:", ["O valor que mais aparece", "A média", "O maior valor", "O menor valor"], 0),
      () => tf("A probabilidade de um evento certo é 100%.", true),
    ]);
  }

  if (topic === "potencias") {
    return pick([
      (r) => {
        const n = ri(r, 2, 9);
        return numOptions(r, n * n, `Quanto é ${n}²?`);
      },
      (r) => {
        const n = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144][ri(r, 0, 10)]!;
        return numOptions(r, Math.sqrt(n), `Qual é a raiz quadrada de ${n}?`);
      },
      (r) => {
        const n = ri(r, 2, 5);
        return numOptions(r, n * n * n, `Quanto é ${n}³?`);
      },
      (r) => {
        const a = ri(r, 2, 5);
        const m = ri(r, 2, 4);
        const n2 = ri(r, 2, 4);
        return sel(`Quanto é ${a}^${m} · ${a}^${n2}?`, [`${a}^${m + n2}`, `${a}^${m * n2}`, `${a}^${m - n2}`, `${2 * a}^${m + n2}`], 0),
      },
      () => sel("Como se escreve 45 000 em notação científica?", ["4,5 × 10⁴", "45 × 10³", "4,5 × 10³", "0,45 × 10⁵"], 0),
      () => tf("Todo número elevado a zero (exceto o próprio zero) é igual a 1.", true),
    ]);
  }

  if (topic === "algebra") {
    return pick([
      (r) => {
        const x = ri(r, 2, 12);
        const a = ri(r, 2, 9);
        const b = ri(r, 1, 20);
        return numOptions(r, x, `Resolva: ${a}x + ${b} = ${a * x + b}. Qual é o valor de x?`);
      },
      (r) => {
        const x = ri(r, 2, 12);
        const b = ri(r, 1, 15);
        return numOptions(r, x, `Resolva: x − ${b} = ${x - b}.`);
      },
      (r) => {
        const r1 = ri(r, 1, 6);
        const r2 = ri(r, 1, 6);
        const b = -(r1 + r2);
        const c = r1 * r2;
        return sel(
          `As raízes de x² ${b >= 0 ? "+" : "−"} ${Math.abs(b)}x + ${c} = 0 são:`,
          [`${r1} e ${r2}`, `${r1 + 1} e ${r2}`, `${-r1} e ${-r2}`, `${r1} e ${r2 + 2}`],
          0,
        );
      },
      () => sel("O produto notável (a + b)² é igual a:", ["a² + 2ab + b²", "a² + b²", "a² − b²", "2a + 2b"], 0),
      () => sel("A fatoração de x² − 9 é:", ["(x + 3)(x − 3)", "(x − 3)²", "(x + 9)(x − 1)", "x(x − 9)"], 0),
      (r) => {
        const a = -ri(r, 1, 20);
        const b = ri(r, 1, 20);
        return numOptions(r, a + b, `Quanto é (${a}) + ${b}?`);
      },
      () => sel("No sistema x + y = 10 e x − y = 2, o valor de x é:", ["6", "4", "5", "8"], 0),
    ]);
  }

  if (topic === "funcoes") {
    return pick([
      (r) => {
        const a = ri(r, 2, 6);
        const b = ri(r, 1, 9);
        const x = ri(r, 1, 6);
        return numOptions(r, a * x + b, `Dada f(x) = ${a}x + ${b}, qual é f(${x})?`);
      },
      () => sel("A função f(x) = x² − 4x + 3 tem gráfico:", ["Parábola com concavidade para cima", "Reta crescente", "Reta decrescente", "Hipérbole"], 0),
      (r) => {
        const b = [2, 3, 5, 10][ri(r, 0, 3)]!;
        const e = ri(r, 2, 4);
        return numOptions(r, e, `Quanto vale log na base ${b} de ${Math.pow(b, e)}?`);
      },
      () => sel("Na função afim f(x) = ax + b, o valor de b representa:", ["O ponto onde o gráfico corta o eixo y", "A inclinação", "A raiz", "O vértice"], 0),
      (r) => {
        const b = ri(r, 2, 4);
        const e = ri(r, 2, 4);
        return numOptions(r, Math.pow(b, e), `Se f(x) = ${b}^x, quanto vale f(${e})?`);
      },
      () => tf("Uma função é uma relação em que cada elemento do domínio tem apenas uma imagem.", true),
    ]);
  }

  if (topic === "sequencias") {
    return pick([
      (r) => {
        const a1 = ri(r, 1, 8);
        const d = ri(r, 2, 6);
        const n = ri(r, 5, 12);
        return numOptions(r, a1 + (n - 1) * d, `Numa PA com a₁ = ${a1} e razão ${d}, qual é o termo a${n}?`);
      },
      (r) => {
        const a1 = ri(r, 1, 5);
        const q = ri(r, 2, 4);
        const n = ri(r, 3, 6);
        return numOptions(r, a1 * Math.pow(q, n - 1), `Numa PG com a₁ = ${a1} e q = ${q}, qual é o termo a${n}?`);
      },
      (r) => {
        const a1 = ri(r, 1, 8);
        const d = ri(r, 2, 5);
        const n = ri(r, 4, 10);
        const an = a1 + (n - 1) * d;
        return numOptions(r, ((a1 + an) * n) / 2, `Qual é a soma dos ${n} primeiros termos da PA de a₁ = ${a1} e razão ${d}?`);
      },
      () => sel("Na sequência 2, 4, 8, 16, ... o próximo termo é:", ["32", "24", "20", "18"], 0),
      () => sel("Uma PA é uma sequência em que:", ["A diferença entre termos é constante", "A razão é multiplicativa", "Os termos são iguais", "Não há padrão"], 0),
    ]);
  }

  if (topic === "trigonometria") {
    return pick([
      () => sel("Quanto vale sen 30°?", ["1/2", "√3/2", "√2/2", "1"], 0),
      () => sel("Quanto vale cos 60°?", ["1/2", "√3/2", "0", "1"], 0),
      () => sel("Quanto vale tg 45°?", ["1", "0", "√3", "1/2"], 0),
      () => sel("A relação fundamental da trigonometria é:", ["sen²x + cos²x = 1", "sen x + cos x = 1", "tg x = cos/sen", "sen x = 1/cos x"], 0),
      () => sel("Em um triângulo retângulo, o seno de um ângulo é:", ["Cateto oposto / hipotenusa", "Cateto adjacente / hipotenusa", "Hipotenusa / cateto oposto", "Cateto oposto / adjacente"], 0),
      () => sel("π radianos equivale a:", ["180°", "90°", "360°", "45°"], 0),
    ]);
  }

  if (topic === "combinatoria") {
    return pick([
      (r) => {
        const n = ri(r, 4, 7);
        const fat = [1, 1, 2, 6, 24, 120, 720, 5040][n]!;
        return numOptions(r, fat, `Quanto é ${n}! ?`);
      },
      (r) => {
        const n = ri(r, 4, 7);
        return numOptions(r, (n * (n - 1)) / 2, `Quantas duplas diferentes podem ser formadas com ${n} pessoas?`);
      },
      (r) => {
        const n = ri(r, 3, 7);
        return numOptions(r, n * (n - 1) * (n - 2), `Quantos arranjos de 3 elementos existem em um grupo de ${n}?`);
      },
      () => sel("Permutação de 4 elementos distintos é:", ["24", "12", "16", "8"], 0),
      () => sel("Na combinação, a ordem dos elementos:", ["Não importa", "Sempre importa", "Depende do número", "É alfabética"], 0),
    ]);
  }

  if (topic === "financeira") {
    return pick([
      (r) => {
        const c = ri(r, 100, 900);
        const i = ri(r, 2, 10);
        return numOptions(r, Math.round(c * (1 + i / 100)), `Um capital de R$ ${c} a ${i}% de juros simples por 1 ano gera montante de:`);
      },
      (r) => {
        const c = ri(r, 100, 900);
        const i = ri(r, 2, 10);
        return numOptions(r, Math.round((c * i) / 100), `Qual é o juro simples de R$ ${c} a ${i}% ao ano, em 1 ano?`);
      },
      () => sel("Juros compostos incidem sobre:", ["O montante acumulado", "Apenas o capital inicial", "Somente o juro", "Nada"], 0),
      (r) => {
        const p = ri(r, 100, 500);
        return numOptions(r, Math.round(p * 0.9), `Um produto de R$ ${p} com 10% de desconto sai por:`);
      },
      () => tf("Na inflação alta, o poder de compra do dinheiro diminui.", true),
    ]);
  }

  if (topic === "complexos") {
    return pick([
      () => sel("i² é igual a:", ["−1", "1", "0", "i"], 0),
      (r) => {
        const a = ri(r, 1, 5);
        const b = ri(r, 1, 5);
        return numOptions(r, Math.sqrt(a * a + b * b), `Qual é o módulo do número complexo ${a} + ${b}i?`);
      },
      () => sel("O conjugado de 3 + 2i é:", ["3 − 2i", "−3 + 2i", "2 + 3i", "3 + 2i"], 0),
      () => sel("O determinante de uma matriz identidade 2×2 é:", ["1", "0", "2", "−1"], 0),
      () => sel("Um polinômio de grau 3 tem, no máximo:", ["3 raízes", "2 raízes", "4 raízes", "1 raiz"], 0),
      () => tf("Sistemas lineares podem ser resolvidos por escalonamento.", true),
    ]);
  }

  void level;
  return null;
}

// ---------- Matemática procedural por ano ----------
/**
 * Gera exercícios de matemática variados. O parâmetro `slot` garante que,
 * dentro de uma mesma lição, cada posição use um modelo diferente (sem repetição
 * de templates consecutivos).
 */
function mathExercise(level: number, unitTitle: string, r: Rng, slot: number): Exercise {
  const pick = (fns: ((r: Rng) => Exercise)[]) => fns[slot % fns.length]!(r);
  const topical = topicMathExercise(unitTopic(unitTitle), level, r, slot);
  if (topical) return topical;

  if (level <= 2) {
    return pick([
      (r) => {
        const a = ri(r, 1, level === 1 ? 10 : 50);
        const b = ri(r, 1, level === 1 ? 10 : 50);
        return numOptions(r, a + b, `Quanto é ${a} + ${b}?`);
      },
      (r) => {
        const a = ri(r, 5, level === 1 ? 20 : 99);
        const b = ri(r, 1, a);
        return numOptions(r, a - b, `Quanto é ${a} − ${b}?`);
      },
      (r) => {
        const a = ri(r, 2, 10);
        return typ(`Escreva o número que vem depois de ${a}.`, String(a + 1));
      },
      (r) => {
        const a = ri(r, 2, 12);
        return tf(`${a} + ${a} é igual ao dobro de ${a}.`, true);
      },
      (r) => {
        const a = ri(r, 1, level === 1 ? 10 : 50);
        const b = ri(r, 1, level === 1 ? 10 : 50);
        return sel(`Qual número vem antes de ${a + b + 1}?`, [String(a + b), String(a + b + 2), String(a + b - 1), String(a + b + 3)], 0);
      },
    ]);
  }
  if (level <= 5) {
    return pick([
      (r) => {
        const a = ri(r, 2, 12);
        const b = ri(r, 2, 12);
        return numOptions(r, a * b, `Quanto é ${a} × ${b}?`);
      },
      (r) => {
        const b = ri(r, 2, 12);
        const q = ri(r, 2, 12);
        return numOptions(r, q, `Quanto é ${b * q} ÷ ${b}?`);
      },
      (r) => {
        const a = ri(r, 1, 9) / 10;
        const b = ri(r, 1, 9) / 10;
        return numOptions(r, Math.round((a + b) * 10) / 10, `Quanto é ${a} + ${b}?`) as Exercise;
      },
      (r) => {
        const n = ri(r, 2, 9);
        return sel(`Qual fração representa metade?`, ["1/2", "1/3", "2/5", `${n}/${n + 3}`], 0);
      },
      (r) => {
        const l = ri(r, 3, 12);
        const w = ri(r, 3, 12);
        return numOptions(r, l * w, `Qual é a área de um retângulo de ${l} cm por ${w} cm? (em cm²)`);
      },
      (r) => {
        const total = ri(r, 10, 50);
        const part = ri(r, 1, total - 1);
        return numOptions(r, part, `De ${total} bolinhas, ${part} são vermelhas. Quantas são vermelhas?`);
      },
    ]);
  }
  if (level <= 7) {
    return pick([
      (r) => {
        const a = -ri(r, 1, 20);
        const b = ri(r, 1, 20);
        return numOptions(r, a + b, `Quanto é (${a}) + ${b}?`);
      },
      (r) => {
        const x = ri(r, 2, 12);
        const a = ri(r, 2, 9);
        const b = ri(r, 1, 20);
        return numOptions(r, x, `Resolva: ${a}x + ${b} = ${a * x + b}. Qual o valor de x?`);
      },
      (r) => {
        const n = ri(r, 2, 6);
        return numOptions(r, n * n * n, `Quanto é ${n}³?`);
      },
      (r) => {
        const p = ri(r, 1, 9) * 10;
        const v = ri(r, 2, 20) * 10;
        return numOptions(r, (p * v) / 100, `Quanto é ${p}% de ${v}?`);
      },
      (r) => {
        const a = ri(r, 2, 20);
        const b = ri(r, 2, 20);
        return numOptions(r, a * b, `Qual é o produto de ${a} e ${b}?`);
      },
    ]);
  }
  if (level <= 9) {
    return pick([
      (r) => {
        const n = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144][ri(r, 0, 10)]!;
        return numOptions(r, Math.sqrt(n), `Qual é a raiz quadrada de ${n}?`);
      },
      (r) => {
        const r1 = ri(r, 1, 6);
        const r2 = ri(r, 1, 6);
        const b = -(r1 + r2);
        const c = r1 * r2;
        return sel(
          `As raízes de x² ${b >= 0 ? "+" : "−"} ${Math.abs(b)}x + ${c} = 0 são:`,
          [`${r1} e ${r2}`, `${r1 + 1} e ${r2}`, `${-r1} e ${-r2}`, `${r1} e ${r2 + 2}`],
          0,
        );
      },
      (r) => {
        const trio = [
          [3, 4, 5],
          [6, 8, 10],
          [5, 12, 13],
          [9, 12, 15],
        ][ri(r, 0, 3)]!;
        return numOptions(
          r,
          trio[2]!,
          `Um triângulo retângulo tem catetos ${trio[0]} e ${trio[1]}. Qual é a hipotenusa?`,
        );
      },
      () => sel("Qual é a probabilidade de sair cara ao lançar uma moeda?", ["50%", "25%", "75%", "100%"], 0),
      (r) => {
        const a = ri(r, 1, 10);
        const b = ri(r, 1, 10);
        return numOptions(r, a * b, `Um retângulo tem lados ${a} e ${b}. Qual é sua área?`);
      },
    ]);
  }
  if (level === 10) {
    return pick([
      (r) => {
        const a = ri(r, 2, 6);
        const b = ri(r, 1, 9);
        const x = ri(r, 1, 6);
        return numOptions(r, a * x + b, `Dada f(x) = ${a}x + ${b}, qual é f(${x})?`);
      },
      (r) => {
        const a1 = ri(r, 1, 8);
        const d = ri(r, 2, 6);
        const n = ri(r, 5, 12);
        return numOptions(r, a1 + (n - 1) * d, `Numa PA com a₁ = ${a1} e razão ${d}, qual é a${n}?`);
      },
      (r) => {
        const b = [2, 3, 5, 10][ri(r, 0, 3)]!;
        const e = ri(r, 2, 4);
        return numOptions(r, e, `Quanto vale log${b} de ${Math.pow(b, e)}?`);
      },
      () =>
        sel(
          "A parábola de f(x) = x² − 4x + 3 tem concavidade:",
          ["Para cima, pois a > 0", "Para baixo, pois a < 0", "Não é parábola", "Depende de x"],
          0,
        ),
      (r) => {
        const a1 = ri(r, 1, 5);
        const q = ri(r, 2, 4);
        const n = ri(r, 3, 6);
        return numOptions(r, a1 * Math.pow(q, n - 1), `Numa PG com a₁ = ${a1} e q = ${q}, qual é a${n}?`);
      },
    ]);
  }
  if (level === 11) {
    return pick([
      () => sel("Quanto vale sen 30°?", ["1/2", "√3/2", "√2/2", "1"], 0),
      () => sel("Quanto vale cos 60°?", ["1/2", "√3/2", "0", "1"], 0),
      (r) => {
        const n = ri(r, 4, 7);
        const fat = [1, 1, 2, 6, 24, 120, 720, 5040][n]!;
        return numOptions(r, fat, `Quanto é ${n}! ?`);
      },
      (r) => {
        const n = ri(r, 4, 6);
        return numOptions(r, (n * (n - 1)) / 2, `Quantas combinações de 2 elementos existem em um grupo de ${n}?`);
      },
      () => sel("Ao lançar um dado, a probabilidade de sair número par é:", ["1/2", "1/3", "1/6", "2/3"], 0),
      (r) => {
        const n = ri(r, 3, 7);
        return numOptions(r, n * (n - 1) * (n - 2), `Quantos arranjos simples de 3 elementos existem em um grupo de ${n}?`);
      },
    ]);
  }
  return pick([
    (r) => {
      const x1 = ri(r, 0, 6);
      const y1 = ri(r, 0, 6);
      const dx = [3, 6][ri(r, 0, 1)]!;
      const dy = dx === 3 ? 4 : 8;
      return numOptions(
        r,
        Math.sqrt(dx * dx + dy * dy),
        `Qual é a distância entre A(${x1}, ${y1}) e B(${x1 + dx}, ${y1 + dy})?`,
      );
    },
    () => sel("i² é igual a:", ["−1", "1", "0", "i"], 0),
    (r) => {
      const rr = ri(r, 2, 8);
      return numOptions(r, 4 * rr * rr, `A área da superfície de uma esfera é 4πr². Com r = ${rr}, quanto vale o coeficiente de π?`);
    },
    (r) => {
      const c = ri(r, 100, 900);
      const i = ri(r, 2, 10);
      return numOptions(r, Math.round(c * (1 + i / 100)), `Um capital de R$ ${c} a ${i}% de juros simples por 1 ano gera montante de:`);
    },
    () => sel("A média de 4, 6, 8 e 10 é:", ["7", "6", "8", "9"], 0),
    (r) => {
      const z = { a: ri(r, 1, 5), b: ri(r, 1, 5) };
      return numOptions(r, Math.sqrt(z.a * z.a + z.b * z.b), `Qual é o módulo do complexo ${z.a} + ${z.b}i?`);
    },
  ]);
}

// ---------- Bancos por matéria ----------
type Bank = Partial<Record<Band, Exercise[]>> & { all?: Exercise[] };

const PORTUGUES: Bank = {
  f1: [
    sel("Quantas sílabas tem a palavra BOLA?", ["2", "1", "3", "4"], 0),
    sel("Qual palavra começa com a letra M?", ["Macaco", "Sapo", "Bola", "Gato"], 0),
    sel("Qual é uma vogal?", ["A", "B", "C", "D"], 0),
    asm("Monte a frase corretamente", "o gato bebe leite"),
    typ("Complete: CA__ (o animal que late é o ___)", "cachorro"),
    tf("A palavra CASA tem 4 letras.", true),
    sel("Qual palavra rima com PATO?", ["Gato", "Bola", "Casa", "Sol"], 0),
    asm("Monte a frase", "eu gosto de estudar"),
    sel("Quantas letras tem ESCOLA?", ["6", "5", "7", "8"], 0),
    tf("Toda frase termina com ponto final, interrogação ou exclamação.", true),
  ],
  f2: [
    sel("Qual palavra é um substantivo?", ["Cadeira", "Correr", "Bonito", "Rapidamente"], 0),
    sel("Qual palavra é um adjetivo?", ["Alegre", "Menino", "Correr", "Ontem"], 0),
    sel("Qual é o plural de 'animal'?", ["Animais", "Animales", "Animalos", "Animal"], 0),
    asm("Monte a frase", "a professora explicou a lição"),
    sel("Qual é o antônimo de 'grande'?", ["Pequeno", "Enorme", "Alto", "Largo"], 0),
    sel("Qual palavra está escrita corretamente?", ["Exercício", "Ezercício", "Excercicio", "Exersício"], 0),
    tf("Nomes próprios começam com letra maiúscula.", true),
    sel("Em 'O cachorro late', qual é o verbo?", ["late", "cachorro", "o", "nenhum"], 0),
    typ("Escreva o sinônimo de 'feliz' que começa com A.", "alegre"),
    sel("Qual frase está no plural?", ["Os meninos jogam bola.", "O menino joga bola.", "Ela come.", "Eu li."], 0),
  ],
  f3: [
    sel("Em 'Maria comprou pães', o sujeito é:", ["Maria", "comprou", "pães", "não há"], 0),
    sel("Qual palavra é um pronome pessoal?", ["Ele", "Correr", "Casa", "Bonito"], 0),
    sel("'Fui à escola' — o acento indica:", ["Crase", "Plural", "Aumentativo", "Diminutivo"], 0),
    sel("Qual é uma figura de linguagem de comparação?", ["Símile", "Anáfora", "Elipse", "Zeugma"], 0),
    sel("Em 'Estudei muito, porém não passei', a conjunção indica:", ["Oposição", "Adição", "Conclusão", "Causa"], 0),
    asm("Monte o período", "quando chegou em casa ele estudou"),
    tf("Na voz passiva, o sujeito sofre a ação.", true),
    sel("Qual oração é subordinada substantiva?", ["Espero que você venha.", "Ele saiu e voltou.", "Chove muito.", "Corra!"], 0),
    sel("O texto dissertativo-argumentativo tem como objetivo:", ["Defender uma tese", "Narrar uma história", "Descrever um lugar", "Dar receita"], 0),
    typ("Qual figura de linguagem há em 'chorei rios de lágrimas'? (uma palavra)", "hiperbole"),
  ],
  em: [
    sel("Em 'Os alunos, que estudaram, passaram', a oração destacada é:", ["Adjetiva explicativa", "Adjetiva restritiva", "Substantiva", "Adverbial"], 0),
    sel("Qual alternativa apresenta crase obrigatória?", ["Vou à praia.", "Vou a pé.", "Refiro-me a você.", "Cheguei a Roma."], 0),
    sel("A função da linguagem centrada no receptor é:", ["Conativa", "Emotiva", "Fática", "Poética"], 0),
    sel("Em 'Ele é um leão nas provas', temos:", ["Metáfora", "Metonímia", "Eufemismo", "Ironia"], 0),
    sel("Variação linguística diatópica é a que varia conforme:", ["A região", "A idade", "A classe social", "A situação"], 0),
    sel("Na redação do ENEM, a competência 5 avalia:", ["Proposta de intervenção", "Norma culta", "Coesão", "Repertório"], 0),
    tf("Coesão referencial evita repetições usando pronomes e sinônimos.", true),
    sel("'Bebi o copo todo' é exemplo de:", ["Metonímia", "Hipérbole", "Antítese", "Paradoxo"], 0),
    asm("Monte a tese", "a educação transforma a realidade social do país"),
    sel("Período composto por subordinação apresenta:", ["Oração principal e dependente", "Só orações independentes", "Uma oração", "Nenhuma oração"], 0),
  ],
};

const CIENCIAS: Bank = {
  f1: [
    sel("Qual sentido usamos para enxergar?", ["Visão", "Tato", "Olfato", "Paladar"], 0),
    sel("De onde as plantas tiram energia?", ["Do Sol", "Da lua", "Do vento", "Das pedras"], 0),
    tf("O cachorro é um animal mamífero.", true),
    sel("Quantos ossos protegem o cérebro?", ["Crânio", "Costelas", "Coluna", "Bacia"], 0),
    sel("O que acontece de dia?", ["O Sol ilumina a Terra", "A Lua ilumina tudo", "Sempre chove", "Nada"], 0),
    tf("Precisamos beber água todos os dias.", true),
    sel("Qual animal vive na água?", ["Peixe", "Cavalo", "Gato", "Galinha"], 0),
    sel("As plantas nascem de:", ["Sementes", "Pedras", "Nuvens", "Areia"], 0),
  ],
  f2: [
    sel("A fotossíntese produz:", ["Oxigênio e glicose", "Só gás carbônico", "Água salgada", "Nitrogênio"], 0),
    sel("Os estados físicos da água são:", ["Sólido, líquido e gasoso", "Só líquido", "Quente e frio", "Doce e salgado"], 0),
    sel("O que é um ecossistema?", ["Seres vivos e o ambiente", "Só animais", "Só plantas", "Só o solo"], 0),
    tf("O coração faz parte do sistema circulatório.", true),
    sel("Qual é a estrela do sistema solar?", ["Sol", "Lua", "Marte", "Vênus"], 0),
    sel("O que devemos fazer com o lixo reciclável?", ["Separar", "Queimar", "Jogar no rio", "Enterrar"], 0),
    sel("A digestão começa na:", ["Boca", "Estômago", "Intestino", "Fígado"], 0),
    tf("O ar é uma mistura de gases.", true),
  ],
  f3: [
    sel("A unidade básica da vida é:", ["A célula", "O átomo", "O tecido", "O órgão"], 0),
    sel("A fórmula da água é:", ["H₂O", "CO₂", "O₂", "NaCl"], 0),
    sel("A 1ª Lei de Newton fala sobre:", ["Inércia", "Ação e reação", "Gravidade", "Energia"], 0),
    sel("Quem descobriu as leis da hereditariedade?", ["Mendel", "Darwin", "Newton", "Einstein"], 0),
    tf("O átomo é formado por prótons, nêutrons e elétrons.", true),
    sel("Qual órgão controla o corpo e o pensamento?", ["Cérebro", "Pulmão", "Fígado", "Rim"], 0),
    sel("A energia elétrica é medida em:", ["Watts", "Litros", "Metros", "Graus"], 0),
    sel("Calor sempre passa do corpo:", ["Mais quente para o mais frio", "Mais frio para o quente", "Não passa", "Depende da cor"], 0),
  ],
};

const HISTORIA: Bank = {
  f1: [
    sel("O que é uma família?", ["Pessoas que convivem e se cuidam", "Só quem mora sozinho", "Uma escola", "Um bairro"], 0),
    sel("Onde estudamos?", ["Escola", "Hospital", "Mercado", "Praia"], 0),
    tf("Fotografias antigas ajudam a contar a história da família.", true),
    sel("O que marca a passagem do tempo?", ["Calendário", "Régua", "Balança", "Termômetro"], 0),
    sel("Quem cuida da limpeza das ruas?", ["Trabalhadores da cidade", "Ninguém", "Só as crianças", "Os animais"], 0),
  ],
  f2: [
    sel("Quem habitava o Brasil antes dos portugueses?", ["Povos indígenas", "Franceses", "Africanos", "Japoneses"], 0),
    sel("Em que ano os portugueses chegaram ao Brasil?", ["1500", "1822", "1889", "1492"], 0),
    sel("A Independência do Brasil ocorreu em:", ["1822", "1500", "1888", "1930"], 0),
    sel("A abolição da escravidão no Brasil foi em:", ["1888", "1822", "1889", "1900"], 0),
    tf("A Proclamação da República aconteceu em 1889.", true),
    sel("Fonte histórica é:", ["Documento que informa sobre o passado", "Uma lenda inventada", "Um mapa atual", "Um jogo"], 0),
  ],
  f3: [
    sel("A Revolução Francesa começou em:", ["1789", "1500", "1917", "1822"], 0),
    sel("A Revolução Industrial começou na:", ["Inglaterra", "França", "Brasil", "China"], 0),
    sel("A Segunda Guerra Mundial terminou em:", ["1945", "1918", "1939", "1950"], 0),
    sel("A Era Vargas iniciou em:", ["1930", "1889", "1964", "1945"], 0),
    sel("A ditadura militar no Brasil começou em:", ["1964", "1930", "1985", "1889"], 0),
    tf("A Guerra Fria opôs EUA e União Soviética.", true),
  ],
  em: [
    sel("O feudalismo se caracterizava por:", ["Relações de suserania e vassalagem", "Indústria em massa", "Democracia direta", "Capitalismo financeiro"], 0),
    sel("O Iluminismo defendia:", ["Razão e liberdade", "Absolutismo", "Feudalismo", "Teocracia"], 0),
    sel("O Tratado de Versalhes encerrou:", ["A Primeira Guerra Mundial", "A Segunda Guerra", "A Guerra Fria", "A Guerra do Paraguai"], 0),
    sel("A Constituição Cidadã brasileira é de:", ["1988", "1946", "1967", "1824"], 0),
    sel("O Estado Novo foi instaurado por:", ["Getúlio Vargas", "JK", "Jango", "Dutra"], 0),
    tf("A Guerra Fria foi marcada pela corrida armamentista e espacial.", true),
    sel("A Revolução Russa de 1917 levou ao poder:", ["Os bolcheviques", "Os czares", "Os nazistas", "Os girondinos"], 0),
  ],
};

const GEOGRAFIA: Bank = {
  f1: [
    sel("Onde as pessoas moram?", ["Casas e apartamentos", "Nas nuvens", "No mar", "Na lua"], 0),
    sel("O que mostra um mapa?", ["Lugares vistos de cima", "Só desenhos", "Números", "Animais"], 0),
    tf("A cidade tem mais prédios que o campo.", true),
    sel("Qual meio de transporte anda sobre trilhos?", ["Trem", "Ônibus", "Barco", "Avião"], 0),
  ],
  f2: [
    sel("O Brasil tem quantas regiões?", ["5", "3", "7", "4"], 0),
    sel("Qual é a capital do Brasil?", ["Brasília", "Rio de Janeiro", "São Paulo", "Salvador"], 0),
    sel("O clima predominante no Brasil é:", ["Tropical", "Polar", "Desértico", "Frio"], 0),
    sel("A Amazônia é um exemplo de:", ["Bioma", "Cidade", "País", "Estado"], 0),
    tf("Zona rural é onde predomina a agricultura.", true),
  ],
  f3: [
    sel("O relevo brasileiro é formado principalmente por:", ["Planaltos e planícies", "Só montanhas altas", "Vulcões", "Geleiras"], 0),
    sel("A globalização intensificou:", ["A troca de bens e informações", "O isolamento", "O fim do comércio", "A ausência de tecnologia"], 0),
    sel("Qual é o maior país da América do Sul?", ["Brasil", "Argentina", "Peru", "Chile"], 0),
    sel("O Mercosul é um:", ["Bloco econômico", "Rio", "Bioma", "País"], 0),
    tf("A Ásia é o continente mais populoso do mundo.", true),
  ],
  em: [
    sel("Escala 1:100.000 significa que 1 cm no mapa equivale a:", ["1 km", "100 m", "10 km", "100 km"], 0),
    sel("O IDH mede:", ["Desenvolvimento humano", "Só a renda", "População total", "Área do país"], 0),
    sel("Efeito estufa intensificado é causado principalmente por:", ["Gases de queima de combustíveis fósseis", "Chuva", "Vento", "Nuvens"], 0),
    sel("A transição demográfica indica:", ["Queda de natalidade e mortalidade", "Aumento infinito", "Fim das cidades", "Migração zero"], 0),
    sel("Cerrado é um bioma marcado por:", ["Vegetação com árvores retorcidas e savana", "Floresta densa e úmida", "Deserto", "Tundra"], 0),
    tf("A OPEP é uma organização de países exportadores de petróleo.", true),
  ],
};

const INGLES: Bank = {
  f1: [
    sel("Como se diz 'olá' em inglês?", ["Hello", "Goodbye", "Please", "Sorry"], 0),
    sel("What is 'blue'?", ["Azul", "Verde", "Vermelho", "Amarelo"], 0),
    sel("How do you say 'macaco'?", ["Monkey", "Donkey", "Turkey", "Monk"], 0),
    asm("Monte a frase em inglês", "my name is Ana"),
    sel("'Three' means:", ["Três", "Dois", "Quatro", "Cinco"], 0),
  ],
  f2: [
    sel("Complete: I ___ a student.", ["am", "is", "are", "be"], 0),
    sel("What is 'breakfast'?", ["Café da manhã", "Jantar", "Almoço", "Lanche"], 0),
    asm("Monte a frase", "she is playing soccer now"),
    sel("Plural of 'child':", ["children", "childs", "childes", "child"], 0),
    sel("'It is raining' means:", ["Está chovendo", "Está frio", "Está nevando", "Está sol"], 0),
  ],
  f3: [
    sel("Past of 'go':", ["went", "goed", "gone", "going"], 0),
    sel("Choose the comparative: 'This book is ___ than that one.'", ["better", "best", "gooder", "more good"], 0),
    sel("Present perfect: 'I ___ finished my homework.'", ["have", "has", "had", "having"], 0),
    asm("Monte a frase", "if I study I will pass the exam"),
    sel("Passive voice of 'They built the house':", ["The house was built", "The house builds", "The house is build", "House built was"], 0),
  ],
  em: [
    sel("'Actually' is a false friend that means:", ["Na verdade", "Atualmente", "Rapidamente", "Talvez"], 0),
    sel("Choose the correct conditional: 'If I had money, I ___ travel.'", ["would", "will", "am", "did"], 0),
    sel("'Despite' is followed by:", ["A noun or gerund", "A full clause with subject", "An infinitive", "A comma only"], 0),
    sel("The main idea of a text is called:", ["Main idea / gist", "Detail", "Reference", "Prefix"], 0),
    asm("Build the sentence", "climate change affects everyone in the world"),
  ],
};

const FISICA: Exercise[] = [
  sel("A unidade de força no SI é:", ["Newton", "Joule", "Watt", "Pascal"], 0),
  sel("Velocidade média é:", ["Δs/Δt", "Δt/Δs", "m·a", "F·d"], 0),
  sel("A 2ª Lei de Newton é:", ["F = m·a", "F = m/a", "F = a/m", "F = m·v"], 0),
  sel("Energia cinética é dada por:", ["mv²/2", "mgh", "m·a", "F·t"], 0),
  sel("A unidade de potência é:", ["Watt", "Newton", "Joule", "Ampère"], 0),
  sel("Na reflexão da luz, o ângulo de incidência é:", ["Igual ao de reflexão", "O dobro", "A metade", "Zero"], 0),
  sel("A corrente elétrica é medida em:", ["Ampère", "Volt", "Ohm", "Watt"], 0),
  sel("A Lei de Ohm é:", ["U = R·i", "U = R/i", "R = U·i", "i = R·U"], 0),
  tf("O calor é energia térmica em trânsito.", true),
  sel("A frequência é medida em:", ["Hertz", "Metro", "Segundo", "Newton"], 0),
];

const QUIMICA: Exercise[] = [
  sel("O número atômico representa o número de:", ["Prótons", "Nêutrons", "Elétrons livres", "Massa"], 0),
  sel("A ligação entre metal e ametal costuma ser:", ["Iônica", "Covalente", "Metálica", "Nenhuma"], 0),
  sel("O pH de uma solução neutra é:", ["7", "0", "14", "1"], 0),
  sel("NaCl é o:", ["Cloreto de sódio", "Ácido sulfúrico", "Hidróxido de cálcio", "Metano"], 0),
  sel("1 mol contém aproximadamente:", ["6,02 × 10²³ partículas", "10²³ gramas", "100 partículas", "1 litro"], 0),
  sel("Reação exotérmica:", ["Libera calor", "Absorve calor", "Não troca calor", "Só ocorre a frio"], 0),
  sel("A função orgânica do etanol é:", ["Álcool", "Éter", "Cetona", "Éster"], 0),
  tf("Ácidos liberam H⁺ em solução aquosa (Arrhenius).", true),
  sel("A tabela periódica organiza os elementos por:", ["Número atômico crescente", "Ordem alfabética", "Massa decrescente", "Cor"], 0),
];

const BIOLOGIA: Exercise[] = [
  sel("A organela responsável pela respiração celular é:", ["Mitocôndria", "Ribossomo", "Lisossomo", "Vacúolo"], 0),
  sel("O DNA está localizado principalmente no:", ["Núcleo", "Citoplasma", "Membrana", "Parede celular"], 0),
  sel("A mitose gera:", ["Duas células idênticas", "Quatro gametas", "Uma célula", "Células diferentes"], 0),
  sel("Segundo Darwin, a evolução ocorre por:", ["Seleção natural", "Uso e desuso", "Geração espontânea", "Criacionismo"], 0),
  sel("Fotossíntese ocorre nos:", ["Cloroplastos", "Ribossomos", "Núcleos", "Lisossomos"], 0),
  sel("Ecossistema é formado por:", ["Comunidade + ambiente físico", "Só espécies", "Só clima", "Só solo"], 0),
  sel("Cruzando Aa × Aa, a proporção fenotípica é:", ["3:1", "1:1", "9:3:3:1", "2:2"], 0),
  tf("Vacinas estimulam a produção de anticorpos.", true),
];

const LITERATURA: Exercise[] = [
  sel("O Romantismo brasileiro tem como marco:", ["Suspiros Poéticos e Saudades", "Os Sertões", "Macunaíma", "Vidas Secas"], 0),
  sel("Machado de Assis é autor de:", ["Dom Casmurro", "Iracema", "O Guarani", "Macunaíma"], 0),
  sel("A Semana de Arte Moderna ocorreu em:", ["1922", "1900", "1930", "1945"], 0),
  sel("O Barroco é marcado por:", ["Antíteses e conflito fé/carne", "Equilíbrio clássico", "Objetividade científica", "Verso livre"], 0),
  sel("Vidas Secas é de:", ["Graciliano Ramos", "Jorge Amado", "Mário de Andrade", "Cecília Meireles"], 0),
  sel("O Realismo se opõe ao Romantismo por ser:", ["Objetivo e crítico", "Idealizado", "Religioso", "Medieval"], 0),
  tf("Carlos Drummond de Andrade pertence à 2ª fase do Modernismo.", true),
];

const FILOSOFIA: Exercise[] = [
  sel("'Só sei que nada sei' é atribuído a:", ["Sócrates", "Platão", "Aristóteles", "Kant"], 0),
  sel("O mito da caverna é de:", ["Platão", "Descartes", "Nietzsche", "Marx"], 0),
  sel("'Penso, logo existo' é de:", ["Descartes", "Hume", "Locke", "Sartre"], 0),
  sel("O imperativo categórico é conceito de:", ["Kant", "Hegel", "Comte", "Rousseau"], 0),
  sel("Para Sartre, a existência:", ["Precede a essência", "É determinada por Deus", "Não existe", "É ilusória"], 0),
  tf("A ética estuda os fundamentos da ação moral.", true),
];

const SOCIOLOGIA: Exercise[] = [
  sel("Fato social é conceito de:", ["Durkheim", "Weber", "Marx", "Comte"], 0),
  sel("Para Marx, a história é movida pela:", ["Luta de classes", "Vontade divina", "Sorte", "Geografia"], 0),
  sel("Weber estudou a ação social e a:", ["Racionalização", "Mais-valia", "Anomia", "Alienação total"], 0),
  sel("Movimentos sociais buscam:", ["Transformações coletivas", "Lucro individual", "Isolamento", "Nada"], 0),
  sel("Cidadania envolve:", ["Direitos e deveres", "Só deveres", "Só direitos", "Privilégios"], 0),
  tf("Cultura é aprendida e transmitida socialmente.", true),
];

const BANKS: Record<string, Bank> = {
  portugues: PORTUGUES,
  ciencias: CIENCIAS,
  historia: HISTORIA,
  geografia: GEOGRAFIA,
  ingles: INGLES,
  fisica: { all: FISICA },
  quimica: { all: QUIMICA },
  biologia: { all: BIOLOGIA },
  literatura: { all: LITERATURA },
  filosofia: { all: FILOSOFIA },
  sociologia: { all: SOCIOLOGIA },
};

function bankFor(subjectId: string, band: Band): Exercise[] {
  const b = BANKS[subjectId];
  if (!b) return [];
  const extra = EXTRA_BANKS[subjectId];
  const base = b.all ?? b[band] ?? b.f3 ?? b.f2 ?? b.f1 ?? [];
  const more = extra ? (extra.all ?? extra[band] ?? []) : [];
  return [...base, ...more];
}

/**
 * Distribui as questões do banco de forma determinística: uma única fila
 * embaralhada é percorrida em janelas contínuas, então lições seguidas nunca
 * recebem as mesmas questões (só voltam a repetir depois que o banco inteiro
 * for percorrido).
 */
function takeFromBank(bank: Exercise[], seedKey: string, ordinal: number, count: number): Exercise[] {
  const n = bank.length;
  if (n === 0) return [];
  const queue = shuffle(bank, mulberry32(hash(seedKey)));

  const out: Exercise[] = [];
  const seen = new Set<string>();
  let idx = ordinal * count;
  const limit = idx + n + count;
  while (out.length < count && idx < limit) {
    const ex = queue[((idx % n) + n) % n]!;
    idx++;
    const key = JSON.stringify(ex);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ex);
  }
  return out;
}

export const EXERCISES_PER_LESSON = 8;

export function exercisesForLesson(lessonId: string): Exercise[] {
  const ref = parseLessonId(lessonId);
  if (!ref) return [];
  const grade = getGrade(ref.gradeId);
  const r = mulberry32(hash(lessonId));
  const out: Exercise[] = [];

  if (ref.subjectId === "matematica") {
    const seen = new Set<string>();
    let guard = 0;
    while (out.length < EXERCISES_PER_LESSON && guard++ < 200) {
      const ex = mathExercise(grade.level, ref.unitTitle, r, out.length);
      const key = ex.kind === "select" ? ex.prompt : JSON.stringify(ex);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(ex);
    }
    return out;
  }

  const bank = bankFor(ref.subjectId, grade.band);
  const ordinal = ref.unitIndex * LESSONS_PER_UNIT + ref.lessonIndex;
  return takeFromBank(bank, `${ref.gradeId}:${ref.subjectId}:licao`, ordinal, EXERCISES_PER_LESSON);
}

export const EXAM_QUESTIONS = 10;

export function examExercises(gradeId: string, subjectId: string, unitIndex: number): Exercise[] {
  const grade = getGrade(gradeId);
  const r = mulberry32(hash(`exam:${gradeId}-${subjectId}-${unitIndex}`));
  const out: Exercise[] = [];

  if (subjectId === "matematica") {
    const seen = new Set<string>();
    let guard = 0;
    while (out.length < EXAM_QUESTIONS && guard++ < 300) {
      const ex = mathExercise(grade.level, unitTitleFor(gradeId, subjectId, unitIndex), r, out.length);
      const key = ex.kind === "select" ? ex.prompt : JSON.stringify(ex);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(ex);
    }
    return out;
  }

  const bank = bankFor(subjectId, grade.band);
  return takeFromBank(bank, `${gradeId}:${subjectId}:prova`, unitIndex, EXAM_QUESTIONS);
}

// Exercícios embaralhados de opções, determinístico por índice
export function shuffledOptions(ex: Extract<Exercise, { kind: "select" }>, seed: string) {
  const r = mulberry32(hash(seed + ex.prompt));
  const idx = shuffle(ex.options.map((_, i) => i), r);
  return {
    options: idx.map((i) => ex.options[i]!),
    answer: idx.indexOf(ex.answer),
  };
}

export function scrambleWords(sentence: string, seed: string) {
  const r = mulberry32(hash(seed + sentence));
  return shuffle(sentence.split(" "), r);
}

export function normalize(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

export function correctAnswerText(ex: Exercise, seed: string) {
  if (ex.kind === "select") return ex.options[ex.answer];
  if (ex.kind === "truefalse") return ex.answer ? "Verdadeiro" : "Falso";
  if (ex.kind === "type") return ex.answer;
  void seed;
  return ex.sentence;
}

// ---------- Conceito da lição ----------
export function lessonConcept(lessonId: string): {
  title: string;
  explanation: string;
  example?: string;
  image?: string;
} {
  const ref = parseLessonId(lessonId);
  if (!ref) return { title: "Bem-vindo!", explanation: "Vamos aprender juntos com o Edu." };
  const grade = getGrade(ref.gradeId);
  const unitTitle = ref.unitTitle;

  if (ref.subjectId === "matematica") {
    const concepts: Record<number, { title: string; explanation: string; example: string; image?: string }> = {
      0: {
        title: "Números e contagem",
        explanation: "Números representam quantidades. Contar é a base de toda a matemática.",
        example: "Se você tem 3 bananas e ganha 2, fica com 5 bananas.",
        image: "https://images.unsplash.com/photo-1596495577886-d920f1fb1178?w=800&q=80",
      },
      1: {
        title: "Adição e subtração",
        explanation: "Adicionar é juntar; subtrair é tirar. Ambas ajudam a resolver problemas do dia a dia.",
        example: "7 + 5 = 12 e 12 − 5 = 7.",
        image: "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=800&q=80",
      },
      2: {
        title: "Multiplicação e divisão",
        explanation: "Multiplicar é somar várias vezes. Dividir é repartir em partes iguais.",
        example: "4 × 3 = 12 e 12 ÷ 4 = 3.",
      },
      3: {
        title: "Frações e decimais",
        explanation: "Frações representam partes de um inteiro. Decimais são outra forma de escrever essas partes.",
        example: "1/2 = 0,5.",
      },
      4: {
        title: "Porcentagem e proporção",
        explanation: "Porcentagem é uma fração de 100. Proporção compara duas razões.",
        example: "50% de 200 é 100.",
      },
    };
    return concepts[ref.unitIndex] ?? {
      title: unitTitle,
      explanation: `Vamos estudar ${unitTitle.toLowerCase()}. Preste atenção nos exemplos e depois resolva os exercícios.`,
      example: "Leia cada questão com calma antes de responder.",
    };
  }

  const subjectImages: Record<string, string> = {
    portugues: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
    ciencias: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80",
    historia: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=800&q=80",
    geografia: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&q=80",
    ingles: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80",
    fisica: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80",
    quimica: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80",
    biologia: "https://images.unsplash.com/photo-1530210124550-912dc1381cb8?w=800&q=80",
    literatura: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&q=80",
    filosofia: "https://images.unsplash.com/photo-1509228465528-8051e6c69d54?w=800&q=80",
    sociologia: "https://images.unsplash.com/photo-1529156069898-49953e39b3b6?w=800&q=80",
  };

  const image = subjectImages[ref.subjectId];
  const concept = {
    title: unitTitle,
    explanation: `Nesta lição vamos aprender sobre ${unitTitle.toLowerCase()}. O conteúdo é adequado para o ${grade.label}. Leia com atenção antes de fazer os exercícios.`,
    example: "Quando estiver em dúvida, tente eliminar as alternativas mais improváveis.",
  };
  if (image) (concept as { image?: string }).image = image;
  return concept;
}

// ---------- Teste de nivelamento ----------
export function placementQuestions(gradeId: string): Exercise[] {
  const grade = getGrade(gradeId);
  const r = mulberry32(hash("placement:" + gradeId));
  const qs: Exercise[] = [];
  for (let i = 0; i < 3; i++) qs.push(mathExercise(grade.level, "Números", r, i));
  const por = shuffle(bankFor("portugues", grade.band), r).slice(0, 2);
  const other = shuffle(
    grade.band === "em" ? [...BIOLOGIA, ...HISTORIA.em!] : bankFor("ciencias", grade.band),
    r,
  ).slice(0, 2);
  return [...qs, ...por, ...other];
}
