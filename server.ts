import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON bodies with higher limits for base64 images
app.use(express.json({ limit: "10mb" }));

// Initialize Gemini API client
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiApiKey && geminiApiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({ apiKey: geminiApiKey });
    console.log("Gemini AI Client successfully initialized.");
  } catch (error) {
    console.error("Failed to initialize Gemini AI client:", error);
  }
} else {
  console.warn("GEMINI_API_KEY not configured or has default value. Falling back to Simulated AI Pipeline.");
}

// Helper to parse base64 image data for Gemini Vision SDK
function parseBase64Image(dataUrl: string) {
  let mimeType = "image/jpeg";
  let base64Data = dataUrl;
  
  if (dataUrl.startsWith("data:")) {
    const parts = dataUrl.split(";base64,");
    mimeType = parts[0].replace("data:", "");
    base64Data = parts[1];
  }
  
  return { mimeType, base64Data };
}

// API ENDPOINTS

// 1. Image analysis via Gemini Flash Vision API
app.post("/api/ai/analyze-image", async (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: "Missing image data" });
  }

  // Fallback: If AI is not initialized, simulate analysis based on image presence or random selection
  if (!ai) {
    // Generate realistic simulated response
    const mockResponses = [
      {
        category: "Pothole",
        severity: "High",
        title: "Deep Pothole on Narrow Gali",
        description: "A deep pothole has appeared near the main junction. Soil erosion underneath is causing the pavement to sink.",
        confidence: 91,
        suggestedDept: "KMC Road Engineering Wing"
      },
      {
        category: "Water Leakage",
        severity: "Medium",
        title: "Water Overflowing from Road Gland",
        description: "A municipal water supply connection is continuously leaking clean drinking water onto the street.",
        confidence: 88,
        suggestedDept: "KMC Water Supply Board"
      },
      {
        category: "Streetlight",
        severity: "Low",
        title: "Damaged Pole and Missing Streetlight",
        description: "The overhead sodium bulb fixture on Pole #12 is shattered, leaving the pedestrian path dark.",
        confidence: 94,
        suggestedDept: "KMC Electrical Maintenance"
      },
      {
        category: "Waste",
        severity: "High",
        title: "Uncontrolled Garbage Dumping at Corner",
        description: "Local households and vendors are dumping dry and wet waste directly on the street corner.",
        confidence: 92,
        suggestedDept: "Solid Waste Management Division"
      }
    ];

    // Pick a mock response randomly
    const select = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    return res.json(select);
  }

  try {
    const { mimeType, base64Data } = parseBase64Image(image);
    const prompt = `Analyze this image of a civic/infrastructure issue in an Indian city. Return JSON ONLY in this exact schema. Do NOT wrap in markdown formatting:
{
  "category": "one of [Pothole, Water Leakage, Streetlight, Waste, Encroachment, Other]",
  "severity": "one of [Low, Medium, High, Critical]",
  "title": "short descriptive title",
  "description": "2-3 sentence description of the issue",
  "confidence": 95,
  "suggestedDept": "relevant municipal department name"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Data
          }
        },
        prompt
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "";
    const parsed = JSON.parse(text.trim());
    return res.json(parsed);
  } catch (error: any) {
    console.error("Gemini Vision analysis failed:", error);
    return res.status(500).json({ error: "Failed to analyze image with AI: " + error.message });
  }
});

// 2. Complaint Letter Generation
app.post("/api/ai/complaint-letter", async (req, res) => {
  const { title, description, category, severity, address, suggestedDept } = req.body;
  
  if (!ai) {
    // Return realistic complaint letter fallback
    const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const mockLetter = `Date: ${date}

To,
The Executive Engineer / Ward Officer,
${suggestedDept || "Municipal Corporation Department"},
Kolhapur, Maharashtra.

Subject: Formal complaint regarding severe ${category || "civic"} issue at ${address || "our locality"}

Respected Sir/Madam,

I am writing to draw your urgent attention to a serious civic problem in our area: "${title || "Local Infrastructure Issue"}". 
Location details: ${address || "Kolhapur"}

Description:
${description || "The infrastructure is broken and is causing daily problems for residents."}

This is a ${severity || "High"} severity issue. It presents a clear safety risk and inconvenience to hundreds of citizens passing by daily. Pedestrians and vehicles are forced into risky maneuvers to avoid the spot.

We request you to kindly send an inspection crew and initiate repairs on an emergency basis to prevent any further worsening or accidents.

Thank you.

Yours sincerely,
Concerned Local Citizen`;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    return res.json({ letter: mockLetter });
  }

  try {
    const prompt = `Generate a formal complaint letter from an Indian citizen to the [${suggestedDept}] regarding a [${category}] issue at [${address}]. The title is "${title}" and description is "${description}". Use a professional, humble, yet firm tone as a plain text letter. Include date, subject, salutation, details, urgency level based on "${severity}" severity, and a sign-off. Do not include markdown headers, just return plain text letter format.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });

    return res.json({ letter: response.text });
  } catch (error: any) {
    console.error("Gemini letter generation failed:", error);
    return res.status(500).json({ error: "Failed to generate complaint letter: " + error.message });
  }
});

