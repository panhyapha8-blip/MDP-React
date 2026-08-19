import dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Q1790510 = QS World University Rankings; filter តែ ranking ឆ្នាំ 2025 ឬ 2026 (ថ្មីបំផុត)
const sparql = `
SELECT ?uni ?uniLabel ?countryLabel ?rank ?logo WHERE {
  ?uni p:P1352 ?rankStatement.
  ?rankStatement ps:P1352 ?rank.
  ?rankStatement pq:P459 wd:Q1790510.
  ?rankStatement pq:P585 ?year.
  FILTER(YEAR(?year) >= 2025)
  OPTIONAL { ?uni wdt:P17 ?country. }
  OPTIONAL { ?uni wdt:P154 ?logo. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY ?rank
LIMIT 100
`;

async function syncSchools() {
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;

  const res = await fetch(url, {
    headers: { "User-Agent": "ModernPerspectivesDashboard/1.0 (student project)" },
  });

  if (!res.ok) {
    console.error("Wikidata request failed:", res.status, await res.text());
    return;
  }

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    console.error("Invalid JSON from Wikidata. Response length:", text.length);
    return;
  }

  // Deduplicate តាមសាកលវិទ្យាល័យ (QID) — យក rank ល្អបំផុតបើនៅសល់ record ជាន់គ្នា
  const byUni = new Map();
  for (const row of json.results.bindings) {
    const uniId = row.uni.value;
    const rank = parseInt(row.rank?.value) || Infinity;
    const existing = byUni.get(uniId);
    if (!existing || rank < existing.rank) {
      byUni.set(uniId, {
        name: row.uniLabel?.value || "Unknown",
        country: row.countryLabel?.value || "N/A",
        rank,
        image_url: row.logo?.value || null,
        students_count: null,
      });
    }
  }

  const rows = [...byUni.values()].sort((a, b) => a.rank - b.rank).slice(0, 24);

  await supabase.from("world_schools").delete().neq("id", 0);
  const { error } = await supabase.from("world_schools").upsert(rows);

  if (error) console.error(error);
  else {
    console.log(`Synced ${rows.length} unique schools`);
    console.log("Ranks:", rows.map(r => r.rank).join(", "));
  }
}

syncSchools();