// src/hooks/useSupabaseTable.js
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export function useSupabaseTable(tableName) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase.from(tableName).select("*");
      if (error) {
        setError(error.message);
      } else {
        setData(data);
      }
      setLoading(false);
    }
    fetchData();
  }, [tableName]);

  return { data, loading, error };
}