// 3. Resolution Timeline Prediction
app.post("/api/ai/predict-timeline", async (req, res) => {
  const { category, severity } = req.body;

  if (!ai) {
    const baseDays: Record<string, number> = {
      Pothole: 5,
      "Water Leakage": 3,
      Streetlight: 3,
      Waste: 2,
      Encroachment: 7,
      Other: 6
    };

    const multiplier: Record<string, number> = {
      Low: 0.5,
      Medium: 1.0,
      High: 1.5,
      Critical: 0.8 // Critical often fixed faster due to emergencies
    };

    const days = Math.max(1, Math.round((baseDays[category] || 5) * (multiplier[severity] || 1.0)));
    const confidence = severity === "Critical" ? 92 : 85;
    const reasoning = `Estimated based on historical average of ${category} resolutions. ${severity} priority triggers emergency crew prioritization.`;

    await new Promise(resolve => setTimeout(resolve, 800));
    return res.json({ estimatedDays: days, confidence, reasoning });
  }

  try {
    const prompt = `Predict resolution timeline in days for a "${severity}" severity "${category}" civic issue in an Indian municipal setup. Consider the urgency of "${severity}". Return JSON only:
{
  "estimatedDays": number,
  "confidence": percentage (0-100),
  "reasoning": "short 1-sentence explanation of why this timeline is predicted"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return res.json(parsed);
  } catch (error: any) {
    console.error("Gemini timeline prediction failed:", error);
    return res.status(500).json({ error: "Failed to predict timeline: " + error.message });
  }
});

// 4. Department Assignment & Priority Scoring
app.post("/api/ai/priority-scoring", async (req, res) => {
  const { category, severity, upvoteCount } = req.body;

  if (!ai) {
    const severityPoints: Record<string, number> = {
      Low: 15,
      Medium: 40,
      High: 70,
      Critical: 90
    };

    const votesWeight = Math.min(10, upvoteCount || 0) * 1.5;
    const score = Math.min(100, Math.round((severityPoints[severity] || 40) + votesWeight));
    
    const depts: Record<string, string> = {
      Pothole: "KMC Road Works Department",
      "Water Leakage": "Water Supply & Sewage Wing",
      Streetlight: "KMC Electrical Maintenance Wing",
      Waste: "Solid Waste Management Division",
      Encroachment: "Anti-Encroachment Special Cell",
      Other: "KMC General Grievance Cell"
    };

    const dept = depts[category] || "Municipal Health & Engineering Wing";
    const escalation = score > 80;

    await new Promise(resolve => setTimeout(resolve, 600));
    return res.json({ priorityScore: score, department: dept, escalationNeeded: escalation });
  }

  try {
    const prompt = `Given a "${severity}" severity "${category}" issue with ${upvoteCount || 0} community upvotes, assign an overall priority score from 1 to 100 (where 100 is life-threatening emergency) and define the exact municipal department responsible. Return JSON only:
{
  "priorityScore": number,
  "department": "string department name",
  "escalationNeeded": boolean
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return res.json(parsed);
  } catch (error: any) {
    console.error("Gemini priority scoring failed:", error);
    return res.status(500).json({ error: "Failed to score priority: " + error.message });
  }
});

// 5. AI Predictive Insights for Municipal Dashboard
app.post("/api/ai/predictive-insights", async (req, res) => {
  const { stats } = req.body;

  if (!ai) {
    // Fallback: Highly analytical simulated insights for Indian municipal setup
    const mockInsights = {
      insights: [
        {
          title: "Monsoon Pothole Spike Expected",
          description: "Water logging trends around Shivaji Road indicate localized road surface stripping. An estimated 250% increase in potholes is projected for Ward 12 if preventative sealing is delayed.",
          recommendation: "Seal road joints at Rajarampuri Entrance junction within 48 hours",
          urgency: "High"
        },
        {
          title: "Water Loss Anomaly detected",
          description: "Frequent leak reports in Ward 8 (Mangalwar Peth) are causing a cumulative pressure drop in down-line storage, costing 45,000 liters of treated water daily.",
          recommendation: "Audit underground pipe joint sealing near Khasbag Maidan",
          urgency: "Medium"
        },
        {
          title: "Waste Dumping Hotspot around Lake Buffer",
          description: "Civic reports of unattended garbage at Rankala Lake Circular Road have increased by 40% this week. Animals are dragging debris into tourist walkways.",
          recommendation: "Increase garbage dumper lift frequency to twice daily in Ward 2",
          urgency: "High"
        }
      ]
    };

    await new Promise(resolve => setTimeout(resolve, 2000));
    return res.json(mockInsights);
  }

  try {
    const prompt = `You are an expert civic data analyst. Based on these community issue statistics: ${JSON.stringify(stats)}, provide 3 highly actionable, specific, and predictive insights and recommendations for city administrators of Kolhapur. Think about hotspots, trends, resource allocation, and preventative steps. Return JSON only:
{
  "insights": [
    {
      "title": "short title of trend or hotspot",
      "description": "deep analytical explanation of the trend/threat",
      "recommendation": "specific, concrete recommendation for municipal crews",
      "urgency": "High" | "Medium" | "Low"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return res.json(parsed);
  } catch (error: any) {
    console.error("Gemini predictive insights failed:", error);
    return res.status(500).json({ error: "Failed to generate AI insights: " + error.message });
  }
});

// SERVER AND VITE MIDDLEWARE SETUP
async function startServer() {
  // Vite dev middleware or Production static files serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CivicPulse Backend active on http://localhost:${PORT}`);
  });
}

startServer();
