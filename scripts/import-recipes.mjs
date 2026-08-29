#!/usr/bin/env node
/**
 * The Billy Krab — Recipe Import System
 *
 * Reads the source cookbook Markdown in content/recipes/, matches every recipe
 * to its photograph in public/recipes/, assigns the unlock order used by the
 * 365-day tracker, and writes src/data/recipes.json.
 *
 * Run with:  npm run import:recipes
 *
 * Nothing about a recipe is invented here. Titles, descriptions, timings,
 * ingredients, method steps and cook's notes all come straight out of the
 * Markdown. Only the routing metadata (continent, region, unlock order, image
 * path, difficulty band) is derived.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MD_DIR = path.join(ROOT, 'content', 'recipes');
const IMG_DIR = path.join(ROOT, 'public', 'recipes');
const OUT_FILE = path.join(ROOT, 'src', 'data', 'recipes.json');

/**
 * The culinary journey. Order here *is* the unlock order: the tracker walks
 * the world from Africa eastward and finishes in Indonesia.
 */
const SECTIONS = [
  {
    file: '08-african.md',
    cuisine: 'African',
    continent: 'Africa',
    region: 'Africa',
    blurb: 'Where the journey starts. Suya smoke, berbere, harissa and peanut stews.',
    coords: [9.1, 18.4],
  },
  {
    file: '06-arabian-peninsula.md',
    cuisine: 'Arabian Peninsula & Levant',
    continent: 'Asia',
    region: 'Middle East',
    blurb: 'Loomi, baharat and rose water. Feasts built for a long table.',
    coords: [24.7, 46.7],
  },
  {
    file: '07-latin-north-american.md',
    cuisine: 'Latin & North American',
    continent: 'Americas',
    region: 'The Americas',
    blurb: 'Griddles, smokers and fryers, from Lima to New England.',
    coords: [14.6, -90.5],
  },
  {
    file: '05-italian.md',
    cuisine: 'Italian',
    continent: 'Europe',
    region: 'Southern Europe',
    blurb: 'Twenty regions pretending to be one cuisine. Dough, rice, cured pork.',
    coords: [41.9, 12.5],
  },
  {
    file: '03-french.md',
    cuisine: 'French',
    continent: 'Europe',
    region: 'Western Europe',
    blurb: 'Mostly technique. Good butter matters more than anything you buy.',
    coords: [46.6, 2.3],
  },
  {
    file: '02-japanese.md',
    cuisine: 'Japanese',
    continent: 'Asia',
    region: 'East Asia',
    blurb: 'A small pantry investment, then a lifetime of cheap dinners.',
    coords: [36.2, 138.2],
  },
  {
    file: '04-thai.md',
    cuisine: 'Thai',
    continent: 'Asia',
    region: 'Southeast Asia',
    blurb: 'Pounded pastes, fish sauce, palm sugar, lime. Balance over heat.',
    coords: [15.8, 100.9],
  },
  {
    file: '01-indonesian.md',
    cuisine: 'Indonesian',
    continent: 'Asia',
    region: 'Southeast Asia',
    blurb: 'The final port. Fry the spice paste until the oil separates.',
    coords: [-2.5, 118.0],
  },
];

