import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateSetData } from '../server/setManager.js';
import { DEFAULT_POWER_CONFIG } from '../server/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, 'simulations_sets');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log("Starting batch set generation...");
console.log(`Output directory: ${OUTPUT_DIR}`);

let count = 0;
const finalPower = DEFAULT_POWER_CONFIG;
const finalMaxPower = 6;

for (let Tv = 14; Tv <= 20; Tv++) {
  const minLv = Math.max(10, Tv - 5);
  const maxLv = Math.min(18, Tv);
  
  for (let Lv = minLv; Lv <= maxLv; Lv++) {
    // Werewolves (Fixed at 150% of Vampires)
    const Tw = Math.ceil(1.5 * Tv);
    const Lw = Math.ceil(1.5 * Lv);
    
    // Ghosts (Fixed at 200% of Vampires)
    const Tg = 2 * Tv;
    const Lg = 2 * Lv;
    
    // Bardaks (totals 60-70, limits 40-50)
    for (let Tb = 60; Tb <= 70; Tb++) {
      for (let Lb = 40; Lb <= 50; Lb++) {
        const pawns = {
          vampire: Tv,
          werewolf: Tw,
          ghost: Tg,
          bardak: Tb
        };
        const pawnsInPlayLimit = {
          vampire: Lv,
          werewolf: Lw,
          ghost: Lg,
          bardak: Lb
        };
        
        const namePart1 = `TV${Tv}-TW${Tw}-TG${Tg}-TB${Tb}`;
        const namePart2 = `LV${Lv}-LW${Lw}-LG${Lg}-LB${Lb}`;
        const customName = `${namePart1}_${namePart2}`;
        
        const data = generateSetData(pawns, finalPower, finalMaxPower, {
          displayName: customName,
          description: 'Batch generated simulation set',
          pawnsInPlayLimit: pawnsInPlayLimit
        });
        
        data.setName = customName;
        
        const filePath = path.join(OUTPUT_DIR, `${customName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        count++;
      }
    }
  }
}

console.log(`Successfully generated ${count} set files in ${OUTPUT_DIR}.`);
