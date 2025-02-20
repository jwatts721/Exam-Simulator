// Read in a JSON file, modify it, and write it back out
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'live-exam-questions.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Iterate through data.questions and ad a new incrementing "id" field to each object.
let id = 1;
data.questions.forEach((question) => {
  question.id = id++;
});

let newfileName = 'live-exam-questions-with-ids.json';
fs.writeFileSync(path.join(__dirname, newfileName), JSON.stringify(data, null, 2));
console.log(`Wrote ${newfileName}`);
console.log(`Added id field to ${data.questions.length} questions`);
console.log('Done!');