/** Country attribution per recipe title, for the journey map and filters. */
const COUNTRY_BY_TITLE = {
  // African
  'Ethiopian Beef Tibs': 'Ethiopia',
  'Yassa Fish': 'Senegal',
  'Chicken Suya': 'Nigeria',
  Nkwobi: 'Nigeria',
  'Chicken Brochettes': 'Rwanda',
  'Kuku Paka': 'Kenya',
  Shakshuka: 'Tunisia',
  'Harissa Chicken Thighs': 'Tunisia',
  'Sukuma Wiki': 'Kenya',
  'Pan-Seared Tilapia': 'Ghana',
  'Poulet Yassa': 'Senegal',
  'Peppered Gizzard': 'Nigeria',
  'Peri-Peri Chicken Wings': 'Mozambique',
  Mafe: 'Mali',
  Fumbwa: 'DR Congo',
  // Arabian Peninsula & Levant
  Shawarma: 'Lebanon',
  'Kunafa Nabulsiyeh': 'Palestine',
  Qatayef: 'Levant',
  Mansaf: 'Jordan',
  'Dajaj Mashwi': 'Saudi Arabia',
  Laddu: 'Kuwait',
  Sayadiyah: 'Lebanon',
  "Ma'amoul": 'Levant',
  'Ogaily (Ageeli)': 'Kuwait',
  Shuraik: 'Saudi Arabia',
  Muhammar: 'Bahrain',
  Aseedah: 'Yemen',
  Saloona: 'Qatar',
  Mufattah: 'Saudi Arabia',
  Fatoot: 'Yemen',
  // Latin & North American
  'Birria Tacos': 'Mexico',
  'Tres Leches Cake': 'Nicaragua',
  'Lomo Saltado': 'Peru',
  'Chicha Morada': 'Peru',
  'Tallarines Verdes': 'Peru',
  'Pescado Frito': 'Peru',
  'Papa a la Huancaína': 'Peru',
  'Crispy Colombian Empanadas': 'Colombia',
  'Chicken Burrito Bowls': 'United States',
  Chilaquiles: 'Mexico',
  'Classic Cheeseburger': 'United States',
  'Crab Imperial': 'United States',
  'New England Clam Chowder': 'United States',
  'Maine Lobster Roll': 'United States',
  Poutine: 'Canada',
  'Texas Smoked Brisket': 'United States',
  'Apple Pie': 'United States',
};

const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Strip markdown emphasis so plain text lands in cards and search. */
const plain = (s) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').trim();

