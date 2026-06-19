import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI client
const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Generates high-converting social media captions and hashtags based on a prompt and platform
 */
export async function generateCaptionAndHashtags(
  prompt: string,
  platform: "instagram" | "linkedin" | "both"
): Promise<{ caption: string; firstComment?: string; hashtags: string }> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const systemInstructions = `
    You are an expert social media manager and copywriter.
    Your task is to write a highly engaging post based on the user's prompt.
    Target Platform: ${platform === "both" ? "both Instagram and LinkedIn" : platform}.
    
    If Target Platform is Instagram:
    - Keep it visually clean, using spacing and emojis.
    - Write a short, punchy caption.
    - Place hashtags separately (usually in the "first comment" style to keep the caption clean).
    
    If Target Platform is LinkedIn:
    - Write a structured, professional yet engaging post.
    - Use line breaks and clear takeaways/hooks.
    - Keep hashtags minimal (3-5 relevant ones).
    
    Provide the output in JSON format exactly as follows:
    {
      "caption": "The main body of the post. Avoid adding hashtags here for Instagram, keep them in the hashtags field.",
      "firstComment": "Only for Instagram: A list of 10-15 highly relevant hashtags separated by spaces, or null if LinkedIn.",
      "hashtags": "A comma-separated list of the 5-10 primary hashtags to display on the post itself."
    }
    Return ONLY this JSON block. Do not wrap in markdown code blocks.
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `${systemInstructions}\n\nUser Prompt: ${prompt}` }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText.trim());

    return {
      caption: parsed.caption || "",
      firstComment: parsed.firstComment || undefined,
      hashtags: parsed.hashtags || "",
    };
  } catch (error) {
    console.error("Error generating caption from Gemini:", error);
    // Return standard fallback if JSON parsing fails or API fails
    return {
      caption: `Post prompt: ${prompt}\n\nCreated with SocialForge.`,
      hashtags: "#marketing #socialmedia",
    };
  }
}

/**
 * Generates a vertical (9:16) image using Gemini's Imagen 3 REST API
 * Returns the image as a base64 Data URI string.
 */
export async function generateVerticalImage(prompt: string): Promise<{ base64Data: string; mimeType: string }> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${apiKey}`;

  const payload = {
    prompt: prompt,
    numberOfImages: 1,
    outputMimeType: "image/jpeg",
    aspectRatio: "9:16", // 9:16 aspect ratio for vertical Reels / Stories
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Imagen API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const generatedImage = data?.generatedImages?.[0];

    if (!generatedImage || !generatedImage.image?.imageBytes) {
      throw new Error("No image data returned from Imagen 3 API");
    }

    return {
      base64Data: generatedImage.image.imageBytes,
      mimeType: "image/jpeg",
    };
  } catch (error) {
    console.error("Error generating vertical image from Imagen:", error);
    throw error;
  }
}
