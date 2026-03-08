# Sales Intelligence Dashboard

A modern sales dashboard with AI-powered insights using Gemini and flexible data sourcing (CSV or Supabase).

## 🚀 Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    *By default, the app reads from `data/sales_data.csv`.*

---

## 🗄️ Connecting to Supabase (Optional)

If you're ready to move from a static CSV to a live database, follow these simple steps:

1.  **Create a Supabase Project**:
    Go to [Supabase.com](https://supabase.com) and create a new project.

2.  **Create the Database Table**:
    In the **SQL Editor**, paste and run this command to create your `sales_data` table:

    ```sql
    create table sales_data (
      id bigint primary key generated always as identity,
      date date not null,
      product text not null,
      channel text not null,
      orders integer,
      revenue decimal(12,2),
      cost decimal(12,2),
      visitors integer,
      customers integer,
      created_at timestamp with time zone default now()
    );
    ```

3.  **Import Your Data**:
    Go to the **Table Editor**, select your new `sales_data` table, and click **Insert -> Import Data from CSV**. Upload your `data/sales_data.csv` file.

4.  **Get Your API Credentials**:
    Go to **Project Settings -> API** and copy your **Project URL** and **service_role** or **anon** key.

5.  **Configure Your Local App**:
    Open your `.env` file and update these 3 lines:
    ```env
    DATA_SOURCE=supabase
    SUPABASE_URL=your_project_url
    SUPABASE_ANON_KEY=your_anon_key
    ```

6.  **Restart Server**:
    Restart your development environment. The terminal will log `✅ DATA_SOURCE: Supabase Database` to confirm you are live!

---

## 🧠 AI Intelligence

The dashboard uses **Gemini 3.1 Flash Lite** to generate strategic business insights. Ensure your `VITE_GEMINI_API_KEY` is active in the `.env` file.
