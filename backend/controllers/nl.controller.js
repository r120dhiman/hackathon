const client = require("../helper/openAI.helper");
const mongoose = require("mongoose");

const naturalLanguageQuery = async (req, res) => {
  const { command, collection } = req.body;

  try {
    // Send to OpenAI
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",  // or latest available
      messages: [
        {
          role: "system",
          content: "You are a MongoDB aggregation pipeline generator. Always return valid JSON only."
        },
        {
          role: "user",
          content: `Collection: ${collection}\nCommand: "${command}"`
        }
      ]
    });

    // Parse pipeline
    let pipeline = JSON.parse(response.choices[0].message.content.trim());

    // Execute pipeline
    const dbCollection = mongoose.connection.collection(collection);
    const results = await dbCollection.aggregate(pipeline).toArray();

    res.json({
      pipeline,
      results
    });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Failed to process query" });
  }
};

module.exports = { naturalLanguageQuery };