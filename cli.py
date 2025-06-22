#!/usr/bin/env python3
"""
Command-line interface for Video to Text Converter
"""

import argparse
import os
import sys
from video_processor import VideoProcessor
from llama_integration import LlamaVideoDescriber
from dotenv import load_dotenv

load_dotenv()

def main():
    parser = argparse.ArgumentParser(
        description="Convert video to text description using AI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python cli.py video.mp4
  python cli.py video.mp4 --output description.txt
  python cli.py video.mp4 --frames 15 --interval 2.0
        """
    )
    
    parser.add_argument(
        'video_path',
        help='Path to the video file to process'
    )
    
    parser.add_argument(
        '--output', '-o',
        help='Output file path for the description (default: print to console)'
    )
    
    parser.add_argument(
        '--frames', '-f',
        type=int,
        default=30,
        help='Maximum number of frames to process (default: 30)'
    )
    
    parser.add_argument(
        '--interval', '-i',
        type=float,
        default=1.0,
        help='Interval between frames in seconds (default: 1.0)'
    )
    
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose output'
    )
    
    args = parser.parse_args()
    
    # Check if video file exists
    if not os.path.exists(args.video_path):
        print(f"Error: Video file '{args.video_path}' not found.")
        sys.exit(1)
    
    # Check if API key is set
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("Error: ANTHROPIC_API_KEY environment variable not set.")
        print("Please set it in your .env file or environment.")
        sys.exit(1)
    
    try:
        print("🎥 Video to Text Converter")
        print("=" * 40)
        
        if args.verbose:
            print(f"Processing: {args.video_path}")
            print(f"Max frames: {args.frames}")
            print(f"Frame interval: {args.interval}s")
        
        # Initialize processors
        print("Loading AI models...")
        video_processor = VideoProcessor()
        claude_describer = LlamaVideoDescriber()
        
        if not video_processor.model:
            print("Error: Failed to load BLIP-2 model.")
            sys.exit(1)
        
        print("✅ Models loaded successfully")
        
        # Process video
        print("Processing video frames...")
        frame_data = video_processor.extract_frames_and_describe(
            args.video_path,
            frame_interval=args.interval,
            max_frames=args.frames
        )
        
        if not frame_data:
            print("Error: No frames were extracted from the video.")
            sys.exit(1)
        
        print(f"✅ Extracted {len(frame_data)} frames")
        
        # Generate description
        print("Generating final description with Claude...")
        description = claude_describer.generate_video_description(frame_data)
        
        if not description:
            print("Error: Failed to generate description.")
            sys.exit(1)
        
        print("✅ Description generated successfully")
        print("\n" + "=" * 40)
        print("📝 VIDEO DESCRIPTION")
        print("=" * 40)
        
        # Output result
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(description)
            print(f"Description saved to: {args.output}")
        else:
            print(description)
        
        print("\n" + "=" * 40)
        print("✅ Processing complete!")
        
    except KeyboardInterrupt:
        print("\n❌ Processing interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main() 