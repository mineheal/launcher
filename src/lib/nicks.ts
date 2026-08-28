/* ── MineHeal: генератор ников ─────────────────────────────
   Система «конструктор»: префикс + корень + суффикс + число.
   Даёт десятки тысяч комбинаций, плюс curated-список «как Grow». */

export const CURATED_NICKS = [
  "Grow", "Healer", "Steve_RU", "Alexa", "Notch_Fan", "DanyaPlay", "Kreeper228",
  "ShadowGrow", "IronGolem", "EnderQueen", "Piggy", "Herobrine_X", "CreeperAwMan",
  "DiamondHands", "ZombieSlayer", "LavaWalker", "BlockMaster", "SunnyCraft",
  "MoonHeal", "Grifon", "Barsik_MC", "Volk123", "MedvedPRO", "Kesha2007",
  "RedstoneGod", "MineLord", "CraftQueen", "TNT_Lover", "Skelet0n", "VityaMiner",
  "Pro100Igrok", "Gribnik", "Kartoshka", "Ogurec", "BabkaZina", "DedMaxim",
  "NeKitPlay", "SanyaPro", "Timka228", "VladCraft", "Kirill2010", "MaxBloxx",
  "PixelPasha", "DimaDinar", "GoshaGriefer", "LeraLoot", "NastyaNether",
  "RomaRavine", "IlyaIngot", "SonyaSapphire", "ArtemAxe", "GlebGold",
  "WitchWater", "EnderPearl", "SlimeChunk", "BedrockBro", "ObsidianOleg",
  "FarmerFedya", "PotionMaster", "EnchantEgor", "VillagerVan", "GolemGuard",
];

const PREFIXES = [
  "Grow", "Shadow", "Iron", "Emerald", "Gold", "Frost", "Blaze", "Storm", "Night",
  "Wild", "Dark", "Crazy", "Turbo", "Mega", "Ultra", "Pixel", "Block", "Mine",
  "Heal", "Royal", "Swift", "Brave", "Lucky", "Mossy", "Amber",
];

const ROOTS = [
  "wolf", "bear", "fox", "creeper", "zombie", "skeleton", "ender", "golem",
  "slime", "witch", "knight", "ninja", "miner", "wizard", "dragon", "phoenix",
  "hunter", "rider", "smith", "ghost", "falcon", "viper", "titan", "spirit",
];

const SUFFIXES = [
  "ik", "ok", "er", "pro", "x", "ish", "son", "master", "lord", "king", "boy", "girl", "ru", "mc", "play",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Случайный ник: 40% — curated-список, 60% — конструктор. */
export function generateNick(): string {
  if (Math.random() < 0.4) {
    return pick(CURATED_NICKS);
  }
  const style = Math.random();
  let nick: string;
  if (style < 0.4) {
    // Grow + число
    nick = pick(PREFIXES) + Math.floor(Math.random() * 900 + 100);
  } else if (style < 0.75) {
    // ShadowWolf / IronGolem
    const root = pick(ROOTS);
    nick = pick(PREFIXES) + root[0].toUpperCase() + root.slice(1);
  } else {
    // Wolfik_pro, Miner228
    const root = pick(ROOTS);
    const cap = root[0].toUpperCase() + root.slice(1);
    nick = Math.random() < 0.5 ? cap + pick(SUFFIXES) : cap + pick(SUFFIXES) + Math.floor(Math.random() * 900 + 100);
  }
  return nick.slice(0, 16);
}

/** Проверка ника по правилам Minecraft (3–16, латиница/цифры/_). */
export function isValidNick(nick: string): boolean {
  return /^[A-Za-z0-9_]{3,16}$/.test(nick);
}

/** Детерминированный seed из строки (для процедурного скина). */
export function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
