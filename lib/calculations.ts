import {
  ANIMALS,
  WESTERN,
  DAILY,
  MONGOL_ELEMENT_COMPAT,
  WESTERN_ELEMENT_COMPAT,
  MONEY_BY_ANIMAL,
  MONEY_OVERVIEW_POOL,
  MONEY_INVEST_POOL,
  MONEY_SAVE_POOL,
  MONEY_WARNING_POOL,
  type Animal,
  type WesternSign,
} from "./data";

/* ── Монгол зурхайн тооцоо ─────────────────────────────────── */
const ANIMAL_NAMES = [
  "Хулгана","Үхэр","Бар","Туулай","Луу","Могой",
  "Морь","Хонь","Бич","Тахиа","Нохой","Гахай",
];
const ELEMENT_NAMES = ["Мод","Гал","Шороо","Төмөр","Ус"];
const BASE_YEAR = 1924;

// Цагаан сарын огноо [сар, өдөр] жил тус бүрт — зурхайн жил энэ өдрөөс эхэлдэг
const CNY: Record<number, [number, number]> = {
  1924:[2,5],  1925:[1,25], 1926:[2,13], 1927:[2,2],  1928:[1,23],
  1929:[2,10], 1930:[1,30], 1931:[2,17], 1932:[2,6],  1933:[1,26],
  1934:[2,14], 1935:[2,4],  1936:[1,24], 1937:[2,11], 1938:[1,31],
  1939:[2,19], 1940:[2,8],  1941:[1,27], 1942:[2,15], 1943:[2,5],
  1944:[1,25], 1945:[2,13], 1946:[2,2],  1947:[1,22], 1948:[2,10],
  1949:[1,29], 1950:[2,17], 1951:[2,6],  1952:[1,27], 1953:[2,14],
  1954:[2,3],  1955:[1,24], 1956:[2,12], 1957:[1,31], 1958:[2,18],
  1959:[2,8],  1960:[1,28], 1961:[2,15], 1962:[2,5],  1963:[1,25],
  1964:[2,13], 1965:[2,2],  1966:[1,21], 1967:[2,9],  1968:[1,30],
  1969:[2,17], 1970:[2,6],  1971:[1,27], 1972:[2,15], 1973:[2,3],
  1974:[1,23], 1975:[2,11], 1976:[1,31], 1977:[2,18], 1978:[2,7],
  1979:[1,28], 1980:[2,16], 1981:[2,5],  1982:[1,25], 1983:[2,13],
  1984:[2,2],  1985:[2,20], 1986:[2,9],  1987:[1,29], 1988:[2,17],
  1989:[2,6],  1990:[1,27], 1991:[2,15], 1992:[2,4],  1993:[1,23],
  1994:[2,10], 1995:[1,31], 1996:[2,19], 1997:[2,7],  1998:[1,28],
  1999:[2,16], 2000:[2,5],  2001:[1,24], 2002:[2,12], 2003:[2,1],
  2004:[1,22], 2005:[2,9],  2006:[1,29], 2007:[2,18], 2008:[2,7],
  2009:[1,26], 2010:[2,14], 2011:[2,3],  2012:[1,23], 2013:[2,10],
  2014:[1,31], 2015:[2,19], 2016:[2,8],  2017:[1,28], 2018:[2,16],
  2019:[2,5],  2020:[1,25], 2021:[2,12], 2022:[2,1],  2023:[1,22],
  2024:[2,10], 2025:[1,29], 2026:[2,17], 2027:[2,6],  2028:[1,26],
};

// Зурхайн "тооцооны жил" — Цагаан сараас өмнө төрсөн бол өмнөх жил
function zodiacYear(year: number, month: number, day: number): number {
  const cny = CNY[year];
  if (!cny) return year;
  const [cm, cd] = cny;
  if (month < cm || (month === cm && day < cd)) return year - 1;
  return year;
}

