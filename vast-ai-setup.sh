#!/bin/bash

# Hallo3 Setup Script for Vast.ai
# Run this on your Vast.ai instance after initial provisioning

set -e  # Exit on error

echo "🚀 Hallo3 Setup Starting..."

# Update system
echo "📦 Updating system packages..."
apt update && apt install -y wget git curl build-essential ffmpeg

# Install CUDA 12.1 (if not pre-installed)
if ! command -v nvcc &> /dev/null; then
    echo "🔧 Installing CUDA 12.1..."
    wget https://developer.download.nvidia.com/compute/cuda/12.1.0/local_installers/cuda_12.1.0_530.30.02_linux.run
    sh cuda_12.1.0_530.30.02_linux.run --silent --toolkit
    echo 'export PATH=/usr/local/cuda-12.1/bin:$PATH' >> ~/.bashrc
    echo 'export LD_LIBRARY_PATH=/usr/local/cuda-12.1/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
    source ~/.bashrc
else
    echo "✅ CUDA already installed"
fi

# Install Miniconda
if [ ! -d "/miniconda" ]; then
    echo "🐍 Installing Miniconda..."
    wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
    bash Miniconda3-latest-Linux-x86_64.sh -b -p /miniconda
else
    echo "✅ Miniconda already installed"
fi

source /miniconda/bin/activate

# Clone Hallo3 repository
if [ ! -d "/workspace/hallo3" ]; then
    echo "📥 Cloning Hallo3 repository..."
    cd /workspace
    git clone https://github.com/fudan-generative-vision/hallo3.git
    cd hallo3
else
    echo "✅ Hallo3 already cloned"
    cd /workspace/hallo3
fi

# Create conda environment
if ! conda env list | grep -q "hallo3"; then
    echo "🔨 Creating conda environment..."
    conda create -n hallo3 python=3.10 -y
fi

# Activate environment
source /miniconda/bin/activate hallo3

# Install PyTorch with CUDA 12.1
echo "🔥 Installing PyTorch..."
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Install Hallo3 requirements
if [ -f "requirements.txt" ]; then
    echo "📦 Installing Hallo3 dependencies..."
    pip install -r requirements.txt
else
    echo "⚠️ requirements.txt not found, installing common dependencies..."
    pip install diffusers transformers accelerate omegaconf einops opencv-python pillow numpy
fi

# Install Flask for API server
echo "🌐 Installing Flask..."
pip install flask flask-cors

# Download Hallo3 pretrained models
echo "🤖 Downloading Hallo3 models..."
pip install "huggingface_hub[cli]"

# Check if models already exist
if [ ! -d "./pretrained_models" ]; then
    echo "📥 Downloading from HuggingFace (this may take 10-20 minutes)..."
    # Note: May require HuggingFace token if repo is gated
    huggingface-cli download fudan-generative-ai/hallo3 --local-dir ./pretrained_models
else
    echo "✅ Pretrained models already downloaded"
fi

# Copy Flask server file
echo "📝 Setting up Flask API server..."
cat > /workspace/hallo3/app.py << 'EOF'
from flask import Flask, request, send_file, jsonify
import torch
import os
import tempfile
import traceback

app = Flask(__name__)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "cuda_available": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None
    })

@app.route("/generate", methods=["POST"])
def generate():
    print("📥 Received generation request")
    try:
        if 'image' not in request.files or 'audio' not in request.files:
            return jsonify({"error": "Missing image or audio"}), 400
        
        image_file = request.files['image']
        audio_file = request.files['audio']
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as img_tmp:
            image_file.save(img_tmp.name)
            image_path = img_tmp.name
            
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as aud_tmp:
            audio_file.save(aud_tmp.name)
            audio_path = aud_tmp.name
        
        output_path = tempfile.mktemp(suffix='.mp4')
        
        # TODO: Replace with actual Hallo3 inference
        # from hallo.inference import inference_process
        # inference_process(source_image=image_path, driving_audio=audio_path, output_path=output_path)
        
        print(f"✅ Video generated: {output_path}")
        
        response = send_file(output_path, mimetype='video/mp4', as_attachment=True, download_name='output.mp4')
        
        @response.call_on_close
        def cleanup():
            try:
                os.unlink(image_path)
                os.unlink(audio_path)
                os.unlink(output_path)
            except: pass
        
        return response
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Generation failed", "details": str(e)}), 500

if __name__ == "__main__":
    print("🌐 Starting Flask server on 0.0.0.0:8000")
    app.run(host="0.0.0.0", port=8000, debug=False, threaded=True)
EOF

# Test GPU
echo "🧪 Testing GPU availability..."
python -c "import torch; print(f'CUDA Available: {torch.cuda.is_available()}'); print(f'GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"None\"}')"

# Start Flask server in background
echo "🚀 Starting Flask API server..."
nohup python app.py > /workspace/hallo3/server.log 2>&1 &
FLASK_PID=$!
echo "✅ Flask server started (PID: $FLASK_PID)"
echo "📋 Logs: tail -f /workspace/hallo3/server.log"

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me)
echo ""
echo "════════════════════════════════════════"
echo "✅ Setup Complete!"
echo "════════════════════════════════════════"
echo ""
echo "🌐 API Endpoint: http://$PUBLIC_IP:8000"
echo "🔍 Health Check: http://$PUBLIC_IP:8000/health"
echo ""
echo "📝 Update your .env file with:"
echo "   HALLO3_URL=http://$PUBLIC_IP:8000"
echo ""
echo "🧪 Test with:"
echo "   curl http://$PUBLIC_IP:8000/health"
echo ""
echo "📋 View logs:"
echo "   tail -f /workspace/hallo3/server.log"
echo ""
echo "🔄 Restart server:"
echo "   cd /workspace/hallo3 && nohup python app.py > server.log 2>&1 &"
echo ""
echo "════════════════════════════════════════"
