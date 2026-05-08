import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEffectManager } from './eventEffectManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class GameEventPhaseManager {
  constructor(gameData) {
    this.gameData = gameData;
    this.eventsConfigPath = path.join(__dirname, 'configs', 'events_default.json');
  }

  /**
   * Initializes the event state if it doesn't exist.
   */
  ensureEventState() {
    if (!this.gameData.events) {
      try {
        if (fs.existsSync(this.eventsConfigPath)) {
          const allEvents = JSON.parse(fs.readFileSync(this.eventsConfigPath, 'utf8'));
          this.gameData.events = {
            drawn: [],
            pool: allEvents
          };
        } else {
          console.error(`Events config file not found: ${this.eventsConfigPath}`);
          this.gameData.events = { drawn: [], pool: [] };
        }
      } catch (err) {
        console.error(`Error loading events config:`, err);
        this.gameData.events = { drawn: [], pool: [] };
      }
    }
  }

  /**
   * Returns an interface to modify Jakub's anger and state.
   */
  getJakubInterface() {
    const jakubRegion = this.gameData.regions.find(r => r.pawns.jakub && r.pawns.jakub.length > 0);
    if (!jakubRegion) return null;
    
    const jakub = jakubRegion.pawns.jakub[0];
    return {
      getAnger: () => ({ ...jakub.anger }),
      setAnger: (race, value) => {
        if (jakub.anger[race] !== undefined) {
          jakub.anger[race] = value;
        }
      },
      addAnger: (race, amount) => {
        if (jakub.anger[race] !== undefined) {
          jakub.anger[race] += amount;
        }
      },
      getRange: () => jakub.range,
      setRange: (value) => {
        jakub.range = value;
      }
    };
  }

  /**
   * Returns an interface to modify sets and pawn limits.
   */
  getSetsInterface() {
    if (!this.gameData.sets) return null;
    
    // Ensure limits exist
    if (!this.gameData.sets.pawnsInPlayLimit) {
      this.gameData.sets.pawnsInPlayLimit = { ...this.gameData.sets.pawns };
    }
    
    const limits = this.gameData.sets.pawnsInPlayLimit;
    return {
      getLimits: () => ({ ...limits }),
      setLimit: (race, value) => {
        if (limits[race] !== undefined) {
          limits[race] = Math.max(0, value);
        }
      }
    };
  }

  /**
   * Executes the event phase: draws an event and logs it.
   */
  executePhase() {
    this.ensureEventState();
    
    // Log start of phase
    this.addLog(`--- Start of Event Phase ---`);

    if (this.gameData.events.pool.length === 0) {
      this.addLog(`No events left in the pool.`);
      return;
    }

    // Draw a random event
    const randomIndex = Math.floor(Math.random() * this.gameData.events.pool.length);
    const event = this.gameData.events.pool.splice(randomIndex, 1)[0];
    this.gameData.events.drawn.push(event);

    // Log the drawn event
    console.log(`[EventPhase] Drawn: [${event.id}] ${event.title}`);
    this.addLog(`EVENT DRAWN: [${event.id}] ${event.title}`);
    this.addLog(`Effect: ${event.description}`);

    // Apply effects based on event type
    if (event.type === 'anger-plus' || event.type === 'anger-minus') {
      const jakub = this.getJakubInterface();
      if (jakub) {
        const effectLog = EventEffectManager.applyAngerEffect(jakub, event.type, event.value);
        this.addLog(effectLog);
      }
    } else if (event.type === 'pawnsTotal-plus' || event.type === 'pawnsTotal-minus') {
      const sets = this.getSetsInterface();
      if (sets) {
        const effectLog = EventEffectManager.applyPawnLimitEffect(sets, event.type, event.value);
        this.addLog(effectLog);
      }
    } else if (event.type === 'wipe-sectors') {
      const effectLog = EventEffectManager.applyWipeSectorsEffect(this.gameData, event.value);
      this.addLog(effectLog);
    } else if (event.type === 'support') {
      const effectLog = EventEffectManager.applySupportEffect(this.gameData, event.value);
      this.addLog(effectLog);
    }
  }

  /**
   * Adds an entry to the game history.
   */
  addLog(text) {
    if (!this.gameData.history) this.gameData.history = [];
    this.gameData.history.push({
      time: new Date().toLocaleTimeString(),
      text: text
    });
  }
}
