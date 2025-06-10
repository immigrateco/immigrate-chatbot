// pages/api/check-eligibility.js
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST supported" });
    }
    const { job } = req.body;

    // Supabase Query
    const supabaseUrl = "https://aivqfbuaagtwpspbwmec.supabase.co";
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    if (!supabaseKey) throw new Error("Missing Supabase key");
    const supaRes = await fetch(
      `${supabaseUrl}/rest/v1/uk_eligibility?or=(job_type.ilike.*${encodeURIComponent(job)}*,related_job_titles.ilike.*${encodeURIComponent(job)}*)&select=eligible_for_skilled_worker`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    const data = await supaRes.json();
    let eligibility;
    if (data.length > 0 && data[0].eligible_for_skilled_worker?.toLowerCase() === "yes") {
      eligibility = "Yes";
    } else if (data.length > 0 && data[0].eligible_for_skilled_worker?.toLowerCase() === "no") {
      eligibility = "No";
    } else {
      eligibility = "Not found";
    }

    // OpenAI Prompt
    const systemPrompt = `
You are an expert UK immigration advisor bot. 
The user is interested in immigrating as a "${job}".
According to the UK Skilled Worker eligibility table, eligible_for_skilled_worker = "${eligibility}" for this job title.
If eligibility is "Yes", say "You are eligible for the UK Skilled Worker visa."
If "No", say "Your job is not eligible for the UK Skilled Worker visa."
If "Not found", say "Sorry, your occupation was not found in the eligibility table."
Do not explain or add extra advice.
    `.trim();

    // OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) throw new Error("Missing OpenAI key");
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Can I immigrate as a "${job}"?` }
        ],
        temperature: 0
      })
    });
    const gptJson = await openaiRes.json();
    const reply = gptJson.choices?.[0]?.message?.content ?? "Error from GPT";

    return res.status(200).json({ reply });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ reply: `Server error: ${error.message}` });
  }
}
