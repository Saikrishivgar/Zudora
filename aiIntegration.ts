// AI Integration Service for Zudora
// This file contains integration points for various AI services

export interface AIConfig {
  openaiApiKey?: string;
  elevenLabsApiKey?: string;
  vapiApiKey?: string;
  awsAccessKey?: string;
  awsSecretKey?: string;
  awsRegion?: string;
}

export interface VoiceSettings {
  voiceId: string;
  model: string;
  stability: number;
  similarityBoost: number;
}

export class ZudoraAIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  // OpenAI GPT Integration for Natural Language Understanding
  async processWithOpenAI(message: string): Promise<string> {
    if (!this.config.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            {
              role: 'system',
              content: `You are Zudora, an AI assistant specialized in Tamil Nadu Engineering Admissions (TNEA) college counseling. 
              Help students find suitable engineering colleges based on their cutoff marks and category (OC, BC, BCM, MBC, SC, SCA, ST).
              Be friendly, helpful, and provide accurate information about college admissions.`
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I could not process your request.';
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to process with OpenAI');
    }
  }

  // Eleven Labs Text-to-Speech Integration
  async synthesizeSpeech(text: string, voiceSettings: VoiceSettings): Promise<ArrayBuffer> {
    if (!this.config.elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceSettings.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.config.elevenLabsApiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: voiceSettings.model,
          voice_settings: {
            stability: voiceSettings.stability,
            similarity_boost: voiceSettings.similarityBoost,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to synthesize speech');
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('ElevenLabs API Error:', error);
      throw new Error('Failed to synthesize speech');
    }
  }

  // Vapi Voice AI Integration for Real-time Conversations
  async initializeVapiSession(assistantId: string): Promise<string> {
    if (!this.config.vapiApiKey) {
      throw new Error('Vapi API key not configured');
    }

    try {
      const response = await fetch('https://api.vapi.ai/call', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.vapiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId: assistantId,
          customer: {
            number: '+1234567890', // Placeholder
          },
        }),
      });

      const data = await response.json();
      return data.id || '';
    } catch (error) {
      console.error('Vapi API Error:', error);
      throw new Error('Failed to initialize Vapi session');
    }
  }

  // AWS Lambda Function for Advanced Processing
  async processWithAWS(payload: any): Promise<any> {
    if (!this.config.awsAccessKey || !this.config.awsSecretKey) {
      throw new Error('AWS credentials not configured');
    }

    // In a real implementation, you would use AWS SDK
    // This is a placeholder for the AWS integration architecture
    console.log('AWS Lambda processing would be implemented here');
    
    return {
      status: 'success',
      message: 'AWS processing completed',
      data: payload,
    };
  }

  // Voice Recognition using Browser API
  async startVoiceRecognition(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      recognition.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      recognition.start();
    });
  }
}

// Default voice settings for ElevenLabs
export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  voiceId: '9BWtsMINqrJLrRacOk9x', // Aria voice
  model: 'eleven_multilingual_v2',
  stability: 0.5,
  similarityBoost: 0.8,
};

// Export factory function for easy service creation
export const createZudoraAI = (config: AIConfig): ZudoraAIService => {
  return new ZudoraAIService(config);
};

// Integration setup instructions for backend (Python)
export const BACKEND_INTEGRATION_GUIDE = `
# Python Backend Integration Guide for Zudora

## 1. FastAPI Backend Setup

\`\`\`python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import openai
import requests
import boto3
from typing import List, Optional

app = FastAPI(title="Zudora AI Backend")

class CollegeQuery(BaseModel):
    marks: float
    category: str
    user_message: str

class CollegeResponse(BaseModel):
    colleges: List[dict]
    ai_response: str
    
@app.post("/api/suggest-colleges")
async def suggest_colleges(query: CollegeQuery):
    # Process with OpenAI
    openai_response = await process_with_openai(query.user_message)
    
    # Find colleges from database
    colleges = find_colleges_by_criteria(query.marks, query.category)
    
    # Generate voice response with ElevenLabs
    audio_url = await generate_voice_response(openai_response)
    
    return CollegeResponse(
        colleges=colleges,
        ai_response=openai_response,
        audio_url=audio_url
    )
\`\`\`

## 2. AWS Lambda Function

\`\`\`python
import json
import boto3
from botocore.exceptions import ClientError

def lambda_handler(event, context):
    # Process college recommendation logic
    marks = event.get('marks')
    category = event.get('category')
    
    # Connect to DynamoDB for college data
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('tnea_colleges')
    
    # Query colleges based on criteria
    response = table.scan(
        FilterExpression=Attr('cutoff').lte(marks)
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'suggestions': response['Items'][:10]
        })
    }
\`\`\`

## 3. Environment Variables Required

- OPENAI_API_KEY
- ELEVENLABS_API_KEY  
- VAPI_API_KEY
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION

## 4. Recommended AWS Services

- AWS Lambda: Serverless college recommendation logic
- Amazon DynamoDB: Store college and cutoff data
- Amazon S3: Store generated audio files
- Amazon API Gateway: RESTful API endpoints
- Amazon Cognito: User authentication (if needed)
`;