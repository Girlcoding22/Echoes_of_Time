import { generateSongDescription } from './judge-llm.js';

// Test the judge functionality
async function main() {
    console.log('🎯 Testing Judge LLM...\n');
    
    const testCases = [
      {
        audio: "A young man with dark, curly hair is casually seated on a park bench, strumming a vintage acoustic guitar. He's wearing a faded denim jacket over a simple white t-shirt, his fingers dancing across the strings. The park is bathed in soft, golden sunlight, and the scene has a relaxed, carefree vibe. A few vibrant green trees frame the image, with a blurry background suggesting a busy park with a few unseen people. This photo showcases a moment of tranquil joy. The scene is a portrayal of everyday life, with the guitar player as the central focus of the image, and a sense of peace and calm, created by the soft light and the soft colors. The camera angle is at eye level with the player, giving a sense of intimacy.",
        video: "A young man with dark brown hair and a scruffy beard plays an acoustic guitar outdoors in a sunny park. He wears a faded denim jacket and dark jeans, a casual yet comfortable look for a relaxed afternoon of music. The guitar is a well-worn but well-loved instrument, with subtle signs of wear that enhance its character and suggest it's been played often. The scene is bathed in warm, natural light, with sunlight filtering through the leaves of surrounding trees and casting a dappled pattern on the ground. The trees are lush and green, and the grass below them is a vibrant emerald. The background is softly blurred, drawing the viewer's focus to the musician and his instrument. The image is evocative of a carefree moment, with a relaxed, candid feel captured by a street photography style.",
        expected: "True"
      },
      {
        audio: "A person playing guitar in a park", 
        video: "A car driving on the highway",
        expected: "False"
      }
    ];
  
    for (const testCase of testCases) {
      try {
        console.log(`📋 Testing: "${testCase.audio}" vs "${testCase.video}"`);
        const result = await generateSongDescription(testCase.audio, testCase.video);
        console.log(`   Result: ${result}`);
        console.log(`   ${result}\n`);
      } catch (error) {
        console.error(`   ❌ ERROR: ${error.message}\n`);
      }
    }
  }
  
  main().catch(console.error);