// ===========================================
// DAJANA AI - Sezonske palete (HEX) + AI odgovori
// Izvor: client-materijal / HEX kodovi za svaku sezonu
// ===========================================

import type { Season } from '@/types/database';

export interface SeasonPaletteGroup {
  name: string;
  description?: string;
  hex: string[];
}

export interface SeasonAiResponse {
  /** Primjer korisničkog pitanja / izjave */
  trigger: string;
  /** Preporučeni AI odgovor (može više alternativa) */
  response: string | string[];
}

export interface SeasonPalette {
  season: Season;
  nameSr: string;
  /** Sve HEX boje u ravnom nizu (za prikaz palete) */
  colors: string[];
  /** Grupe po kategorijama (light neutrals, greens, itd.) */
  groups?: SeasonPaletteGroup[];
  /** Odgovori za AI savjetnika kada korisnica kaže nešto tipično */
  aiResponses: SeasonAiResponse[];
}

const PALETTES: Record<Season, SeasonPalette> = {
  warm_autumn: {
    season: 'warm_autumn',
    nameSr: 'Prava jesen',
    colors: [
      '#f5f4df', '#ffeddf', '#f4e1ad', '#e0ca93', '#b3947b', '#c29a68', '#d4a074',
      '#5f3713', '#472210', '#2b1307', '#676150', '#464740', '#454139', '#364f32', '#02232c',
      '#b5b35d', '#484c0f', '#7b7a3a', '#8a995c', '#0b5405', '#2c3e0c',
      '#f69785', '#fa8183', '#e4735d', '#e2725c', '#e65824', '#d3691e', '#d9371e',
      '#b12320', '#b44111', '#a62b2a', '#680c21', '#8d031f',
      '#f9c244', '#eba505', '#ca9104', '#1f5964', '#06a7a2', '#1b6685', '#56afbd',
      '#483d8d', '#2b4b7d',
    ],
    aiResponses: [
      { trigger: 'Ne volim boje', response: 'Počnite s toplim neutralima poput camel, čokolade ili maslinaste. To su boje koje se ponašaju kao neutralne, ali ti stoje bolje od crne.' },
      { trigger: 'Crna mi je sigurna', response: 'Crna je sigurna boja za odeću, ali ne i za Tvoje lice. Probajte tamnu čokoladu ili petrol – dobit ćete isti efekat, ali svježiji izgled.' },
      { trigger: 'Plava mi nikako ne stoji', response: 'To je česta situacija kod Prave Jeseni. Umjesto klasične plave, birajte teal ili petrol – to su Tvoje "plave".' },
    ],
  },
  soft_autumn: {
    season: 'soft_autumn',
    nameSr: 'Meka jesen',
    colors: [
      '#faf5e9', '#f2ebd5', '#f1ebd8', '#f0eadd', '#d9cdb2', '#bdb79a', '#d4b48d', '#c3b181',
      '#cfb093', '#c5af93', '#ae9482', '#a29577', '#a08172', '#846647', '#73302b',
      '#233756', '#2a4c7c', '#3c5f8d', '#36455e', '#5b699b', '#78acc8', '#4b82a9', '#9998c2',
      '#58aaa5', '#45876a', '#335749', '#2b533d', '#37412a', '#464d3a', '#78a680', '#4a531e', '#5c724a',
      '#eeaec1', '#ce899c', '#db8694', '#be8485', '#b87077', '#a25b54', '#8e5d5f',
      '#752c3b', '#5a3642', '#3f2a48',
    ],
    aiResponses: [
      { trigger: 'Sve jake boje mi stoje loše', response: 'To je potpuno u skladu s Tvojom sezonom. Meka Jesen najbolje izgleda u zagasitim i prašnjavim nijansama koje se prirodno stapaju s tenom.' },
      { trigger: 'Crna mi je najlakša', response: 'Crna je praktična, ali često previše jaka za Meku Jesen. Probajte taupe, mekanu maslinastu ili prigušenu plavo-zelenu – dobićete isti efekat, ali nježniji izgled.' },
      { trigger: 'Volim roze, ali mi rijetko stoji', response: 'Birajte soft rose i dusty pink nijanse. Čista roze je previše jaka, dok zagasite verzije lijepo prate Vaš ten.' },
    ],
  },
  deep_autumn: {
    season: 'deep_autumn',
    nameSr: 'Tamna jesen',
    colors: [
      '#efdfce', '#e4d6c6', '#ebd3b0', '#cebbad', '#b59462', '#c3b181', '#c88f67', '#938c60',
      '#584d3c', '#003253', '#b9cf82', '#556e3f', '#677923', '#085425', '#205545', '#406957', '#428d90', '#056d6c',
      '#7c0a04', '#6a0303', '#8c0305', '#9c0e1e', '#c51c39', '#ce5c5b', '#be4b50', '#803943', '#e38877',
      '#0f4c83', '#012367', '#191972', '#dd94c1', '#953d6f', '#8f2959', '#5a214d',
      '#372f29', '#430e09', '#84563c', '#704d37', '#5b3e38', '#daaf66', '#b09050', '#9a662c',
    ],
    aiResponses: [
      { trigger: 'Tamne boje mi stoje, ali crna me guši', response: 'To je tipično za Tamnu Jesen. Probajte tamnu čokoladu, espresso ili petrol – dobićete isti elegantan efekat, ali s više topline.' },
      { trigger: 'Volim jake boje', response: 'Birajte jake boje s dubinom i toplom bazom. Oxblood, tamna maslina ili bogati oker će Vam stajati bolje od čistih, jarkih nijansi.' },
      { trigger: 'Izgledam strogo u plavoj', response: 'Klasična plava zna biti hladna za Tvoju sezonu. Umjesto nje, birajte petrol ili plavo-zelene s toplom bazom.' },
    ],
  },
  cool_summer: {
    season: 'cool_summer',
    nameSr: 'Pravo ljeto',
    colors: [
      '#e3c4cc', '#d9aec8', '#eebdd2', '#e691b8', '#c47fad', '#c67095', '#ad4880', '#d9608b',
      '#f17290', '#e64b73', '#a92753', '#8e2359', '#81c1b1', '#32817b', '#3ba178', '#76a57f', '#167686',
      '#02575f', '#135b5a', '#244d5f', '#334a44', '#5dbef5', '#1875b2', '#194da0', '#86baf6', '#8795d2', '#5a64a9',
      '#2a3f76', '#2f3883', '#3b357b', '#b7b6be', '#e4e2ed', '#aeb0c5', '#bac0cc', '#6f7285', '#3f4859', '#5a7e98', '#585d70', '#626262', '#a3a2a8',
      '#beb5a6', '#a1988f', '#adacaa', '#787974', '#99848d', '#644b5e', '#584f50', '#564444',
    ],
    aiResponses: [
      { trigger: 'Siva mi stoji bolje od bež', response: 'To je tipično za Pravo Ljeto. Hladni neutrali naglašavaju Vašu svježinu, dok te topli mogu učiniti umornom.' },
      { trigger: 'U crnoj izgledam strogo', response: 'Crna često preuzima pažnju kod Pravog Ljeta. Probajte tamno sivu ili denim plavu za mekši, ali i dalje elegantan efekat.' },
      { trigger: 'Volim roze, ali ne svaku', response: 'Birajte roze sa hladnim podtonom. Kada je boja čista i svježa, a ne breskvasta, ona ti najljepše stoji.' },
    ],
  },
  light_summer: {
    season: 'light_summer',
    nameSr: 'Svetlo ljeto',
    colors: [
      '#ffbfce', '#fc8faa', '#ff7f9e', '#e25287', '#ec5678', '#fe5b8c', '#cbccfe', '#bdb8d3', '#c8a3c8', '#cba0dc', '#b284be', '#7d70ad',
      '#fade85', '#fbf1bd', '#fef9ce', '#d8bfd9', '#c59cb5', '#ecaebe', '#139c87', '#00b09f', '#34bece', '#93e9be', '#89d8c0',
      '#adcdef', '#89ceeb', '#aedae7', '#659bcd', '#fbf9ec', '#d9dde3', '#dcdcdc', '#bfc3cb', '#027970', '#3162a5', '#646f9e', '#c0b6ad', '#e4dbcb',
    ],
    aiResponses: [
      { trigger: 'Sve tamne boje mi teško stoje', response: 'To je tipično za Svijetlo Ljeto. Tvoja paleta traži svijetle i prozračne nijanse koje ne preuzimaju pažnju s lica.' },
      { trigger: 'Volim pastelne boje', response: 'Pasteli s hladnom bazom su savršen izbor za tebe. Birajte nježne roze, lavandu i baby plavu za najljepši efekat.' },
      { trigger: 'U crnoj izgledam preozbiljno', response: 'Crna je često preteška za Tvoju sezonu. Probajte svijetlu sivu ili vrlo svijetlu denim plavu za mekši izgled.' },
    ],
  },
  soft_summer: {
    season: 'soft_summer',
    nameSr: 'Meko ljeto',
    colors: [
      '#af869c', '#a2769b', '#c9a3c9', '#f8d2d2', '#eea8ac', '#cd889a', '#d2959a', '#5d3956', '#893162', '#894c5f', '#b5375a', '#cb4e60', '#9e456d',
      '#ddd8aa', '#cfc487', '#e1c894', '#aab89f', '#a8c797', '#78a681', '#b8bfd6', '#8b96c6', '#706e9a', '#b5d0e6', '#9cb7d4', '#749cbc', '#98c4e1', '#4f6b93', '#4682b4',
      '#d4cac9', '#dfd5c8', '#dcddd1', '#aaafad', '#7b797c', '#ac9a9b', '#696f6f', '#5c565a', '#44464e',
    ],
    aiResponses: [
      { trigger: 'Sve jarke boje mi stoje loše', response: 'To je tipično za Meku Ljetnu paletu. Tvoje boje treba da budu zagasite i nježne, kako bi se skladno stopile s Tvojim tenom.' },
      { trigger: 'U crnoj izgledam umorno', response: 'Crna je često previše oštra za Meku Ljetnu sezonu. Probajte srednju sivu ili prigušenu plavo-sivu za mekši izgled.' },
      { trigger: 'Ne znam zašto mi bež ne stoji', response: 'Tople bež nijanse često ne odgovaraju Mekoj Ljetnoj paleti. Birajte sivo-bež i taupe sa hladnom bazom.' },
    ],
  },
  light_spring: {
    season: 'light_spring',
    nameSr: 'Svetlo proleće',
    colors: [
      '#efdfca', '#efdece', '#f0ead8', '#d8d1cc', '#f4e4ad', '#cbc4b9', '#d0c4ad', '#ab917b', '#9b7252',
      '#9ad4e8', '#7eb7fe', '#7a98ff', '#ab6dc2', '#e2b1ff', '#b18ada', '#93e9be', '#3fe1d1', '#11c8cb', '#c3faa3', '#cff0c0', '#ace2b0',
      '#f8de7e', '#f6c36d', '#efdb82', '#f4e97b', '#fed777', '#e76677', '#ed888a', '#ff888d', '#ec5478', '#fe5b8e', '#f46fa3', '#ffcba4', '#febaad', '#fea079', '#f6c4c5', '#fea6ca', '#fd8fae',
    ],
    aiResponses: [
      { trigger: 'Sive boje mi deluju beživotno', response: 'To je tipično za Svijetlo Proljeće. Vašoj paleti više odgovaraju svijetli, topli neutrali koji vraćaju svježinu licu.' },
      { trigger: 'Volim pastelne boje', response: 'Pasteli su odlični izbor ako su čisti i blago topli. Birajte breskvu, mint i svijetlu lavandu za najbolji efekat.' },
      { trigger: 'U crnoj izgledam preozbiljno', response: 'Crna je često preteška za Svijetlo Proljeće. Probajte svijetlu karamela ili topli pijesak za mekši, svježiji izgled.' },
    ],
  },
  warm_spring: {
    season: 'warm_spring',
    nameSr: 'Pravo proleće',
    colors: [
      '#e0b48a', '#e6ab71', '#c98559', '#ae6d4c', '#865e45', '#714f39', '#f5f4df', '#c7bca6', '#c2b180',
      '#fade85', '#f2c64b', '#eaa222', '#fd6547', '#fe5c52', '#fe7264', '#fa7272', '#fe7e9d',
      '#01a93c', '#4dbb14', '#719c43', '#b6bf4f', '#9fa920', '#167144', '#049d62', '#0f6623', '#008080',
      '#a4bae5', '#7b9cca', '#5184c3', '#06b6ed',
    ],
    aiResponses: [
      { trigger: 'U sivom izgledam umorno', response: 'To je tipično za Pravo Proljeće. Tvoja paleta traži toplinu i čistoću, pa će ti topli neutrali dati svježiji izgled.' },
      { trigger: 'Volim jake boje', response: 'Jake boje Vam mogu stajati odlično ako su tople i čiste. Koral, žuta i svježa zelena su Tvoji saveznici.' },
      { trigger: 'Crna mi deluje preteško', response: 'Crna je često preoštra za Tvoju sezonu. Probajte ivory ili toplu karamelu za mekši, ali i dalje elegantan efekat.' },
    ],
  },
  clear_spring: {
    season: 'clear_spring',
    nameSr: 'Sjajno proleće',
    colors: [
      '#fffffc', '#fffff2', '#efe9dc', '#e0dcd6', '#c1b7aa', '#c7bda3', '#a09998', '#8c918e',
      '#4169e3', '#3399ff', '#5b51ce', '#766fc7', '#3de0d0', '#0df1ef', '#7df9ff', '#139c87', '#009472', '#00b09d',
      '#32cc33', '#99cc34', '#4bbb17', '#058281', '#096723', '#f5c226', '#f4b320', '#fff650', '#ffd661', '#ffc66f', '#cd7722',
      '#ff6d6d', '#f94e00', '#e94934', '#fe0902', '#fe4041', '#bc433b', '#f4bbc9', '#f5909d', '#e35b7d', '#e30a5f', '#df2189', '#fe66cb',
    ],
    aiResponses: [
      { trigger: 'Pastelne boje me čine blijedom', response: 'To je tipično za Jarko Proljeće. Tvoja paleta traži čiste i snažne boje koje vraćaju energiju licu.' },
      { trigger: 'U sivom izgledam umorno', response: 'Sive nijanse često nemaju dovoljno energije za Tvoju sezonu. Probajte jarki tirkiz ili sunčanu žutu za svježiji izgled.' },
      { trigger: 'Volim jake boje, ali ne svaku', response: 'Birajte jake boje koje su čiste i tople. Ako nijansa deluje mutno ili prigušeno, ona izlazi iz Tvoje palete.' },
    ],
  },
  cool_winter: {
    season: 'cool_winter',
    nameSr: 'Prava zima',
    colors: [
      '#000000', '#ffffff', '#d9dddf', '#828185', '#8c8c8a', '#bebebe', '#001f7f', '#002d9c', '#0033cc', '#0b3d91', '#1f4fd8', '#2f5be3', '#4a6fe3',
      '#3b1f5c', '#4b2a6b', '#5a3d8a', '#6a4fa3', '#7c6fb8', '#003b3f', '#004f5d', '#005f73', '#0b6b78', '#1a7f8c', '#2f8f9e',
      '#a0005a', '#b0006f', '#c0007a', '#d10086', '#e00093', '#8b0015', '#9c0018', '#aa0020', '#b40028', '#c00030',
      '#e6f0ff', '#dbe7ff', '#cfe0ff', '#f0e6ff', '#f5e9ff',
    ],
    aiResponses: [
      { trigger: 'U bež izgledam umorno', response: 'To je tipično za Pravu Zimu. Tvoja paleta traži hladne i čiste boje, dok Vas tople bež nijanse vizuelno gase.' },
      { trigger: 'Crna mi stoji bolje od svih boja', response: 'Crna je jedna od Tvojih najboljih boja. U kombinaciji s čistom bijelom ili hladnom plavom daje najjači efekat za Tvoju sezonu.' },
      { trigger: 'Pastelne boje mi ne stoje', response: 'Pasteli često nemaju dovoljno kontrasta za Pravu Zimu. Birajte čiste i hladne boje za svježiji izgled.' },
    ],
  },
  deep_winter: {
    season: 'deep_winter',
    nameSr: 'Tamna zima',
    colors: [
      '#0a0a0a', '#2c272c', '#45464e', '#696969', '#f6f6f6', '#c2c2cb', '#c0c0c0',
      '#0145ab', '#111d6b', '#03075f', '#2d62a5', '#0273bd', '#0792d0', '#57a1d5', '#679acd', '#bbb9d5',
      '#c54b8b', '#8e4584', '#956ba2', '#5a234a', '#522d55', '#6a0002', '#7a1c31', '#972d4e', '#9d1c31', '#c61d3c', '#b41a3a',
      '#e1ad02', '#d4b141', '#f2e9a1', '#507944', '#274f36', '#38422c', '#1a3b46', '#028381', '#01657f',
    ],
    aiResponses: [
      { trigger: 'Izgledam teško u bež', response: 'Bež nijanse često imaju toplu bazu koja ne odgovara Tamnoj Zimi. Probajte tamno sivu ili mornarsko-plavu za bolji balans.' },
      {
        trigger: 'Ne sviđaju mi se boje iz moje palete',
        response: [
          'Ne morate odmah nositi cijelu paletu. Dovoljno je krenuti s jednom ili dvije nijanse koje su ti neutralne, a ostale posmatrati kao mogućnost, ne obavezu.',
          'Često volimo boje koje smo navikli nositi, a ne nužno one koje nam najbolje stoje. To ne znači da Vaš ukus nije dobar – samo da je navika jača od efekta.',
        ],
      },
    ],
  },
  clear_winter: {
    season: 'clear_winter',
    nameSr: 'Sjajna zima',
    colors: [
      '#000000', '#ffffff', '#f5f5ff', '#e6e8f2', '#cfd3e6', '#9ea3c6', '#2b2e4a', '#1b1f3b',
      '#0018ff', '#002dff', '#0047ff', '#005bff', '#0066ff', '#1a4fff', '#3b6cff', '#5f8dff',
      '#4b00ff', '#5c1cff', '#6a2cff', '#7b3fe4', '#8c4dff', '#9a6cff', '#ff007f', '#ff1493', '#ff1cae', '#e60073', '#d1006f', '#c4007a',
      '#ff0028', '#ff0033', '#e6002e', '#d9002b', '#c40026', '#00ffcc', '#00e6c3', '#00cfae', '#009f9c', '#007f7f',
      '#e6f0ff', '#dbe7ff', '#cfe0ff', '#f0e6ff', '#ffe6f2', '#fff200', '#ffeb3b', '#f6e700',
    ],
    aiResponses: [
      { trigger: 'Volim jarke boje', response: 'To je tipično za Jarku Zimu. Tvoja paleta je najjača u hladnim, čistim i kontrastnim nijansama.' },
      { trigger: 'Pastelne boje me čine blijedom', response: 'Pasteli nemaju dovoljno kontrasta za Tvoju sezonu. Birajte čiste i jarke boje za snažniji izgled.' },
      { trigger: 'U bež izgledam umorno', response: 'Bež nijanse često imaju toplu bazu koja ne odgovara Jarkoj Zimi. Probajte crnu, bijelu ili hladnu plavu za bolji balans.' },
    ],
  },
};

/** Vrati paletu za datu sezonu */
export function getSeasonPalette(season: Season): SeasonPalette {
  return PALETTES[season];
}

/** Sve palete (za listanje / galeriju) */
export function getAllSeasonPalettes(): SeasonPalette[] {
  return Object.values(PALETTES);
}

/** Za AI savjetnika: pronađi odgovor ako korisnički unos sliči nekom triggeru */
export function findAiResponseForSeason(
  season: Season,
  userMessage: string
): string | null {
  const palette = PALETTES[season];
  if (!palette) return null;
  const lower = userMessage.toLowerCase().trim();
  for (const { trigger, response } of palette.aiResponses) {
    const triggerLower = trigger.toLowerCase();
    if (lower.includes(triggerLower) || triggerLower.split(/\s+/).every((w) => lower.includes(w))) {
      return Array.isArray(response) ? response[0] : response;
    }
  }
  return null;
}

export default PALETTES;
