const fs = require('fs');
const { parse } = require('csv-parse');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const INITIAL_SCORE = 4.0;
const BATCH_SIZE = 100;

async function importCSV(filePath) {
  const records = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }))
      .on('data', (row) => {
        // Build tags from article, word_type, gender
        const tags = [row.article, row.word_type, row.gender]
          .map(t => t ? t.trim().toLowerCase() : '')
          .filter(t => t.length > 0);

        // Build description from plural, separable_verb, notes
        const descParts = [];
        if (row.plural) descParts.push(`plural: ${row.plural}`);
        if (row.separable_verb) descParts.push(`separable verb: ${row.separable_verb}`);
        if (row.notes) descParts.push(`notes: ${row.notes}`);
        const description = descParts.length > 0 ? descParts.join('\n') : null;

        records.push({
          question_text: row.dutch_word,
          answer: row.english,
          description: description,
          score: INITIAL_SCORE,
          tags: tags,
        });
      })
      .on('end', async () => {
        console.log(`Parsed ${records.length} records from CSV`);

        // Insert in batches
        for (let i = 0; i < records.length; i += BATCH_SIZE) {
          const batch = records.slice(i, i + BATCH_SIZE);
          console.log(`Inserting batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} records)...`);

          const { data, error } = await supabase
            .from('questions')
            .insert(batch);

          if (error) {
            console.error(`Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
            reject(error);
            return;
          }
        }

        console.log(`✓ Successfully imported ${records.length} questions`);
        resolve();
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        reject(error);
      });
  });
}

// Get CSV file path from command line
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error('Usage: node scripts/import-csv.js <path-to-csv-file>');
  console.error('');
  console.error('CSV format (first row must be headers):');
  console.error('  section,dutch_word,article,plural,word_type,gender,separable_verb,english,notes');
  console.error('');
  console.error('Mapping:');
  console.error('  question = dutch_word');
  console.error('  answer = english');
  console.error('  tags = [article, word_type, gender]');
  console.error('  description = plural + separable_verb + notes');
  process.exit(1);
}

if (!fs.existsSync(csvFilePath)) {
  console.error(`File not found: ${csvFilePath}`);
  process.exit(1);
}

importCSV(csvFilePath)
  .then(() => {
    console.log('Import complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });
