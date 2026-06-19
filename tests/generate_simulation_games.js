import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, 'simulates_game');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log("Starting batch game configuration generation...");
console.log(`Output directory: ${OUTPUT_DIR}`);

let count = 0;

for (let isp = 2; isp <= 3; isp++) {
  for (let ssr = 3; ssr <= 4; ssr++) {
    for (let jsr = 2; jsr <= 3; jsr++) {
      for (let tr = 10; tr <= 12; tr++) {
        const gameConfig = {
          gameTitle: "MASAKRA na Starym Majdanie",
          startPointsAmmount: 20,
          initialSetsPerPlayer: isp,
          setupSetsPerPlayerPerRound: ssr,
          jakubSetsPerRound: jsr,
          totalRounds: tr
        };

        const fileName = `game_isp${isp}_ssr${ssr}_jsr${jsr}_tr${tr}.json`;
        const filePath = path.join(OUTPUT_DIR, fileName);

        fs.writeFileSync(filePath, JSON.stringify(gameConfig, null, 2), 'utf8');
        count++;
      }
    }
  }
}

console.log(`Successfully generated ${count} game config files in ${OUTPUT_DIR}.`);