export function mongolZurkhai(year: number, month = 0, day = 0): {
  animal: Animal;
  animalIdx: number;
  element: string;
  elementHex: string;
} {
  const zy = month && day ? zodiacYear(year, month, day) : year;
  const diff = zy - BASE_YEAR;
  const animalIdx = ((diff % 12) + 12) % 12;
  // Монгол элемент: 2 жил тутам солигддог тул хагасаар хуваана
  const elemIdx = (Math.floor(diff / 2) % 5 + 5) % 5;
  const animal = ANIMALS[animalIdx];
  const element = ELEMENT_NAMES[elemIdx];

  const hexMap: Record<string, string> = {
    Мод: "#6FBF8E",
    Гал: "#E0704F",
    Шороо: "#E3B458",
    Төмөр: "#D8DCE8",
    Ус: "#5B8DE0",
  };

  return { animal, animalIdx, element, elementHex: hexMap[element] };
}

/* ── Өрнийн зурхай ─────────────────────────────────────────── */
export function westernSign(month: number, day: number): WesternSign {
  for (const s of WESTERN) {
    const [fm, fd] = s.from;
    const [tm, td] = s.to;
    if (
      (month === fm && day >= fd) ||
      (month === tm && day <= td) ||
      (fm > tm && (month === fm || month === tm))
    ) {
      return s;
    }
  }
  // Матар (Санчир) — 12/22–1/19
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
    return WESTERN[0];
  }
  return WESTERN[0];
}

/* ── Тооны зурхай (life path) ──────────────────────────────── */
function reduceNum(n: number): number {
  if (n === 11 || n === 22) return n;
  if (n < 10) return n;
  const s = n
    .toString()
    .split("")
    .reduce((a, b) => a + Number(b), 0);
  return reduceNum(s);
}

export function lifePathSteps(
  year: number,
  month: number,
  day: number
): { value: number; steps: string } {
  const y = year
    .toString()
    .split("")
    .reduce((a, b) => a + Number(b), 0);
  const m = month;
  const d = day;
  const total = y + m + d;
  const value = reduceNum(total);
  const steps = `${year.toString().split("").join("+")}=${y} + ${m} + ${d} = ${total} → ${value}`;
  return { value, steps };
}

/* ── Детерминист RNG ───────────────────────────────────────── */
export function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
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

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/* ── Өдрийн зурхай ────────────────────────────────────────── */
export function dailyHoroscope(
  animalName: string,
  signName: string,
  dateISO: string
) {
  const seed = hashStr(`${animalName}:${signName}:${dateISO}`);
  const rng = mulberry32(seed);
  return {
    general: pick(DAILY.general, rng),
    love: pick(DAILY.love, rng),
    career: pick(DAILY.career, rng),
    health: pick(DAILY.health, rng),
    color: pick(DAILY.colors, rng),
    luckyNum: Math.floor(rng() * 9) + 1,
  };
}

/* ── Нэгдсэн дүгнэлт (локал) ──────────────────────────────── */
export function buildUnifiedSummary(
  animal: string,
  element: string,
  wsName: string,
  wsEl: string,
  lp: number
): string {
  return `Та ${animal} жилд төрсөн ${element} махбодын хүн. Өрнийн зурхайгаар ${wsName} (${wsEl} элемент), амьдралын зам ${lp}. `;
}

/* ── Хосын нийцлийн тооцоо ─────────────────────────────────── */
export interface CompatResult {
  totalScore: number;
  animalScore: number;
  mongolElemScore: number;
  westernElemScore: number;
  lpScore: number;
  animalDesc: string;
  summary: string;
  level: "excellent" | "great" | "good" | "neutral" | "challenging";
  tips: string[];
}