function parseSection(md) {
  // Split on "## N. Title", keeping the heading.
  const parts = md.split(/\n(?=##\s+\d+\.\s)/g).slice(1);
  return parts.map((block) => {
    const lines = block.split('\n');
    const title = plain(lines[0].replace(/^##\s+\d+\.\s*/, '').trim());

    const body = lines.slice(1).join('\n').trim();

    // Meta line: **Serves 6 | Prep 30 min | Cook 2 hr**
    const metaMatch = body.match(/^\*\*((?:Serves|Makes)[^*]+)\*\*$/m);
    const metaRaw = metaMatch ? metaMatch[1].trim() : '';
    const metaBits = metaRaw.split('|').map((s) => s.trim());
    const yieldText = metaBits[0] || '';
    const prep = (metaBits.find((b) => /^Prep/i.test(b)) || '').replace(/^Prep\s*/i, '');
    const cook = (metaBits.find((b) => /^Cook/i.test(b)) || '').replace(/^Cook\s*/i, '');

    // Description: everything between the title and the meta line.
    const descEnd = metaMatch ? body.indexOf(metaMatch[0]) : body.length;
    const description = plain(
      body
        .slice(0, descEnd)
        .split('\n')
        .filter((l) => l.trim() && !l.startsWith('---'))
        .join(' ')
    );

    // Ingredients: between **Ingredients** and **Method**
    const ingBlock = body.match(/\*\*Ingredients\*\*\n([\s\S]*?)\n\*\*Method\*\*/);
    const ingredientGroups = [];
    if (ingBlock) {
      let current = { group: '', items: [] };
      for (const raw of ingBlock[1].split('\n')) {
        const line = raw.trim();
        if (!line) continue;
        if (/^\*[^*].*\*$/.test(line)) {
          if (current.items.length) ingredientGroups.push(current);
          current = { group: plain(line), items: [] };
        } else if (line.startsWith('-')) {
          current.items.push(plain(line.replace(/^-\s*/, '')));
        }
      }
      if (current.items.length) ingredientGroups.push(current);
    }

    // Method: numbered steps after **Method**
    const methodBlock = body.match(/\*\*Method\*\*\n([\s\S]*?)(?:\n\*\*Cook's note:|$)/);
    const method = methodBlock
      ? methodBlock[1]
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => /^\d+\./.test(l))
          .map((l) => plain(l.replace(/^\d+\.\s*/, '')))
      : [];

    const noteMatch = body.match(/\*\*Cook's note:\*\*\s*([\s\S]*?)(?:\n---|$)/);
    const cooksNote = noteMatch ? plain(noteMatch[1].replace(/\n/g, ' ')) : '';

    return {
      title,
      description,
      yieldText,
      prep,
      cook,
      ingredientGroups,
      method,
      cooksNote,
      totalIngredients: ingredientGroups.reduce((n, g) => n + g.items.length, 0),
    };
  });
}

/** Difficulty is derived from real signals in the recipe, not guessed. */
function difficultyFor(r) {
  const mins = (t) => {
    if (!t) return 0;
    let m = 0;
    const hr = t.match(/([\d¼½¾.]+)\s*hr/i);
    const min = t.match(/(\d+)\s*min/i);
    const frac = { '¼': 0.25, '½': 0.5, '¾': 0.75 };
    if (hr) m += (parseFloat(hr[1]) || frac[hr[1]] || 1) * 60;
    if (min) m += parseInt(min[1], 10);
    if (/overnight|days|day/i.test(t)) m += 480;
    return m;
  };
  const load = mins(r.prep) + mins(r.cook) * 0.5 + r.totalIngredients * 4 + r.method.length * 6;
  if (load < 110) return 'Deckhand';
  if (load < 200) return 'Line Cook';
  if (load < 320) return 'Head Chef';
  return 'Kraken';
}

/** Image matching: normalise both sides, then score candidates. */
function normalise(s) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Titles whose photo filename can't be reached by fuzzy matching alone. */
const IMAGE_OVERRIDES = {
  'Pizza Napoletana': 'Neapolitan Pizza',
  "Pasta 'ncasciata": 'Pasta Ncasciata',
  'Pappardelle al Ragù di Cinghiale': 'Pappardelle',
  'Canederli con Formaggio': 'Canederli Al Formaggio',
  'Filet de Bœuf en Croûte': 'Filet De Boeuf',
  'Poulet Rôti': 'Poulet Roti',
  'Canapés au Saumon Fumé': 'canapes au saumon',
  "Soupe à l'Oignon Gratinée": 'Soupe a l oignon',
  Baguette: 'Baguettes',
  'Saint-Félicien (Baked, with Walnuts and Honey)': 'Saint-Felicien',
  'Kare (Japanese Curry)': 'Kare',
  'Chicken Karaage': 'Karaage',
  'Kare Udon': 'Curry Udon',
  'Unagi (Kabayaki)': 'Unagi',
  'Mochi (Daifuku)': 'Mochi',
  'Hiroshima-Style Okonomiyaki': 'Hiroshima Style okonomiyaki',
  'Hamamatsu Gyoza': 'hamamatsu gyoza',
  'Pad Thai': 'Phat Thai',
  'Kuai-Tiao Ruea': 'Kuai_tiao_ruea',
  'Khao Kha Mu': 'Khao kha mu',
  'Khao Phat': 'Khao phat',
  'Nasi Padang (Rendang and Sambal Ijo)': 'Nasi Padang',
  'Pempek Palembang': 'Pempek',
  'Sate Ayam Ponorogo': 'Sate Ponorogo',
  'Gado Gado': 'Gado gado',
  'Kunafa Nabulsiyeh': 'Künefe',
  Aseedah: 'Aaseedah',
  'Ogaily (Ageeli)': 'Ageeli',
  Shakshuka: 'Shaksuka',
  'Peri-Peri Chicken Wings': 'Peri-Peri-Chicken',
  'Papa a la Huancaína': 'Papa La Huancaina',
  'Chicha Morada': 'Peruvian Chicha Morada',
  'Tres Leches Cake': 'Tres Leches CaKE',
  'New England Clam Chowder': 'Clam Chowder',
  'Apple Pie': 'All-American Apple pie',
  'Chicken Burrito Bowls': 'Chicken burrito bowls',
  'Chicken Brochettes': 'Chicken brochettes',
};

function main() {
  const available = fs.existsSync(IMG_DIR)
    ? fs.readdirSync(IMG_DIR).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
    : [];
  const bySlug = new Map(available.map((f) => [slugify(path.parse(f).name), f]));

  const recipes = [];
  let unlockOrder = 0;
  const unmatched = [];

  for (const section of SECTIONS) {
    const md = fs.readFileSync(path.join(MD_DIR, section.file), 'utf8');
    const parsed = parseSection(md);

    for (const r of parsed) {
      unlockOrder += 1;
      const id = unlockOrder;
      const slug = slugify(r.title);

      // Image lookup: slug hit, then override, then loose token overlap.
      let image = bySlug.get(slug);
      if (!image && IMAGE_OVERRIDES[r.title]) {
        image = bySlug.get(slugify(IMAGE_OVERRIDES[r.title]));
      }
      if (!image) {
        const target = normalise(r.title).split(' ').filter(Boolean);
        let best = null;
        let bestScore = 0;
        for (const [candSlug, file] of bySlug) {
          const cand = candSlug.replace(/-/g, ' ').split(' ');
          const overlap = target.filter((t) => cand.includes(t)).length;
          const score = overlap / Math.max(target.length, cand.length);
          if (score > bestScore) {
            bestScore = score;
            best = file;
          }
        }
        if (bestScore >= 0.5) image = best;
      }
      if (!image) unmatched.push(`${section.cuisine} — ${r.title}`);

      // Normalise the filename to an ASCII slug. Spaces, apostrophes and
      // accents in URLs are handled inconsistently by static hosts, and this
      // also makes the folder readable next to the recipe list.
      if (image) {
        const desired = `${slug}${path.extname(image).toLowerCase()}`;
        if (image !== desired) {
          fs.renameSync(path.join(IMG_DIR, image), path.join(IMG_DIR, desired));
          bySlug.delete(slugify(path.parse(image).name));
          bySlug.set(slugify(desired.replace(/\.[^.]+$/, '')), desired);
          image = desired;
        }
      }

      recipes.push({
        id,
        unlockOrder,
        slug,
        title: r.title,
        cuisine: section.cuisine,
        country: COUNTRY_BY_TITLE[r.title] || section.cuisine.replace(/ &.*/, ''),
        continent: section.continent,
        region: section.region,
        coords: section.coords,
        image: image ? `recipes/${image}` : '',
        description: r.description,
        yield: r.yieldText,
        prep: r.prep,
        cook: r.cook,
        difficulty: difficultyFor(r),
        ingredientGroups: r.ingredientGroups,
        method: r.method,
        cooksNote: r.cooksNote,
      });
    }
  }

  const journey = SECTIONS.map((s, i) => ({
    order: i + 1,
    cuisine: s.cuisine,
    continent: s.continent,
    region: s.region,
    blurb: s.blurb,
    coords: s.coords,
    count: recipes.filter((r) => r.cuisine === s.cuisine).length,
    firstUnlock: recipes.find((r) => r.cuisine === s.cuisine).unlockOrder,
    lastUnlock: [...recipes].reverse().find((r) => r.cuisine === s.cuisine).unlockOrder,
  }));

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify({ journey, recipes }, null, 2));

  console.log(`Parsed ${recipes.length} recipes across ${SECTIONS.length} cuisines.`);
  console.log(`Images matched: ${recipes.filter((r) => r.image).length}/${recipes.length}`);
  if (unmatched.length) {
    console.log('No image found for:');
    unmatched.forEach((u) => console.log('  - ' + u));
  }
  console.log(`Wrote ${path.relative(ROOT, OUT_FILE)}`);
}

main();
