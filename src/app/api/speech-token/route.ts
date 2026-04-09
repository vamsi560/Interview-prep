import { NextResponse } from 'next/server';

export async function GET() {
  const speechKey = process.env.AZURE_SPEECH_KEY;
  const speechRegion = process.env.AZURE_SPEECH_REGION || "eastus"; 

  if (!speechKey) {
    console.error("Missing AZURE_SPEECH_KEY in environment");
    return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': speechKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    if (!response.ok) {
        throw new Error(`Failed to fetch token: ${response.statusText}`);
    }
    
    const token = await response.text();
    return NextResponse.json({ token, region: speechRegion });
  } catch (error) {
    console.error("Speech Token Error:", error);
    return NextResponse.json({ error: 'Failed to fetch token' }, { status: 500 });
  }
}
