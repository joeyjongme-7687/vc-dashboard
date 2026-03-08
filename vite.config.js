import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { createClient } from '@supabase/supabase-js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  // Data Layer Configuration
  const dataSource = env.DATA_SOURCE || 'csv'
  const supabaseUrl = env.SUPABASE_URL
  const supabaseKey = env.SUPABASE_ANON_KEY
  
  const useSupabase = dataSource === 'supabase' && supabaseUrl && supabaseKey && !supabaseUrl.includes('your_project_url')
  const supabase = useSupabase ? createClient(supabaseUrl, supabaseKey) : null

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'sales-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/sales') {
              let data = null

              // 1. Try Supabase Layer (Active only if DATA_SOURCE=supabase)
              if (supabase) {
                try {
                  const { data: dbData, error } = await supabase
                    .from('sales_data')
                    .select('*')
                    .order('date', { ascending: true })
                  
                  if (!error && dbData) {
                    console.log('✅ DATA_SOURCE: Supabase Database')
                    data = dbData
                  } else {
                    console.warn('⚠️ Supabase fetch failed:', error?.message)
                  }
                } catch (err) {
                  console.error('❌ Supabase connection error:', err)
                }
              }

              // 2. Fallback to CSV Layer
              if (!data) {
                const csvFilePath = path.resolve(__dirname, 'data/sales_data.csv')
                try {
                  const csvData = fs.readFileSync(csvFilePath, 'utf8')
                  const results = Papa.parse(csvData, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true
                  })
                  console.log('📄 DATA_SOURCE: Local CSV (Fallback)')
                  data = results.data
                } catch (err) {
                  res.statusCode = 500
                  return res.end(JSON.stringify({ error: 'Failed to read data from local CSV backup' }))
                }
              }

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(data))
            } else {
              next()
            }
          })
        }
      }
    ],
  }
})
