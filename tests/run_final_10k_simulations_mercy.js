import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runFullSimulation } from '../server/services/simulationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const combinations = [
  {
    gameFile: 'game_isp2_ssr3_jsr3_tr11',
    setFile: 'TV20-TW30-TG40-TB64_LV17-LW26-LG34-LB44'
  },
  {
    gameFile: 'game_isp2_ssr3_jsr3_tr11',
    setFile: 'TV20-TW30-TG40-TB64_LV17-LW26-LG34-LB45'
  },
  {
    gameFile: 'game_isp3_ssr4_jsr2_tr12',
    setFile: 'TV16-TW24-TG32-TB62_LV15-LW23-LG30-LB40'
  }
];

const count = 10000;
const eventsPath = path.join(__dirname, 'simulation_defaults/events.json');
const eventsConfig = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

console.log(`Starting evaluations for 3 Variants of Jakub's Mercy (10,000 games per combination per variant)...\n`);

async function runEvaluations() {
  const variantsResults = [];

  for (const variant of [1, 2, 3]) {
    console.log(`\n======================================================`);
    console.log(`EVALUATING MERCY VARIANT #${variant}`);
    console.log(`======================================================`);
    
    const results = [];
    
    for (const combo of combinations) {
      const gamePath = path.join(__dirname, `simulates_game/${combo.gameFile}.json`);
      const setsPath = path.join(__dirname, `simulations_sets/${combo.setFile}.json`);
      
      const gameConfig = JSON.parse(fs.readFileSync(gamePath, 'utf8'));
      const setsConfig = JSON.parse(fs.readFileSync(setsPath, 'utf8'));
      
      // Set the mercy variant on game configuration
      gameConfig.mercyVariant = variant;
      
      console.log(`Simulating combo: ${combo.gameFile} + ${combo.setFile}...`);
      
      let badDiffCount = 0;
      let totalScoreDiff = 0;
      const races = ["vampire", "werewolf", "ghost", "bardak"];
      const totalMercyPoints = { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 };
      const totalScore = { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 };
      
      const batchSize = 5;
      for (let i = 0; i < count; i += batchSize) {
        const promises = [];
        const currentBatchSize = Math.min(batchSize, count - i);
        
        for (let b = 0; b < currentBatchSize; b++) {
          promises.push((async () => {
            const setsClone = JSON.parse(JSON.stringify(setsConfig));
            const gameClone = JSON.parse(JSON.stringify(gameConfig));
            const eventsClone = JSON.parse(JSON.stringify(eventsConfig));
            
            // Yield to event loop to allow concurrent tick pattern
            await new Promise(resolve => setImmediate(resolve));
            
            return runFullSimulation(setsClone, gameClone, eventsClone);
          })());
        }
        
        const batchRes = await Promise.all(promises);
        
        batchRes.forEach(res => {
          // Calculate min/max points for checking the spread
          const points = races.map(r => res.analytics[r].total);
          const maxPoints = Math.max(...points);
          const minPoints = Math.min(...points);
          
          if (minPoints < 0.5 * maxPoints) {
            badDiffCount++;
          }
          
          totalScoreDiff += res.scoreDiff;
          
          // Accumulate stats
          races.forEach(r => {
            totalMercyPoints[r] += (res.analytics[r].mercyPoints || 0);
            totalScore[r] += res.analytics[r].total;
          });
        });
      }
      
      const badDiffPercentage = (badDiffCount / count) * 100;
      const avgScoreDiff = totalScoreDiff / count;
      
      const avgMercyPoints = {};
      const avgScore = {};
      races.forEach(r => {
        avgMercyPoints[r] = totalMercyPoints[r] / count;
        avgScore[r] = totalScore[r] / count;
      });
      
      results.push({
        ...combo,
        badDiffPercentage,
        avgScoreDiff,
        avgMercyPoints,
        avgScore
      });
    }
    
    variantsResults.push({
      variant,
      results
    });
  }

  // Print comprehensive summary
  console.log("\n\n######################################################################");
  console.log("                       SUMMARY OF RESULTS");
  console.log("######################################################################");

  variantsResults.forEach(vr => {
    console.log(`\n=================== VARIANT #${vr.variant} ===================`);
    if (vr.variant === 1) {
      console.log("Rule: 100% of remaining anger goes to general, resets to 0");
    } else if (vr.variant === 2) {
      console.log("Rule: 50% (rounded up) of remaining anger goes to general, rest stays on Jakub");
    } else if (vr.variant === 3) {
      console.log("Rule: 50% (rounded up) of remaining anger goes to general, rest resets to 0");
    }
    
    vr.results.forEach((res, index) => {
      console.log(`\n  Combo #${index + 1}: ${res.gameFile} + ${res.setFile}`);
      console.log(`    - Games with poor balance (lowest < 50% of highest): ${res.badDiffPercentage.toFixed(2)}%`);
      console.log(`    - Average 1st-to-4th score spread: ${res.avgScoreDiff.toFixed(2)} pts`);
      console.log(`    - Avg Mercy Points awarded: V: ${res.avgMercyPoints.vampire.toFixed(2)} | W: ${res.avgMercyPoints.werewolf.toFixed(2)} | G: ${res.avgMercyPoints.ghost.toFixed(2)} | B: ${res.avgMercyPoints.bardak.toFixed(2)}`);
      console.log(`    - Avg Final Scores: V: ${res.avgScore.vampire.toFixed(1)} | W: ${res.avgScore.werewolf.toFixed(1)} | G: ${res.avgScore.ghost.toFixed(1)} | B: ${res.avgScore.bardak.toFixed(1)}`);
    });
  });

  console.log("\n=================== BALANCE EVALUATION ===================");
  const summaries = variantsResults.map(vr => {
    const avgBadDiff = vr.results.reduce((sum, r) => sum + r.badDiffPercentage, 0) / vr.results.length;
    const avgSpread = vr.results.reduce((sum, r) => sum + r.avgScoreDiff, 0) / vr.results.length;
    return {
      variant: vr.variant,
      avgBadDiff,
      avgSpread
    };
  });

  summaries.sort((a, b) => a.avgBadDiff - b.avgBadDiff);

  summaries.forEach(s => {
    console.log(`Variant #${s.variant}: Average poor balance rate = ${s.avgBadDiff.toFixed(2)}%, Average score spread = ${s.avgSpread.toFixed(2)} points`);
  });

  console.log(`\n🏆 RECOMMENDED VARIANT FOR BEST BALANCE: Variant #${summaries[0].variant} (Lowest poor balance rate)`);
  console.log("######################################################################");
}

runEvaluations().catch(err => {
  console.error("Evaluations failed:", err);
});
