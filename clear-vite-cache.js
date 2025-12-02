#!/usr/bin/env node

/**
 * Script to clear Vite cache
 * Run with: node clear-vite-cache.js
 */

const fs = require('fs');
const path = require('path');

const directoriesToRemove = [
  path.join(__dirname, '.vite'),
  path.join(__dirname, 'node_modules', '.vite'),
  path.join(__dirname, 'dist'),
];

console.log('Clearing Vite cache...\n');

directoriesToRemove.forEach((dir) => {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`✅ Removed: ${dir}`);
    } catch (error) {
      console.error(`❌ Error removing ${dir}:`, error.message);
    }
  } else {
    console.log(`ℹ️  Not found: ${dir}`);
  }
});

console.log('\n✅ Vite cache cleared! Please restart your dev server.');

