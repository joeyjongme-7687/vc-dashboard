const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: 'c:/Users/wanyee.jong/OneDrive - IHH Healthcare/Desktop/VC-dashboard/.env' });

async function list() {
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY);
  try {
    const models = await genAI.listModels();
    console.log(JSON.stringify(models.models, null, 2));
  } catch (e) {
    console.error(e);
  }
}

list();
