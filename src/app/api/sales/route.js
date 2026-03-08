import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export async function GET() {
  const dataSource = process.env.DATA_SOURCE || 'csv';
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  let data = null;

  // 1. Try Supabase Layer
  if (dataSource === 'supabase' && supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: dbData, error } = await supabase
        .from('sales_data')
        .select('*')
        .order('date', { ascending: true });

      if (!error && dbData) {
        data = dbData;
      }
    } catch (err) {
      console.error('Supabase Error:', err);
    }
  }

  // 2. Fallback to CSV
  if (!data) {
    try {
      const csvFilePath = path.join(process.cwd(), 'data', 'sales_data.csv');
      const csvData = fs.readFileSync(csvFilePath, 'utf8');
      const results = Papa.parse(csvData, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });
      data = results.data;
    } catch (err) {
      return NextResponse.json({ error: 'Data fetch failed' }, { status: 500 });
    }
  }

  return NextResponse.json(data);
}