// 12 амьтны тринал бүлгүүд: A(0,4,8), B(1,5,9), C(2,6,10), D(3,7,11)
function animalCompatScore(idx1: number, idx2: number): { score: number; desc: string } {
  if (idx1 === idx2) return { score: 70, desc: "same" };
  const diff = Math.abs(idx1 - idx2);
  if (diff === 6) return { score: 35, desc: "clash" }; // тэмцлийн хос
  // Нэг тринал бүлэгт байна уу?
  const trineA = [0, 4, 8];
  const trineB = [1, 5, 9];
  const trineC = [2, 6, 10];
  const trineD = [3, 7, 11];
  for (const t of [trineA, trineB, trineC, trineD]) {
    if (t.includes(idx1) && t.includes(idx2)) {
      return { score: 95, desc: "trine" };
    }
  }
  if (diff === 4 || diff === 8) return { score: 80, desc: "sextile" };
  return { score: 60, desc: "neutral" };
}

export function calculateCompatibility(
  animalIdx1: number,
  mongolElem1: string,
  westernEl1: string,
  lp1: number,
  animalIdx2: number,
  mongolElem2: string,
  westernEl2: string,
  lp2: number
): CompatResult {
  // Амьтан — 40% жин
  const { score: aRaw, desc: animalDesc } = animalCompatScore(animalIdx1, animalIdx2);
  const animalScore = Math.round(aRaw * 0.4);

  // Монгол махбод — 30% жин
  const meRaw = MONGOL_ELEMENT_COMPAT[mongolElem1]?.[mongolElem2] ?? 60;
  const mongolElemScore = Math.round(meRaw * 0.3);

  // Өрнийн элемент — 20% жин
  const weRaw = WESTERN_ELEMENT_COMPAT[westernEl1]?.[westernEl2] ?? 60;
  const westernElemScore = Math.round(weRaw * 0.2);

  // Амьдралын зам — 10% жин
  const lpDiff = Math.abs(lp1 - lp2);
  const lpRaw = lpDiff === 0 ? 75 : lpDiff === 1 ? 85 : lpDiff <= 3 ? 70 : lpDiff <= 5 ? 55 : 45;
  const lpScore = Math.round(lpRaw * 0.1);

  const totalScore = animalScore + mongolElemScore + westernElemScore + lpScore;

  let level: CompatResult["level"] = "neutral";
  if (totalScore >= 82) level = "excellent";
  else if (totalScore >= 70) level = "great";
  else if (totalScore >= 58) level = "good";
  else if (totalScore >= 45) level = "neutral";
  else level = "challenging";

  // Animal names for summary
  const a1name = ANIMALS[animalIdx1]?.name ?? "";
  const a2name = ANIMALS[animalIdx2]?.name ?? "";

  const summaryMap: Record<CompatResult["level"], string> = {
    excellent: `${a1name} болон ${a2name} хосын зурхайн нийцэл маш өндөр — ${totalScore} оноо. Монгол махбодын ${mongolElem1}–${mongolElem2} нийцэл (${meRaw}%), өрнийн ${westernEl1}–${westernEl2} нийцэл тань хоёулаа давуу. Та хоёрын хооронд байгалийн ойлголцол, гүн харилцаа бий болох суурь тогтоогдсон байна.`,
    great: `${a1name} болон ${a2name} хосын нийцэл сайн — ${totalScore} оноо. Бага зэрэг ялгаатай хандлагатай боловч харилцаа нь аяндаа гүнзгийрэх боломжтой.`,
    good: `${a1name} болон ${a2name} хосын нийцэл дунд-сайн — ${totalScore} оноо. Ялгаатай зан чанарууд нь бие биенийгээ нөхлөн дэмжиж чаддаг тул харилцаанд тааруу бус.`,
    neutral: `${a1name} болон ${a2name} хосын зурхайн нийцэл дундаж — ${totalScore} оноо. Ойлголцохын тулд нэмэлт хүчин чармайлт шаардагдах боловч боломж нээлттэй.`,
    challenging: `${a1name} болон ${a2name} хосын зурхайн зөрчил илүү байна — ${totalScore} оноо. Ялгааг хүлээн зөвшөөрч, харилцааны дотоод ойлголцол хамгийн чухал.`,
  };

  const tipsMap: Record<CompatResult["level"], string[]> = {
    excellent: [
      "Бие биенийхээ хүчийг тэнцүүлж, хамтарсан зорилго тавиарай.",
      "Харилцааны давуу талуудаа ашиглаж, хамтдаа ургаарай.",
      "Ижил элементийн хослол нь хамтын бүтээлчилэлд онцгой хүч өгнө.",
    ],
    great: [
      "Ялгаатай хандлагаа бие биенийхэд тайлбарлаж ойлгуулаарай.",
      "Хамтарсан зорилго болон төлөвлөгөөтэй байх нь зүйтэй.",
      "Жижиг санаа зовнилыг нуулгүйгээр хэлэлцдэг дадал хий.",
    ],
    good: [
      "Бие биенийхаа зан чанарыг хүлээн зөвшөөрч суралц.",
      "Ялгааг зөрчил гэлгүй баяжуулалт гэж харж байгаарай.",
      "Харилцааны дотоод дүрэм, зааг тогтоогоод дагаж мөрд.",
    ],
    neutral: [
      "Нээлттэй харилцаа, сонсож ойлгох дадлыг хий.",
      "Хоёулаа дуртай нийтлэг ажил, дадлыг хайгаарай.",
      "Зөрчил гарвал нэн даруй хэлэлцдэг дадал хий.",
    ],
    challenging: [
      "Зурхайн зөрчил нь дадлаар даван туулж болдог — ялгааг мэдэж байгаарай.",
      "Гадны нөхрийн буюу зарим нэг зуучлагчийн тусламж ашигла.",
      "Сайн ойлгох нь харилцааны хамгийн том хүч болно.",
    ],
  };

  return {
    totalScore,
    animalScore,
    mongolElemScore,
    westernElemScore,
    lpScore,
    animalDesc,
    summary: summaryMap[level],
    level,
    tips: tipsMap[level],
  };
}

