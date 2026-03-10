#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const API_BASE = 'http://localhost:3001/api/map';

const usage = `
Usage:
  node cli.js --game <id> --get                           Download current board state to stdout
  node cli.js --game <id> --upload <file>                 Upload board state from a JSON file
  node cli.js --game <id> --reset                         Reset board state to empty
  node cli.js --game <id> --add <region> <pawnType>       Add pawn to specific region (0-24)
  node cli.js --game <id> --remove <region> <pawnType>    Remove pawn from specific region (0-24)

Pawn Types: vampire, werewolf, ghost, bardak
`;

async function run() {
  const gameIndex = args.indexOf('--game');
  if (gameIndex === -1 || !args[gameIndex + 1]) {
    console.log(usage);
    return;
  }
  const gameId = args[gameIndex + 1];
  const command = args[gameIndex + 2];
  const API_URL = `${API_BASE}/${gameId}`;

  if (command === '--get') {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Error fetching map:', err.message);
    }
  } else if (command === '--upload') {
    const filePath = args[gameIndex + 3];
    if (!filePath) {
      console.error('Please specify a file path to upload.');
      return;
    }
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const board = JSON.parse(fileContent);

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(board),
      });
      const result = await res.json();
      console.log(result.message || result.error);
    } catch (err) {
      console.error('Error uploading map:', err.message);
    }
  } else if (command === '--reset') {
    try {
      const res = await fetch(API_URL, { method: 'DELETE' });
      const result = await res.json();
      console.log(result.message || result.error);
    } catch (err) {
      console.error('Error resetting map:', err.message);
    }
  } else if (command === '--add') {
    const region = args[gameIndex + 3];
    const pawn = args[gameIndex + 4];
    if (region === undefined || !pawn) {
      console.error('Please specify region index and pawn type.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/add?region=${region}&pawn=${pawn}`);
      const result = await res.json();
      console.log(result.message || result.error);
    } catch (err) {
      console.error('Error adding pawn:', err.message);
    }
  } else if (command === '--remove') {
    const region = args[gameIndex + 3];
    const pawn = args[gameIndex + 4];
    if (region === undefined || !pawn) {
      console.error('Please specify region index and pawn type.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/remove?region=${region}&pawn=${pawn}`);
      const result = await res.json();
      console.log(result.message || result.error);
    } catch (err) {
      console.error('Error removing pawn:', err.message);
    }
  } else {
    console.log(usage);
  }
}

run();
