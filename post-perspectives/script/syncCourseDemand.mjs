import dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const auth = Buffer.from(
  `${process.env.ONET_PROJECT_NAME}:${process.env.ONET_API_KEY}`
).toString("base64");

async function syncCourseDemand() {
  const res = await fetch(
    "https://services.onetcenter.org/ws/online/occupations?bright_outlook=true&start=1&end=20",
    {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    console.error("O*NET request failed:", res.status, await res.text());
    return;
  }

  const json = await res.json();

  const rows = json.occupation.map((occ, index) => ({
    course_name: occ.title,
    demand_count: 20 - index,
  }));

  await supabase.from("course_demand").delete().neq("id", 0);
  const { error } = await supabase.from("course_demand").upsert(rows);

  if (error) console.error("Insert failed:", error);
  else console.log(`Synced ${rows.length} in-demand courses/careers from O*NET`);
}

syncCourseDemand().catch((e) => console.error("Script crashed:", e));