#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const API_URL = 'http://localhost:3001/api/map';

const usage = `
Usage:
  node cli.js --get              Download current board state to stdout
  node cli.js --upload <file>    Upload board state from a JSON file
  node cli.js --reset            Reset board state to empty
`;

async function run() {
  const command = args[0];

  if (command === '--get') {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Error fetching map:', err.message);
    }
  } else if (command === '--upload') {
    const filePath = args[1];
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
  } else {
    console.log(usage);
  }
}

run();
