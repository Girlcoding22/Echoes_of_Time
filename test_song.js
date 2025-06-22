#!/usr/bin/env node

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Simple test script for song generation
 */

import { generateSong, testWithoutAuth } from './song/song_generation.js';

console.log('🎵 Testing Song Generation...\n');

// Test the function structure first
console.log('1. Testing function structure...');
testWithoutAuth();
console.log('✅ Function structure is working!\n');

// Check if we have authentication set up
const hasAccessToken = process.env.GOOGLE_CLOUD_ACCESS_TOKEN;
const hasProjectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

if (!hasAccessToken || !hasProjectId) {
    console.log('⚠️  Authentication not set up for API testing.\n');
    console.log('📋 To set up authentication:');
    console.log('   1. Get your Google Cloud access token');
    console.log('   2. Set environment variables:');
    console.log('      export GOOGLE_CLOUD_ACCESS_TOKEN="your-token"');
    console.log('      export GOOGLE_CLOUD_PROJECT_ID="your-project-id"');
    console.log('   3. Run this test again\n');
    process.exit(0);
}

// If authentication is available, test the API
console.log('2. Testing song generation API...');
console.log('🔑 Authentication detected!');

async function testAPI() {
    try {
        console.log('🎵 Generating a test song...');
        
        const result = await generateSong(
            "A peaceful acoustic guitar melody with soft vocals",
            "loud, electronic, distorted",
            null,
            process.env.GOOGLE_CLOUD_PROJECT_ID,
            "us-central1"
        );
        
        console.log('✅ Song generation successful!');
        console.log('📊 Response:', JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
    }
}

testAPI(); 