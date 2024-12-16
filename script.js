// 等待页面加载完成
document.addEventListener('DOMContentLoaded', async () => {
    // 确保face-api.js已经加载
    if (typeof faceapi === 'undefined') {
        console.error('face-api.js 未加载');
        alert('人脸检测库未正确加载，请刷新页面重试');
        return;
    }

    console.log('页面加载完成');

    try {
        console.log('开始加载face-api.js模型...');
        await loadModels();
        console.log('模型加载完成');
        
        // 加载默认贴纸
        await loadDefaultStickers();
    } catch (error) {
        console.error('初始化失败:', error);
    }

    // 获取DOM元素
    const imageInput = document.getElementById('imageInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const stickerInput = document.getElementById('stickerInput');
    const stickerBtn = document.getElementById('stickerBtn');
    const stickerPreview = document.getElementById('stickerPreview');
    const saveBtn = document.getElementById('saveBtn');

    let selectedSticker = null; // 保存当前选择的贴纸
    let isProcessing = false; // 添��一个标志来防止重复处理
    let isUploading = false;

    // 元素是否存在
    if (!imageInput || !uploadBtn || !stickerInput || !stickerBtn) {
        console.error('某些必需的DOM元素未找到');
        return;
    }

    // 简化事件处理
    let canClick = true;  // 用于防止重复点击

    // 处理照片上传
    uploadBtn.onclick = (e) => {
        e.preventDefault();
        if (!canClick) return;
        canClick = false;  // 禁止点击
        
        // 一次性事件处理器
        const handleImageSelect = (event) => {
            const file = event.target.files[0];
            if (file) {
                handleImageFile(file);
            }
            event.target.value = '';  // 清空input
            canClick = true;  // 恢复点击
            imageInput.removeEventListener('change', handleImageSelect);
        };

        imageInput.addEventListener('change', handleImageSelect);
        imageInput.click();
    };

    // 处理贴纸选择
    stickerBtn.onclick = (e) => {
        e.preventDefault();
        if (!canClick) return;
        canClick = false;

        // 创建选择框容器
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
        `;

        // 添加标题
        dialog.innerHTML = `
            <h3 style="margin-top: 0;">选择贴纸</h3>
            <div style="margin-bottom: 15px;">
                <p>男生贴纸：<button id="maleSticker">选择新贴纸</button></p>
                <img id="malePreview" src="./stickers/boy.png" style="max-width: 100px; display: block; margin: 5px 0;">
            </div>
            <div style="margin-bottom: 15px;">
                <p>女生贴纸：<button id="femaleSticker">选择新贴纸</button></p>
                <img id="femalePreview" src="./stickers/girl.png" style="max-width: 100px; display: block; margin: 5px 0;">
            </div>
            <button id="closeDialog" style="margin-top: 10px;">完成</button>
        `;

        // 创建文件输入框
        const maleInput = document.createElement('input');
        maleInput.type = 'file';
        maleInput.accept = 'image/png';
        maleInput.style.display = 'none';

        const femaleInput = document.createElement('input');
        femaleInput.type = 'file';
        femaleInput.accept = 'image/png';
        femaleInput.style.display = 'none';

        // 添加到页面
        document.body.appendChild(dialog);
        document.body.appendChild(maleInput);
        document.body.appendChild(femaleInput);

        // 处理男生贴纸选择
        const handleMaleSticker = async (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    maleStickerDataUrl = e.target.result;
                    document.getElementById('malePreview').src = e.target.result;
                    if (imageInput.files[0]) {
                        handleImageFile(imageInput.files[0]);
                    }
                };
                reader.readAsDataURL(file);
            }
        };

        // 处理女生贴纸选择
        const handleFemaleSticker = async (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    femaleStickerDataUrl = e.target.result;
                    document.getElementById('femalePreview').src = e.target.result;
                    if (imageInput.files[0]) {
                        handleImageFile(imageInput.files[0]);
                    }
                };
                reader.readAsDataURL(file);
            }
        };

        // 绑定事件
        document.getElementById('maleSticker').onclick = () => maleInput.click();
        document.getElementById('femaleSticker').onclick = () => femaleInput.click();
        document.getElementById('closeDialog').onclick = () => {
            document.body.removeChild(dialog);
            document.body.removeChild(maleInput);
            document.body.removeChild(femaleInput);
            canClick = true;
        };

        maleInput.addEventListener('change', handleMaleSticker);
        femaleInput.addEventListener('change', handleFemaleSticker);
    };

    // 处理保存
    saveBtn.onclick = saveImage;
});

// 加载face-api.js模型
async function loadModels() {
    try {
        const modelPath = './models';  // 使用相对路径
        console.log('开始加载模型，路径:', modelPath);
        
        // 先检查模型文件是否存在
        const modelFiles = [
            `${modelPath}/tiny_face_detector_model-weights_manifest.json`,
            `${modelPath}/tiny_face_detector_model-shard1`,
            `${modelPath}/face_landmark_68_model-weights_manifest.json`,
            `${modelPath}/face_landmark_68_model-shard1`,
            `${modelPath}/age_gender_model-weights_manifest.json`,
            `${modelPath}/age_gender_model-shard1`
        ];

        // 检查每个文件是否存在
        for (const file of modelFiles) {
            try {
                const response = await fetch(file);
                if (!response.ok) {
                    throw new Error(`文件不存在: ${file}`);
                }
            } catch (e) {
                console.error(`检查模型文件失败: ${file}`, e);
                throw new Error(`模型文件 ${file} 不可访问`);
            }
        }

        // 加载模型
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
            faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
            faceapi.nets.ageGenderNet.loadFromUri(modelPath)  // 添加性别检测模型
        ]);
        
        console.log('模型加载成功');
    } catch (error) {
        console.error('模型加载失败，详细错误:', error);
        throw error;
    }
}

// 在文件开头添加一个变量来保存原始图片
let originalImage = null;

// 处理上传的图片文件
async function handleImageFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                console.log('片加载完成');
                originalImage = e.target.result;
                
                const img = new Image();
                img.onload = async () => {
                    try {
                        const canvas = document.getElementById('outputCanvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = img.width;
                        canvas.height = img.height;
                        
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);

                        const detections = await faceapi.detectAllFaces(
                            canvas,
                            new faceapi.TinyFaceDetectorOptions({
                                inputSize: 512,
                                scoreThreshold: 0.3
                            })
                        ).withAgeAndGender();

                        console.log(`检测到 ${detections.length} 个人脸`);

                        // 遍历检测结果
                        detections.forEach((detection, index) => {
                            // 获取人脸框和性别信息
                            const box = detection.detection.box;
                            const { gender, genderProbability } = detection;
                            
                            console.log(`第 ${index + 1} 个人脸:`, {
                                gender: gender,  // 'male' 或 'female'
                                probability: genderProbability  // 置信度
                            });
                        });

                        // 应用贴纸
                        if (detections.length > 0) {
                            await applyStickersToFaces(detections.map(det => ({
                                ...det,
                                box: det.detection.box
                            })));
                        }
                        resolve();
                    } catch (error) {
                        console.error('处理图片时出错:', error);
                        reject(error);
                    }
                };
                img.onerror = reject;
                img.src = e.target.result;
            } catch (error) {
                console.error('读取图片时出错:', error);
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 处理贴纸上传
async function handleStickerFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                console.log('贴纸加载完成');
                const stickerPreview = document.getElementById('stickerPreview');
                stickerPreview.src = e.target.result;
                stickerPreview.style.display = 'block';
                selectedSticker = e.target.result;

                if (originalImage) {
                    const img = new Image();
                    img.onload = async () => {
                        try {
                            const canvas = document.getElementById('outputCanvas');
                            const ctx = canvas.getContext('2d');
                            
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, 0, 0);
                            
                            const detections = await faceapi.detectAllFaces(
                                canvas,
                                new faceapi.TinyFaceDetectorOptions({
                                    inputSize: 512,
                                    scoreThreshold: 0.3
                                })
                            );

                            if (detections.length > 0) {
                                await applyStickersToFaces(detections);
                            }
                            resolve();
                        } catch (error) {
                            console.error('应用贴纸时出错:', error);
                            reject(error);
                        }
                    };
                    img.onerror = reject;
                    img.src = originalImage;
                } else {
                    resolve();
                }
            } catch (error) {
                console.error('处理贴纸时出错:', error);
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 将贴纸应用到检测到的人脸上
async function applyStickersToFaces(detections) {
    const canvas = document.getElementById('outputCanvas');
    const ctx = canvas.getContext('2d');

    console.log('准备应用贴纸到', detections.length, '个人脸');

    try {
        // 为每个检测到的人脸异步应用贴纸
        for (const detection of detections) {
            const { x, y, width, height } = detection.box;
            
            // 根据性别选择贴纸
            const stickerSrc = detection.gender === 'male' ? maleStickerDataUrl : femaleStickerDataUrl;
            
            // 创建新的Image对象并等待加载完成
            const stickerImg = new Image();
            await new Promise((resolve, reject) => {
                stickerImg.onload = resolve;
                stickerImg.onerror = reject;
                stickerImg.src = stickerSrc;
            });

            // 计算保持宽高比的尺寸
            const stickerAspectRatio = stickerImg.width / stickerImg.height;
            let newWidth, newHeight;

            // 使用人脸框的宽度作基准，按比例计算高度
            newWidth = width;
            newHeight = width / stickerAspectRatio;
            
            // 整位置，向上移动10%的脸高度
            const newX = x;
            const newY = y - height * 0.1;

            console.log(`应用贴纸到人脸:`, { 
                x: newX, 
                y: newY, 
                width: newWidth, 
                height: newHeight,
                gender: detection.gender,
                aspectRatio: stickerAspectRatio
            });
            
            // 在应用贴纸之前保存当前状态
            ctx.save();
            
            // 应用贴纸
            ctx.drawImage(stickerImg, newX, newY, newWidth, newHeight);
            
            // 恢复到之前的状态
            ctx.restore();
        }

        console.log('贴纸应用完成');
    } catch (error) {
        console.error('应用贴纸时出错:', error);
    }
}

// 保存图片
function saveImage() {
    const canvas = document.getElementById('outputCanvas');
    const link = document.createElement('a');
    link.download = 'edited-photo.png';
    link.href = canvas.toDataURL();
    link.click();
}

// 在文件开头添加变量
let maleStickerDataUrl = null;  // 男生贴纸
let femaleStickerDataUrl = null;  // 女生贴纸

// 加载默认贴纸
async function loadDefaultStickers() {
    try {
        // 加载男生贴纸
        const maleResponse = await fetch('./stickers/boy.png');
        const maleBlob = await maleResponse.blob();
        maleStickerDataUrl = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(maleBlob);
        });

        // 加载女生贴纸
        const femaleResponse = await fetch('./stickers/girl.png');
        const femaleBlob = await femaleResponse.blob();
        femaleStickerDataUrl = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(femaleBlob);
        });

        console.log('默认贴纸加载完成');
    } catch (error) {
        console.error('加载默认贴纸失败:', error);
    }
}