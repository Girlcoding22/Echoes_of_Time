#!/usr/bin/env node

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

import { generateSong } from './song_generation.js';

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
        // Test 1: Basic song generation
        console.log('Test 1: Basic song generation');
        console.log('Prompt: "A peaceful acoustic guitar melody with soft vocals"');
        
        const result1 = await generateSong(
            "A peaceful acoustic guitar melody with soft vocals",
            "loud, electronic, distorted"
        );
        
        console.log('✅ Test 1 completed successfully!');
        console.log('📊 Response structure:', Object.keys(result1));
        
        if (result1.predictions && result1.predictions[0]) {
            console.log('🎶 Audio data received!');
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
    } catch (error) {
        console.error('❌ Test 1 failed:', error.message);
        console.log('\n' + '='.repeat(50) + '\n');
    }
    
    try {
        // Test 2: Song with seed for reproducibility
        console.log('Test 2: Song generation with seed');
        console.log('Prompt: "An energetic rock song with electric guitar and drums"');
        
        const result2 = await generateSong(
            "An energetic rock song with electric guitar and drums",
            "slow, acoustic, classical",
            12345
        );
        
        console.log('✅ Test 2 completed successfully!');
        console.log('📊 Response structure:', Object.keys(result2));
        
        if (result2.predictions && result2.predictions[0]) {
            console.log('🎶 Audio data received!');
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
    } catch (error) {
        console.error('❌ Test 2 failed:', error.message);
        console.log('\n' + '='.repeat(50) + '\n');
    }
    
    try {
        // Test 3: Custom project ID
        console.log('Test 3: Custom project ID parameter');
        console.log('Prompt: "A jazz piano solo with smooth saxophone"');
        
        const result3 = await generateSong(
            "A jazz piano solo with smooth saxophone",
            "heavy metal, electronic",
            null,
            process.env.GOOGLE_CLOUD_PROJECT_ID,
            "us-central1"
        );
        
        console.log('✅ Test 3 completed successfully!');
        console.log('📊 Response structure:', Object.keys(result3));
        
        if (result3.predictions && result3.predictions[0]) {
            console.log('🎶 Audio data received!');
        }
        
    } catch (error) {
        console.error('❌ Test 3 failed:', error.message);
    }
}

// Run the tests
console.log('🚀 Starting Song Generation Tests...\n');
runTests()
    .then(() => {
        console.log('\n🎉 All tests completed!');
    })
    .catch((error) => {
        console.error('\n💥 Test suite failed:', error);
    }); 