import dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Field name → Wikidata QID នៃរង្វាន់ដ៏ល្បី (ក្រុមតូច → query លឿន គ្មាន timeout)
const awards = [
  { field: "Physics", qid: "Q38104" },        // Nobel Prize in Physics
  { field: "Chemistry", qid: "Q44585" },      // Nobel Prize in Chemistry
  { field: "Medicine", qid: "Q80061" },       // Nobel Prize in Physiology or Medicine
  { field: "Economics", qid: "Q47170" },      // Nobel Memorial Prize in Economics
  { field: "Computer Science", qid: "Q185667" }, // Turing Award
  { field: "Mathematics", qid: "Q160082" },   // Fields Medal
  { field: "Literature", qid: "Q37922" },      // Nobel Prize in Literature
  { field: "Peace", qid: "Q35637" },           // Nobel Peace Prize
  { field: "Art", qid: "Q19020" },             // Turner Prize
  { field: "Biology", qid: "Q7191"}, // Nobel Prize in Physiology or Medicine (Biology)
  { field: "Engineering", qid: "Q19020"}, // Queen Elizabeth Prize for Engineering
  { field: "Astronomy", qid: "Q38104"}, // Kavli Prize in Astrophysics
  { field: "Philosophy", qid: "Q37922"}, // Berggruen Prize
  { field: "Psychology", qid: "Q80061"}, // Grawemeyer Award in Psychology
  { field: "Sociology", qid: "Q47170"}, // Holberg Prize in Social Sciences
  { field: "Political Science", qid: "Q35637"}, // Johan Skytte Prize in Political Science
  { field: "Linguistics", qid: "Q185667"}, // Linguistics Society of America Award
  { field: "Mechanical Engineering", qid: "Q19020"}, // ASME Medal
];

async function fetchByAward(award) {
  const sparql = `
SELECT ?personLabel ?universityLabel ?countryLabel WHERE {
  ?person wdt:P166 wd:${award.qid}.
  FILTER NOT EXISTS { ?person wdt:P570 ?deathDate. }
  OPTIONAL { ?person wdt:P108 ?university. }
  OPTIONAL { ?university wdt:P17 ?country. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY DESC(?person)
LIMIT 4
`;
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ModernPerspectivesDashboard/1.0 (student project)" },
  });
  if (!res.ok) {
    console.log(`  Failed for ${award.field}: ${res.status}`);
    return [];
  }
  const json = await res.json();
  return json.results.bindings.map((row) => ({
    name: row.personLabel?.value || "Unknown",
    field: award.field,
    university: row.universityLabel?.value || "N/A",
    country: row.countryLabel?.value || "N/A",
  }));
}

async function syncProfessors() {
  let allRows = [];

  for (const award of awards) {
    console.log(`Fetching ${award.field}...`);
    const rows = await fetchByAward(award);
    console.log(`  Found ${rows.length}`);
    allRows = allRows.concat(rows);
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`Fetched ${allRows.length} professors total. Inserting...`);

  await supabase.from("world_professors").delete().neq("id", 0);
  const { error } = await supabase.from("world_professors").upsert(allRows);

  if (error) console.error("Insert failed:", error);
  else console.log(`Synced ${allRows.length} professors`);
}

syncProfessors().catch((e) => console.error("Script crashed:", e));