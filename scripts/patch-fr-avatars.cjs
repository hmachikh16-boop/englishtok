const fs = require('fs');
const p = 'public/content/learning-path-fr.json';
let s = fs.readFileSync(p, 'utf8');
const map = {
  '🐶': '/images/characters/character-a.jpg',
  '🦒': '/images/characters/character-b.jpg',
  '🧑': '/images/characters/character-a.jpg',
  '👩': '/images/characters/character-b.jpg',
  '👩‍🎓': '/images/characters/character-b.jpg',
  '🧑‍🎓': '/images/characters/character-a.jpg',
  '🧑‍🏫': '/images/characters/character-a.jpg',
  '👩‍💼': '/images/characters/character-b.jpg',
};
for (const [e, u] of Object.entries(map)) {
  s = s.split('"avatar": "' + e + '"').join('"avatar": "' + u + '"');
}
fs.writeFileSync(p, s);
const d = JSON.parse(s);
const set = new Set();
for (const l of d.lessons) { set.add(l.characterA?.avatar); set.add(l.characterB?.avatar); }
console.log([...set]);
