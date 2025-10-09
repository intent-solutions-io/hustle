const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: "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"
});

async function testGroq() {
  try {
    console.log("Testing Groq API...");

    const completion = await groq.chat.completions.create({
      messages: [{
        role: "user",
        content: "Say 'Groq API is working!' in exactly 5 words."
      }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
    });

    console.log("✅ Success!");
    console.log("Response:", completion.choices[0].message.content);
    console.log("Model:", completion.model);
    console.log("Tokens used:", completion.usage.total_tokens);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testGroq();
