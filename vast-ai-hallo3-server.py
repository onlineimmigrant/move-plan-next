"""
Hallo3 Flask API Server for Vast.ai
Place this file in /workspace/hallo3/ on your Vast.ai instance
"""

from flask import Flask, request, send_file, jsonify
import torch
import os
import tempfile
import traceback
from pathlib import Path

# Import Hallo3 inference function (adjust based on actual repo structure)
# from inference import run_inference  # Uncomment when Hallo3 is properly set up

app = Flask(__name__)

# Configuration
MODEL_PATH = "./pretrained_models"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

print(f"🚀 Hallo3 API Server Starting...")
print(f"📍 Device: {DEVICE}")
print(f"📦 Model Path: {MODEL_PATH}")

# Health check endpoint
@app.route("/health", methods=["GET"])
def health():
    """Check if server is running and GPU is available"""
    return jsonify({
        "status": "healthy",
        "device": DEVICE,
        "cuda_available": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "gpu_memory": f"{torch.cuda.get_device_properties(0).total_memory / 1e9:.2f}GB" if torch.cuda.is_available() else None
    })

@app.route("/generate", methods=["POST"])
def generate():
    """
    Generate talking head video from image + audio
    
    Expects:
    - image: File (JPEG/PNG)
    - audio: File (MP3/WAV)
    
    Returns:
    - MP4 video file
    """
    print("📥 Received generation request")
    
    try:
        # Validate inputs
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        
        image_file = request.files['image']
        audio_file = request.files['audio']
        
        print(f"📸 Image: {image_file.filename}, Size: {len(image_file.read())} bytes")
        image_file.seek(0)  # Reset after reading
        
        print(f"🎵 Audio: {audio_file.filename}, Size: {len(audio_file.read())} bytes")
        audio_file.seek(0)
        
        # Create temporary files
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as img_tmp:
            image_file.save(img_tmp.name)
            image_path = img_tmp.name
            
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as aud_tmp:
            audio_file.save(aud_tmp.name)
            audio_path = aud_tmp.name
        
        output_path = tempfile.mktemp(suffix='.mp4')
        
        print(f"💾 Temp files created: {image_path}, {audio_path}")
        print("🎬 Starting Hallo3 inference...")
        
        # Run Hallo3 inference
        # IMPORTANT: Adjust this based on actual Hallo3 API
        # Example call (modify based on Hallo3 documentation):
        """
        from hallo.inference import inference_process
        
        inference_process(
            source_image=image_path,
            driving_audio=audio_path,
            output_path=output_path,
            pose_weight=1.0,
            face_weight=1.0,
            lip_weight=1.0,
            face_expand_ratio=1.2
        )
        """
        
        # TEMPORARY: For testing without full Hallo3 setup
        # Remove this block once Hallo3 is properly configured
        import shutil
        # Create a dummy video file for testing
        # In production, replace with actual Hallo3 inference
        print("⚠️ WARNING: Using dummy output (Hallo3 not configured)")
        with open(output_path, 'wb') as f:
            f.write(b'DUMMY_VIDEO_DATA')  # Replace with actual inference
        
        print(f"✅ Video generated: {output_path}")
        
        # Send file and cleanup
        response = send_file(
            output_path,
            mimetype='video/mp4',
            as_attachment=True,
            download_name='output.mp4'
        )
        
        # Cleanup temp files after sending
        @response.call_on_close
        def cleanup():
            try:
                os.unlink(image_path)
                os.unlink(audio_path)
                os.unlink(output_path)
                print("🧹 Cleaned up temp files")
            except Exception as e:
                print(f"⚠️ Cleanup error: {e}")
        
        return response
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "error": "Video generation failed",
            "details": str(e)
        }), 500

if __name__ == "__main__":
    print("🌐 Starting Flask server on 0.0.0.0:8000")
    print("📡 Access via: http://<your-vast-ip>:8000")
    print("🔍 Health check: http://<your-vast-ip>:8000/health")
    
    # Run with threading for better performance
    app.run(
        host="0.0.0.0",  # CRITICAL: Bind to all interfaces
        port=8000,
        debug=False,
        threaded=True
    )