/* ── Мөнгөний зурхай ──────────────────────────────────────── */
export interface MoneyResult {
  overview: string;
  invest: string;
  save: string;
  warning: string;
  animalMoney: {
    invest: string;
    save: string;
    business: string;
    energyDesc: string;
  };
  luckyNum: number;
  luckyColor: string;
}

export function getMoneyHoroscope(
  animalName: string,
  elementName: string,
  month: number
): MoneyResult {
  const seed = hashStr(`money:${animalName}:${elementName}:${month}`);
  const rng = mulberry32(seed);

  const overview = pick(MONEY_OVERVIEW_POOL, rng);
  const invest = pick(MONEY_INVEST_POOL, rng);
  const save = pick(MONEY_SAVE_POOL, rng);
  const warning = pick(MONEY_WARNING_POOL, rng);

  const animalMoney = MONEY_BY_ANIMAL[animalName] ?? {
    invest: "Тогтвортой хөрөнгө оруулалт",
    save: "Дундаж хуримтлалын чадвар",
    business: "Олон талын бизнес",
    energyDesc: "Санхүүгийн тогтвортой зам.",
  };

  const luckyNums = [3, 6, 8, 9, 7, 1, 4, 2, 5];
  const luckyColors = ["Алтан шар", "Ногоон", "Цагаан", "Улаан", "Цэнхэр", "Хүрэн"];

  return {
    overview,
    invest,
    save,
    warning,
    animalMoney,
    luckyNum: luckyNums[Math.abs(hashStr(animalName + elementName)) % luckyNums.length],
    luckyColor: luckyColors[Math.abs(hashStr(animalName + month)) % luckyColors.length],
  };
}

/* ── Ашиглагдах туслах функцүүд ──────────────────────────── */
export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function getAnimalByYear(year: number): Animal {
  return mongolZurkhai(year).animal;
}

export function animalIndexByYear(year: number): number {
  return mongolZurkhai(year).animalIdx;
}

export { ANIMAL_NAMES };
