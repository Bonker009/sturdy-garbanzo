const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Sample participant names
const participants = [
  'Alexander Hamilton',
  'Elizabeth Schuyler',
  'Aaron Burr',
  'Angelica Schuyler',
  'George Washington',
  'Marquis de Lafayette',
  'Thomas Jefferson',
  'James Madison',
  'King George III',
  'Peggy Schuyler',
  'Hercules Mulligan',
  'John Laurens',
  'Philip Hamilton',
  'Maria Reynolds',
  'Samuel Seabury',
  'Charles Lee',
  'James Reynolds',
  'Theodosia Burr',
  'George Eacker',
  'Philip Schuyler',
  'Martha Washington',
  'Dolly Madison',
  'Benjamin Franklin',
  'John Adams',
  'Abigail Adams',
  'Alexander Hamilton Jr.',
  'Angelica Hamilton',
  'James Hamilton Jr.',
  'John Church Hamilton',
  'William Hamilton',
  'Eliza Hamilton',
  'Philip Hamilton II',
  'Alexander Hamilton II',
  'James Alexander Hamilton',
  'John C. Hamilton',
  'William S. Hamilton',
  'Eliza Hamilton Holly',
  'Philip Hamilton III',
  'Angelica Hamilton Church',
  'Peggy Hamilton Van Rensselaer',
  'John Barker Church',
  'Philip Schuyler Jr.',
  'Catherine Van Rensselaer',
  'Cornelia Schuyler',
  'Margarita Schuyler Van Rensselaer',
  'Cornelia Schuyler Morton',
  'Catherine Schuyler Malcolm',
  'Elizabeth Schuyler Hamilton',
  'Angelica Schuyler Church',
  'Peggy Schuyler Van Rensselaer'
];

// Create a workbook
const workbook = XLSX.utils.book_new();

// Create worksheet data - participants in first column
const worksheetData = participants.map(name => [name]);

// Add header
worksheetData.unshift(['Participant Name']);

// Create worksheet
const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

// Set column width
worksheet['!cols'] = [{ wch: 30 }];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');

// Ensure public directory exists
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write file
const filePath = path.join(publicDir, 'sample-participants.xlsx');
XLSX.writeFile(workbook, filePath);

console.log(`✅ Sample participants file generated at: ${filePath}`);
console.log(`📊 Total participants: ${participants.length}`);

