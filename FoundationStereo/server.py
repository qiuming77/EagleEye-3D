from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import subprocess

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = './assets'
OUTPUT_FOLDER = './test_outputs'
CKPT_PATH = './pretrained_models/23-51-11/model_best_bp2-001.pth'

@app.route('/upload', methods=['POST'])
def upload():
    # 保存上传图片
    left = request.files['left']
    right = request.files['right']
    left_path = os.path.join(UPLOAD_FOLDER, 'left.png')
    right_path = os.path.join(UPLOAD_FOLDER, 'right.png')
    left.save(left_path)
    right.save(right_path)

    # 调用推理脚本
    subprocess.run([
        'python', 'scripts/run_demo.py',
        '--left_file', left_path,
        '--right_file', right_path,
        '--ckpt_dir', CKPT_PATH,
        '--out_dir', OUTPUT_FOLDER
    ], check=True)

    # 假设输出为 vis.png 和 cloud_denoise.ply/txt
    depth_url = '/outputs/vis.png'
    # 你可以根据实际输出文件名调整
    cloud_url = '/outputs/cloud_denoise.ply' if os.path.exists(os.path.join(OUTPUT_FOLDER, 'cloud_denoise.ply')) else '/outputs/cloud.txt'

    return jsonify({'depth_url': depth_url, 'cloud_url': cloud_url})

# 静态文件服务
@app.route('/outputs/<path:filename>')
def outputs(filename):
    return send_from_directory(OUTPUT_FOLDER, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)