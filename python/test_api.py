#!/usr/bin/env python3
import anthropic
import os
from dotenv import load_dotenv

load_dotenv()

def test_api():
    print("=== API Key Test ===")
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if api_key:
        api_key = api_key.strip().rstrip('%').strip()
        print(f"API Key length: {len(api_key)}")
        print(f"API Key starts with: {api_key[:20]}...")
        print(f"API Key ends with: ...{api_key[-10:]}")
    else:
        print("❌ No API key found")
        return
    
    print("\n=== Client Creation Test ===")
    try:
        client = anthropic.Anthropic(api_key=api_key)
        print("✅ Client created successfully")
    except Exception as e:
        print(f"❌ Client creation failed: {e}")
        return
    
    print("\n=== Model Test ===")
    models_to_test = [
        "claude-3-5-sonnet-20241022",
        "claude-3-5-sonnet", 
        "claude-3-sonnet",
        "claude-3-haiku"
    ]
    
    for model in models_to_test:
        print(f"\nTesting model: {model}")
        try:
            response = client.completions.create(
                model=model,
                max_tokens_to_sample=10,
                prompt="\n\nHuman: Say hello!\n\nAssistant:"
            )
            print(f"✅ SUCCESS with {model}: {response.completion}")
            return model
        except Exception as e:
            print(f"❌ FAILED with {model}: {e}")
    
    print("\n❌ All models failed")

if __name__ == "__main__":
    test_api() 