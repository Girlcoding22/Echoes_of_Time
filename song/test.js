#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file in parent directory
dotenv.config({ path: path.join(process.cwd(), '..', '.env') });

import { generateSong, generate_song, writeMP3FromBase64 } from './song_generation.js';

console.log('🎵 Testing Song Generation...\n');

// Check if we have authentication set up
const hasAccessToken = process.env.GOOGLE_CLOUD_ACCESS_TOKEN;
const hasProjectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

if (!hasAccessToken || !hasProjectId) {
    console.log('⚠️  Authentication not set up for API testing.\n');
    console.log('📋 To set up authentication:');
    console.log('   1. Create a .env file in the project root');
    console.log('   2. Add your Google Cloud credentials:');
    console.log('      GOOGLE_CLOUD_ACCESS_TOKEN=your_access_token');
    console.log('      GOOGLE_CLOUD_PROJECT_ID=your_project_id');
    console.log('   3. Run this test again\n');
    process.exit(0);
}

console.log('🔑 Authentication detected! Running API tests...\n');

async function runTests() {
    try {
        // Test 1: Generate song and save as MP3 file
        console.log('Test 1: Generate song and save as MP3 file');
        console.log('Prompt: "A peaceful acoustic guitar melody with soft vocals"');
        
        const result1 = await generate_song(
            "A peaceful acoustic guitar melody with soft vocals",
            "peaceful-acoustic",
            "generated-songs"
        );
        
        console.log('✅ Test 1 completed successfully!');
        console.log('📊 Result:', {
            filename: result1.filename,
            mp3Path: result1.mp3Path,
            hasResponse: !!result1.response
        });
        
        console.log('\n' + '='.repeat(50) + '\n');
        
    } catch (error) {
        console.error('❌ Test 1 failed:', error.message);
        console.log('\n' + '='.repeat(50) + '\n');
    }
    
    try {
        // Test 2: Generate song with seed for reproducibility
        console.log('Test 2: Generate song with seed and save as MP3');
        console.log('Prompt: "An energetic rock song with electric guitar and drums"');
        
        const result2 = await generate_song(
            "An energetic rock song with electric guitar and drums",
            "energetic-rock",
            "generated-songs"
        );
        
        console.log('✅ Test 2 completed successfully!');
        console.log('📊 Result:', {
            filename: result2.filename,
            mp3Path: result2.mp3Path,
            hasResponse: !!result2.response
        });
        
        console.log('\n' + '='.repeat(50) + '\n');
        
    } catch (error) {
        console.error('❌ Test 2 failed:', error.message);
        console.log('\n' + '='.repeat(50) + '\n');
    }
    
    try {
        // Test 3: Test the base64 to MP3 function directly
        console.log('Test 3: Test base64 to MP3 conversion function');
        
        // Create a dummy base64 string (this won't be valid audio, just for testing the function)
        const dummyBase64 = Buffer.from('dummy audio data').toString('base64');
        
        const mp3Path = await writeMP3FromBase64(
            dummyBase64,
            "test-conversion",
            "generated-songs"
        );
        
        console.log('✅ Test 3 completed successfully!');
        console.log('📊 MP3 file created:', mp3Path);
        
    } catch (error) {
        console.error('❌ Test 3 failed:', error.message);
    }
}

// Run the tests
console.log('🚀 Starting Song Generation Tests...\n');
runTests()
    .then(() => {
        console.log('\n🎉 All tests completed!');
        console.log('📁 Check the "generated-songs" directory for your MP3 files!');
    })
    .catch((error) => {
        console.error('\n💥 Test suite failed:', error);
    }); 