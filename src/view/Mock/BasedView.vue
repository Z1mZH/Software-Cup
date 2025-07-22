<template>
 <div class="interview-page">
   <!-- 顶部状态栏 -->
   <div class="top-bar">
     <div class="progress-info">
       <span>第 {{ currentQuestionIndex + 1 }} / {{ totalQuestions }} 题</span>
       <span class="timer">总剩余时间: {{ formatTime(totalRemainingTime) }}</span>
     </div>
     
     <button class="end-btn" @click="endInterview">结束面试</button>
   </div>

   <!-- 主内容区（左右布局） -->
   <div class="main-content">
     <!-- 左侧用户面板 -->
     <div class="user-panel">
       <div class="user-card">
         <div class="avatar blue">面试官</div>
         <div class="status">
           <span class="online-dot"></span> 面试官
         </div>
         <AudioVisualizer />
       </div>
       <div class="user-card">
         <div class="avatar gray">用户 (我)</div>
         <div class="status">
           <span class="online-dot"></span> 用户 (我)
         </div>
         <UserAudio />
       </div>
       
       <!-- 当前题目状态 -->
       <div class="question-status">
         <h3>当前题目状态</h3>
         <p v-if="currentPhase === 'question'">
           面试官提问中...
           <span v-if="isSpeaking" class="speaking-indicator">🔊 播报中</span>
         </p>
         <p v-else-if="currentPhase === 'answer'">
           回答时间: {{ formatTime(answerRemainingTime) }}
           <span class="recording-indicator" v-if="isRecording">🔴 录音中</span>
         </p>
         <p v-else-if="currentPhase === 'generating'">面试官思考中...</p>
         <p v-else-if="currentPhase === 'transition'">准备下一题...</p>
       </div>
       
       <!-- 图像采集状态 - 简化显示 -->
       <div class="image-capture-status" v-if="currentPhase === 'answer' && shouldCaptureImages() && isCapturingImages">
         <h4>📸 图像采集中</h4>
       </div>
       
       <!-- 实时语音转文字显示 -->
       <div class="speech-status" v-if="currentPhase === 'answer' && isRecording">
         <h4>实时识别</h4>
         <div class="transcription-text">
           {{ currentTranscription || '正在识别您的语音...' }}
         </div>
       </div>
       
       <!-- 语音播报控制 -->
       <div class="tts-controls">
         <h4>语音设置</h4>
         <div class="control-item">
           <label>语速:</label>
           <input type="range" v-model="ttsRate" min="0.5" max="2" step="0.1" />
           <span>{{ ttsRate }}</span>
         </div>
         <div class="control-item">
           <label>音调:</label>
           <input type="range" v-model="ttsPitch" min="0.5" max="2" step="0.1" />
           <span>{{ ttsPitch }}</span>
         </div>
       </div>
     </div>

     <!-- 右侧对话区域 -->
     <div class="chat-area">
       <!-- 摄像头显示区域 - 移到右上角 -->
       <div class="camera-container">
         <video ref="cameraVideo" class="camera-video" autoplay muted></video>
         <div class="camera-status">
           <span class="camera-indicator" :class="{ active: isCameraActive, capturing: isCapturingImages }">
             {{ isCapturingImages ? '📸' : '📹' }}
           </span>
         </div>
       </div>
       
       <div class="message" v-for="(msg, idx) in messages" :key="idx">
         <div :class="['bubble', msg.sender]">
           <p>{{ msg.content }}</p>
           <span v-if="msg.timestamp" class="timestamp">
             {{ formatTimestamp(msg.timestamp) }}
           </span>
         </div>
       </div>
       <div ref="chatBottom"></div>
     </div>

     <!-- 底部控制栏 -->
     <div class="bottom-control">
       <button 
         class="mic-btn" 
         :class="{ active: isRecording, disabled: currentPhase !== 'answer' }"
         :disabled="currentPhase !== 'answer'"
       >
         <span class="icon">{{ isRecording ? '🔴' : '🎤' }}</span>
         {{ getMicButtonText() }}
       </button>
       
       <!-- 音频质量指示器 -->
       <div class="audio-level" v-if="isRecording">
         <div class="level-bar" :style="{ width: audioLevel + '%' }"></div>
       </div>
     </div>
   </div>
 </div>
</template>

<script>
import AudioVisualizer from "@/components/AudioVisualizer.vue";
import UserAudio from "@/components/userAudio.vue";

// 配置大模型
const OpenAI = require('openai');
const openai = new OpenAI({
 apiKey: "sk-a34b0daa63ec4ad8b9f7d83ec09e6802",
 baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
 dangerouslyAllowBrowser: true
});

export default {
 components: {
   AudioVisualizer, 
   UserAudio
 },
 data() {
   return {
     // 面试配置
     interviewConfig: null,
     allQuestions: [],
     totalDuration: 15,
     
     // 题目相关
     currentQuestionIndex: 0,
     totalQuestions: 0,
     currentPhase: 'question',
     
     // 时间相关
     totalRemainingTime: 0,
     answerRemainingTime: 0,
     answerDuration: 0,
     
     // 消息记录
     messages: [],
     
     // 录音相关
     isRecording: false,
     mediaRecorder: null,
     audioChunks: [],
     audioStream: null,
     audioLevel: 0,
     
     // 摄像头相关
     cameraStream: null,
     isCameraActive: false,
     
     // 语音识别相关
     speechRecognition: null,
     isTranscribing: false,
     currentTranscription: '',
     finalTranscription: '',
     recognitionActive: false,
     
     // 图像采集相关
     isCapturingImages: false,
     capturedImages: [],
     capturedImagesCount: 0,
     imageCaptureTimer: null,
     imageCaptureInterval: null,
     
     // 图像分析相关
     imageAnalysisResults: [],
     currentImageAnalysis: null,
     
     // 综合评价存储
     comprehensiveEvaluation: {
       imageAnalyses: [],        // 所有图像分析结果
       performanceAnalysis: null, // 综合表现分析
       averageScores: {          // 平均分数
         eyeContact: 0,
         bodyLanguage: 0,
         appearance: 0,
         facialExpression: 0,
         professionalImage: 0,
         overall: 0
       },
       summary: ''               // 综合评价总结
     },
     
     // 答案存储
     interviewData: {
       questions: [],
       currentQuestionData: null,
       jobInfo: null,
       startTime: null,
       endTime: null,
       allQuestions: [],  // 保存所有问题
       allAnswers: []     // 保存所有回答
     },
     
     // 当前问题的回答数据
     currentAnswers: {
       firstAnswer: '',
       followUpQuestion: '',
       secondAnswer: ''
     },
     
     // 追问相关
     isFollowUpPhase: false,
     
     // 定时器
     totalTimer: null,
     answerTimer: null,
     phaseTimer: null,
     audioLevelTimer: null,
     
     // 浏览器语音合成相关
     speechSynthesis: null,
     currentUtterance: null,
     isSpeaking: false,
     ttsRate: 1.3,     // 默认语速为1.3
     ttsPitch: 1.0,    // 音调
     selectedVoice: null
   };
 },
 mounted() {
   this.initializeInterview();
 },
 methods: {
   async initializeInterview() {
     const configData = sessionStorage.getItem('finalInterviewConfig');
     if (!configData) {
       alert('面试数据丢失，请重新开始');
       this.$router.push('/config_view');
       return;
     }
     
     this.interviewConfig = JSON.parse(configData);
     this.allQuestions = this.interviewConfig.allQuestions || [];
     this.totalQuestions = this.allQuestions.length;
     this.totalDuration = this.interviewConfig.config.durationMinutes || 15;
     
     this.interviewData.jobInfo = this.interviewConfig.config.jobInfo;
     this.interviewData.startTime = new Date().toISOString();
     
     // 保存所有原始问题
     this.interviewData.allQuestions = this.allQuestions.map(q => q.question);
     
     this.answerDuration = Math.floor((this.totalDuration * 60 / this.totalQuestions) * 0.5);
     this.totalRemainingTime = this.totalDuration * 60;
     
     // 初始化浏览器语音合成
     this.initializeSpeechSynthesis();
     
     await this.initializeCamera();
     await this.initializeRecording();
     await this.initializeSpeechRecognition();
     
     this.startInterview();
   },
   
   // 初始化浏览器语音合成
   initializeSpeechSynthesis() {
     if ('speechSynthesis' in window) {
       this.speechSynthesis = window.speechSynthesis;
       
       // 获取中文语音
       const loadVoices = () => {
         const voices = this.speechSynthesis.getVoices();
         
         // 优先选择中文女声
         const zhVoices = voices.filter(voice => 
           voice.lang.includes('zh') || 
           voice.lang.includes('CN') || 
           voice.lang.includes('cmn')
         );
         
         // 尝试选择女声
         const femaleVoice = zhVoices.find(voice => 
           voice.name.includes('Female') || 
           voice.name.includes('女') ||
           voice.name.includes('Ting') ||
           voice.name.includes('Mei')
         );
         
         this.selectedVoice = femaleVoice || zhVoices[0] || voices[0];
         
         console.log('已选择语音:', this.selectedVoice?.name);
       };
       
       // 有些浏览器需要等待 voiceschanged 事件
       if (this.speechSynthesis.getVoices().length === 0) {
         this.speechSynthesis.addEventListener('voiceschanged', loadVoices);
       } else {
         loadVoices();
       }
     } else {
       console.warn('当前浏览器不支持语音合成');
     }
   },
   
   // 使用浏览器语音合成播报文本
   speakText(text, callback) {
     if (!this.speechSynthesis) {
       console.warn('语音合成不可用');
       if (callback) callback();
       return;
     }
     
     // 取消之前的播报
     this.speechSynthesis.cancel();
     
     // 创建语音实例
     const utterance = new SpeechSynthesisUtterance(text);
     
     // 设置语音参数
     if (this.selectedVoice) {
       utterance.voice = this.selectedVoice;
     }
     utterance.rate = this.ttsRate;
     utterance.pitch = this.ttsPitch;
     utterance.volume = 1.0;
     utterance.lang = 'zh-CN';
     
     // 设置事件监听
     utterance.onstart = () => {
       this.isSpeaking = true;
       console.log('开始播报:', text);
     };
     
     utterance.onend = () => {
       this.isSpeaking = false;
       console.log('播报结束');
       if (callback) callback();
     };
     
     utterance.onerror = (event) => {
       this.isSpeaking = false;
       console.error('播报错误:', event);
       if (callback) callback();
     };
     
     // 开始播报
     this.currentUtterance = utterance;
     this.speechSynthesis.speak(utterance);
   },
   
   // 停止语音播报
   stopSpeaking() {
     if (this.speechSynthesis && this.isSpeaking) {
       this.speechSynthesis.cancel();
       this.isSpeaking = false;
     }
   },
   
   async initializeCamera() {
     try {
       this.cameraStream = await navigator.mediaDevices.getUserMedia({ 
         video: { 
           width: { ideal: 640 },
           height: { ideal: 480 },
           facingMode: 'user'
         },
         audio: true
       });
       
       if (this.$refs.cameraVideo) {
         this.$refs.cameraVideo.srcObject = this.cameraStream;
         this.isCameraActive = true;
       }
     } catch (error) {
       console.error('无法启动摄像头:', error);
       alert('请允许使用摄像头以进行面试');
     }
   },
   
   async initializeRecording() {
     try {
       this.audioStream = await navigator.mediaDevices.getUserMedia({ 
         audio: {
           echoCancellation: true,
           noiseSuppression: true,
           autoGainControl: true
         }
       });
       
       const audioContext = new (window.AudioContext || window.webkitAudioContext)();
       const analyser = audioContext.createAnalyser();
       const source = audioContext.createMediaStreamSource(this.audioStream);
       source.connect(analyser);
       
       analyser.fftSize = 256;
       const bufferLength = analyser.frequencyBinCount;
       const dataArray = new Uint8Array(bufferLength);
       
       const updateAudioLevel = () => {
         if (this.isRecording) {
           analyser.getByteFrequencyData(dataArray);
           const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
           this.audioLevel = (average / 255) * 100;
         }
       };
       
       this.audioLevelTimer = setInterval(updateAudioLevel, 100);
       
     } catch (error) {
       console.error('无法初始化录音:', error);
       alert('请允许使用麦克风以进行面试');
     }
   },
   
   // 简化后的语音识别初始化
   async initializeSpeechRecognition() {
     try {
       // 检查浏览器支持
       if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
         console.warn('当前浏览器不支持语音识别');
         return;
       }

       const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
       this.speechRecognition = new SpeechRecognition();
       
       // 配置语音识别
       this.speechRecognition.continuous = true;
       this.speechRecognition.interimResults = true;
       this.speechRecognition.lang = 'zh-CN';
       this.speechRecognition.maxAlternatives = 1;
       
       // 设置事件监听器
       this.setupSpeechRecognitionEvents();
       
       console.log('语音识别初始化成功');
       
     } catch (error) {
       console.error('语音识别初始化失败:', error);
     }
   },
   
   // 设置语音识别事件监听器
   setupSpeechRecognitionEvents() {
     if (!this.speechRecognition) return;
     
     this.speechRecognition.onstart = () => {
       this.isTranscribing = true;
       this.recognitionActive = true;
       console.log('语音识别已启动');
     };
     
     this.speechRecognition.onresult = (event) => {
       let interimTranscript = '';
       let finalTranscript = this.finalTranscription;
       
       for (let i = event.resultIndex; i < event.results.length; i++) {
         const transcript = event.results[i][0].transcript;
         
         if (event.results[i].isFinal) {
           finalTranscript += transcript + ' ';
           console.log('识别到最终结果:', transcript);
         } else {
           interimTranscript += transcript;
         }
       }
       
       this.finalTranscription = finalTranscript;
       this.currentTranscription = finalTranscript + interimTranscript;
     };
     
     this.speechRecognition.onerror = (event) => {
       console.error('语音识别错误:', event.error);
       this.isTranscribing = false;
       
       // 不自动重启，只记录错误
       if (event.error === 'no-speech') {
         console.log('未检测到语音输入');
       }
     };
     
     this.speechRecognition.onend = () => {
       this.isTranscribing = false;
       this.recognitionActive = false;
       console.log('语音识别已结束');
       
       // 如果仍在录音状态，尝试重新启动一次
       if (this.isRecording && this.currentPhase === 'answer') {
         setTimeout(() => {
           this.startSpeechRecognition();
         }, 1000);
       }
     };
   },
   
   // 启动语音识别
   startSpeechRecognition() {
     if (!this.speechRecognition || this.recognitionActive) {
       return;
     }
     
     try {
       this.speechRecognition.start();
       this.currentTranscription = '';
       this.finalTranscription = '';
     } catch (error) {
       console.error('启动语音识别失败:', error);
     }
   },
   
   // 停止语音识别
   stopSpeechRecognition() {
     if (this.speechRecognition && this.recognitionActive) {
       try {
         this.speechRecognition.stop();
       } catch (error) {
         console.error('停止语音识别失败:', error);
       }
     }
     
     this.isTranscribing = false;
     this.recognitionActive = false;
   },
   
   shouldCaptureImages() {
     // 第1、5、10题需要采集图像
     return (this.currentQuestionIndex === 0 || 
             this.currentQuestionIndex === 4 || 
             this.currentQuestionIndex === 9) && 
             !this.isFollowUpPhase;
   },
   
   startImageCapture() {
     if (!this.cameraStream || this.isCapturingImages) return;
     
     this.capturedImages = [];
     this.capturedImagesCount = 0;
     this.isCapturingImages = true;
     
     console.log(`开始采集第${this.currentQuestionIndex + 1}题的图像进行分析`);
     
     // 计算采集间隔：30秒内均匀采集10张，即每3秒一张
     const captureInterval = 3000; // 3秒
     
     // 立即捕获第一张图像
     this.captureImage();
     
     // 设置定时采集
     this.imageCaptureInterval = setInterval(() => {
       if (this.capturedImagesCount < 10) {
         this.captureImage();
       } else {
         this.stopImageCapture();
       }
     }, captureInterval);
     
     // 30秒后确保停止（作为保险）
     this.imageCaptureTimer = setTimeout(() => {
       if (this.isCapturingImages) {
         this.stopImageCapture();
       }
     }, 30000);
   },
   
   captureImage() {
     if (!this.$refs.cameraVideo || this.capturedImagesCount >= 10) return;
     
     const video = this.$refs.cameraVideo;
     const canvas = document.createElement('canvas');
     canvas.width = video.videoWidth;
     canvas.height = video.videoHeight;
     
     const ctx = canvas.getContext('2d');
     ctx.drawImage(video, 0, 0);
     
     const imageDataURL = canvas.toDataURL('image/jpeg', 0.8);
     this.capturedImages.push(imageDataURL);
     this.capturedImagesCount++;
     
     console.log(`已捕获第 ${this.capturedImagesCount} 张图像`);
   },
   
   stopImageCapture() {
     if (!this.isCapturingImages) return;
     
     this.isCapturingImages = false;
     
     if (this.imageCaptureInterval) {
       clearInterval(this.imageCaptureInterval);
       this.imageCaptureInterval = null;
     }
     
     if (this.imageCaptureTimer) {
       clearTimeout(this.imageCaptureTimer);
       this.imageCaptureTimer = null;
     }
     
     console.log(`图像采集完成，共捕获 ${this.capturedImagesCount} 张图像`);
     
     // 开始分析采集的图像
     this.analyzeImagesWithAI();
   },
   
   async analyzeImagesWithAI() {
     try {
       const jobInfo = this.interviewData.jobInfo;
       const questionNumber = this.currentQuestionIndex + 1;
       const question = this.allQuestions[this.currentQuestionIndex].question;
       
       const analysisPrompt = `
你是一位经验丰富的面试官，正在评估应聘者在面试过程中的表现。请基于以下10张按时间顺序排列的图像（每秒一张），分析应聘者的整体表现变化和状态。

面试信息：
- 职位：${jobInfo?.position || '未知职位'}
- 行业：${jobInfo?.industry || '未知行业'}
- 面试官类型：${jobInfo?.interviewerType || '综合面试官'}
- 题目序号：第${questionNumber}题
- 问题内容：${question}

请特别关注图像之间的变化，包括：
- 眼神的移动和变化（是否保持稳定的眼神接触，还是频繁游移）
- 表情的演变（从开始到结束的情绪变化）
- 姿态的调整（是否有紧张或放松的迹象）
- 整体状态的转变（自信度是否提升或下降）

请重点分析以下方面，并为每个方面打分（1-10分）：
1. 眼神接触与自信度：分析整个过程中眼神的稳定性和自信程度的变化
2. 肢体语言：观察姿态变化，是否越来越放松或紧张
3. 服装仪表：着装是否得体、整洁，符合职位要求
4. 面部表情：表情变化是否自然，情绪控制能力如何
5. 整体专业形象：综合评价应聘者的职业形象和状态变化

请以JSON格式返回分析结果，格式如下：
{
 "overallScore": 总分(1-10),
 "analysis": {
   "eyeContact": {"score": 分数, "feedback": "具体评价，包含变化描述"},
   "bodyLanguage": {"score": 分数, "feedback": "具体评价，包含变化描述"},
   "appearance": {"score": 分数, "feedback": "具体评价"},
   "facialExpression": {"score": 分数, "feedback": "具体评价，包含变化描述"},
   "professionalImage": {"score": 分数, "feedback": "具体评价"}
 },
 "progressAnalysis": "描述从开始到结束的整体状态变化",
 "strengths": ["优点1", "优点2", "优点3"],
 "improvements": ["改进建议1", "改进建议2", "改进建议3"],
 "recommendation": "综合建议"
}`;

       // 准备图像内容
       const imageContents = this.capturedImages.map((image) => ({
         type: "image_url",
         image_url: { url: image }
       }));
       
       console.log('正在调用视觉AI模型分析图像序列...');
       
       const response = await openai.chat.completions.create({
         model: "qwen-vl-max-latest",
         messages: [{
           role: "user",
           content: [
             ...imageContents,
             {
               type: "text",
               text: analysisPrompt
             }
           ]
         }],
         temperature: 0.3,
         max_tokens: 1500
       });

       // 清理可能的 markdown 代码块标记
       let content = response.choices[0].message.content;
       content = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
       
       const analysisResult = JSON.parse(content);
       
       this.currentImageAnalysis = {
         questionIndex: this.currentQuestionIndex,
         questionNumber: questionNumber,
         question: question,
         timestamp: new Date().toISOString(),
         imageCount: this.capturedImagesCount,
         analysis: analysisResult
       };
       
       this.imageAnalysisResults.push(this.currentImageAnalysis);
       
       console.log('=== 图像序列分析结果 ===');
       console.log(`题目：第${questionNumber}题 - ${question}`);
       console.log(`分析图像数量：${this.capturedImagesCount}张`);
       console.log(`总分：${analysisResult.overallScore}/10`);
       console.log('详细分析：');
       console.log('- 眼神接触：', analysisResult.analysis.eyeContact);
       console.log('- 肢体语言：', analysisResult.analysis.bodyLanguage);
       console.log('- 服装仪表：', analysisResult.analysis.appearance);
       console.log('- 面部表情：', analysisResult.analysis.facialExpression);
       console.log('- 专业形象：', analysisResult.analysis.professionalImage);
       console.log('状态变化：', analysisResult.progressAnalysis);
       console.log('优点：', analysisResult.strengths);
       console.log('改进建议：', analysisResult.improvements);
       console.log('综合建议：', analysisResult.recommendation);
       console.log('=====================');
       
       if (this.interviewData.currentQuestionData) {
         this.interviewData.currentQuestionData.imageAnalysis = this.currentImageAnalysis;
       }
       
     } catch (error) {
       console.error('AI图像分析失败:', error);
       console.log('图像分析失败，将继续面试流程');
     }
   },
   
   startInterview() {
     this.startTotalTimer();
     
     const welcomeText = '你好，我是你今天的面试官。我们现在开始面试，请认真回答每个问题。';
     this.addMessage('interviewer', welcomeText);
     
     // 语音播报欢迎语，播报完成后再继续
     this.speakText(welcomeText, () => {
       setTimeout(() => {
         this.askNextQuestion();
       }, 1000);
     });
   },
   
   startTotalTimer() {
     this.totalTimer = setInterval(() => {
       if (this.totalRemainingTime > 0) {
         this.totalRemainingTime--;
       } else {
         this.endInterview();
       }
     }, 1000);
   },
   
   askNextQuestion() {
     if (this.currentQuestionIndex >= this.totalQuestions) {
       this.endInterview();
       return;
     }
     
     this.currentPhase = 'question';
     const question = this.allQuestions[this.currentQuestionIndex];
     
     this.interviewData.currentQuestionData = {
       questionIndex: this.currentQuestionIndex,
       originalQuestion: question.question,
       firstAnswer: '',
       followUpQuestion: '',
       secondAnswer: '',
       timestamp: new Date().toISOString(),
       imageAnalysis: null
     };
     
     this.currentAnswers = {
       firstAnswer: '',
       followUpQuestion: '',
       secondAnswer: ''
     };
     
     this.isFollowUpPhase = false;
     
     const questionText = `第${this.currentQuestionIndex + 1}题: ${question.question}`;
     this.addMessage('interviewer', questionText);
     
     // 语音播报问题，播报完成后再进入答题阶段
     this.speakText(questionText, () => {
       setTimeout(() => {
         this.startAnswerPhase();
       }, 500);
     });
   },
   
   startAnswerPhase() {
     this.currentPhase = 'answer';
     this.answerRemainingTime = this.answerDuration;
     
     this.currentTranscription = '';
     this.finalTranscription = '';
     
     if (this.shouldCaptureImages()) {
       console.log(`第${this.currentQuestionIndex + 1}题需要采集图像进行分析`);
       setTimeout(() => {
         this.startImageCapture();
       }, 1000);
     }
     
     this.startRecording();
     
     const phaseText = this.isFollowUpPhase ? '请回答追问问题' : '请开始回答';
     let message = `${phaseText}，您有 ${this.answerDuration} 秒的回答时间`;
     
     this.addMessage('system', message);
     
     this.answerTimer = setInterval(() => {
       if (this.answerRemainingTime > 0) {
         this.answerRemainingTime--;
       } else {
         this.endAnswerPhase();
       }
     }, 1000);
   },
   
   async endAnswerPhase() {
     clearInterval(this.answerTimer);
     
     this.stopRecording();
     
     if (this.isCapturingImages) {
       this.stopImageCapture();
     }
     
     const userAnswer = this.finalTranscription.trim() || '未识别到有效回答';
     
     this.addMessage('user', userAnswer);
     
     // 保存用户回答到总记录中
     this.interviewData.allAnswers.push({
       questionIndex: this.currentQuestionIndex,
       questionType: this.isFollowUpPhase ? 'followUp' : 'main',
       question: this.isFollowUpPhase ? this.currentAnswers.followUpQuestion : this.allQuestions[this.currentQuestionIndex].question,
       answer: userAnswer,
       timestamp: new Date().toISOString()
     });
     
     if (!this.isFollowUpPhase) {
       this.currentAnswers.firstAnswer = userAnswer;
       this.interviewData.currentQuestionData.firstAnswer = userAnswer;
       
       await this.generateFollowUpQuestion();
     } else {
       this.currentAnswers.secondAnswer = userAnswer;
       this.interviewData.currentQuestionData.secondAnswer = userAnswer;
       
       this.interviewData.questions.push({ ...this.interviewData.currentQuestionData });
       
       this.currentPhase = 'transition';
       this.phaseTimer = setTimeout(() => {
         this.currentQuestionIndex++;
         this.askNextQuestion();
       }, 2000);
     }
   },
   
   async generateFollowUpQuestion() {
     this.currentPhase = 'generating';
     
     try {
       const prompt = `
你是一位经验丰富的面试官。基于以下信息，请生成一个针对性的追问问题：

原始问题：${this.interviewData.currentQuestionData.originalQuestion}
应聘者回答：${this.currentAnswers.firstAnswer}
岗位信息：${JSON.stringify(this.interviewData.jobInfo)}

请生成一个深入的追问问题，用于进一步了解应聘者的能力和思考过程。
要求：
1. 问题要具体、有针对性
2. 能够深入了解应聘者的技能或经验
3. 问题长度控制在50字以内
4. 直接回答问题内容，不需要其他解释

追问问题：`;

       const completion = await openai.chat.completions.create({
         model: "qwen-plus",
         messages: [
           {
             role: "system",
             content: "你是一位经验丰富的技术面试官，擅长根据应聘者的回答生成深入的追问问题。"
           },
           {
             role: "user",
             content: prompt
           }
         ],
         temperature: 0.7,
         max_tokens: 200
       });

       const followUpQuestion = completion.choices[0].message.content.trim();
       
       this.currentAnswers.followUpQuestion = followUpQuestion;
       this.interviewData.currentQuestionData.followUpQuestion = followUpQuestion;
       
       const followUpText = `追问：${followUpQuestion}`;
       this.addMessage('interviewer', followUpText);
       
       // 语音播报追问，播报完成后再进入答题阶段
       this.speakText(followUpText, () => {
         this.isFollowUpPhase = true;
         setTimeout(() => {
           this.startAnswerPhase();
         }, 500);
       });
       
     } catch (error) {
       console.error('生成追问问题失败:', error);
       const defaultFollowUp = '请详细说明一下您在这方面的具体经验或做法？';
       this.currentAnswers.followUpQuestion = defaultFollowUp;
       this.interviewData.currentQuestionData.followUpQuestion = defaultFollowUp;
       
       const followUpText = `追问：${defaultFollowUp}`;
       this.addMessage('interviewer', followUpText);
       
       // 语音播报追问
       this.speakText(followUpText, () => {
         this.isFollowUpPhase = true;
         setTimeout(() => {
           this.startAnswerPhase();
         }, 500);
       });
     }
   },
   
   startRecording() {
     if (this.speechRecognition) {
       this.isRecording = true;
       this.startSpeechRecognition();
     }
   },
   
   stopRecording() {
     this.isRecording = false;
     this.audioLevel = 0;
     this.stopSpeechRecognition();
   },
   
   addMessage(sender, content) {
     this.messages.push({
       sender,
       content,
       timestamp: new Date()
     });
     
     this.$nextTick(() => {
       this.$refs.chatBottom?.scrollIntoView({ behavior: 'smooth' });
     });
   },
   
   formatTime(seconds) {
     const min = Math.floor(seconds / 60);
     const sec = seconds % 60;
     return `${min}:${sec.toString().padStart(2, '0')}`;
   },
   
   formatTimestamp(date) {
     return date.toLocaleTimeString('zh-CN', { 
       hour: '2-digit', 
       minute: '2-digit',
       second: '2-digit'
     });
   },
   
   getMicButtonText() {
     if (this.currentPhase !== 'answer') {
       return this.currentPhase === 'generating' ? '生成追问中' : '等待提问';
     }
     return this.isRecording ? '正在录音' : '准备录音';
   },
   
   async analyzeInterviewPerformance() {
     try {
       console.log('开始综合分析面试表现...');
       
       const analysisPrompt = `
你是一位资深的面试评估专家。请基于以下面试信息，对应聘者的整体表现进行综合评估：

岗位信息：
- 职位：${this.interviewData.jobInfo?.position || '未知职位'}
- 行业：${this.interviewData.jobInfo?.industry || '未知行业'}
- 面试官类型：${this.interviewData.jobInfo?.interviewerType || '综合面试官'}

面试问答记录：
${this.interviewData.questions.map((q, index) => `
问题${index + 1}：${q.originalQuestion}
第一次回答：${q.firstAnswer}
追问：${q.followUpQuestion}
追问回答：${q.secondAnswer}
`).join('\n')}

请从以下维度对应聘者进行评估，每个维度打分1-10分：
1. 专业技能水平：对岗位相关技能的掌握程度
2. 沟通表达能力：回答的清晰度、逻辑性和条理性
3. 问题解决能力：分析和解决问题的思路
4. 学习成长潜力：展现出的学习能力和成长空间
5. 岗位匹配度：与目标岗位的整体契合程度

请以JSON格式返回评估结果：
{
 "overallScore": 总分(1-10),
 "dimensions": {
   "technicalSkills": {"score": 分数, "feedback": "具体评价"},
   "communication": {"score": 分数, "feedback": "具体评价"},
   "problemSolving": {"score": 分数, "feedback": "具体评价"},
   "learningPotential": {"score": 分数, "feedback": "具体评价"},
   "jobFit": {"score": 分数, "feedback": "具体评价"}
 },
 "highlights": ["表现亮点1", "表现亮点2", "表现亮点3"],
 "weaknesses": ["待改进点1", "待改进点2", "待改进点3"],
 "hiringRecommendation": "录用建议（强烈推荐/推荐/考虑/不推荐）",
 "summary": "总体评价总结"
}`;

       const response = await openai.chat.completions.create({
         model: "qwen-plus",
         messages: [
           {
             role: "system",
             content: "你是一位经验丰富的人力资源专家，擅长评估应聘者的综合素质和岗位匹配度。"
           },
           {
             role: "user",
             content: analysisPrompt
           }
         ],
         temperature: 0.3,
         max_tokens: 2000
       });

       // 清理可能的 markdown 代码块标记
       let performanceContent = response.choices[0].message.content;
       performanceContent = performanceContent.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
       
       const performanceAnalysis = JSON.parse(performanceContent);
       
       console.log('=== 面试综合表现分析 ===');
       console.log(`总分：${performanceAnalysis.overallScore}/10`);
       console.log('各维度评分：');
       Object.entries(performanceAnalysis.dimensions).forEach(([key, value]) => {
         console.log(`- ${key}: ${value.score}/10 - ${value.feedback}`);
       });
       console.log('表现亮点：', performanceAnalysis.highlights);
       console.log('待改进点：', performanceAnalysis.weaknesses);
       console.log('录用建议：', performanceAnalysis.hiringRecommendation);
       console.log('总体评价：', performanceAnalysis.summary);
       console.log('========================');
       
       return performanceAnalysis;
       
     } catch (error) {
       console.error('综合分析失败:', error);
       return null;
     }
   },
   
   async endInterview() {
     clearInterval(this.totalTimer);
     clearInterval(this.answerTimer);
     clearTimeout(this.phaseTimer);
     clearInterval(this.audioLevelTimer);
     clearTimeout(this.imageCaptureTimer);
     clearInterval(this.imageCaptureInterval);
     
     if (this.isRecording) {
       this.stopRecording();
     }
     
     if (this.isCapturingImages) {
       this.stopImageCapture();
     }
     
     // 停止语音播报
     this.stopSpeaking();
     
     // 执行综合分析
     const performanceAnalysis = await this.analyzeInterviewPerformance();
     
     this.interviewData.endTime = new Date().toISOString();
     this.interviewData.totalQuestions = this.totalQuestions;
     this.interviewData.completedQuestions = this.currentQuestionIndex;
     this.interviewData.imageAnalysisResults = this.imageAnalysisResults;
     this.interviewData.performanceAnalysis = performanceAnalysis;
     
     const interviewResult = {
       ...this.interviewData,
       summary: {
         startTime: this.interviewData.startTime,
         endTime: this.interviewData.endTime,
         totalQuestions: this.totalQuestions,
         answeredQuestions: this.currentQuestionIndex,
         totalDuration: this.totalDuration,
         actualDuration: Math.floor((this.totalDuration * 60 - this.totalRemainingTime) / 60),
         imageAnalysisCount: this.imageAnalysisResults.length,
         hasPerformanceAnalysis: !!performanceAnalysis
       }
     };
     
     console.log('=== 面试结果汇总 ===');
     console.log(`完成题目数：${this.currentQuestionIndex}/${this.totalQuestions}`);
     console.log(`图像分析数：${this.imageAnalysisResults.length}`);
     console.log(`综合评分：${performanceAnalysis?.overallScore || 'N/A'}/10`);
     console.log('====================');
     
     sessionStorage.setItem('interviewResult', JSON.stringify(interviewResult));
     
     this.$router.push('/review');
   }
 },
 beforeUnmount() {
   clearInterval(this.totalTimer);
   clearInterval(this.answerTimer);
   clearTimeout(this.phaseTimer);
   clearInterval(this.audioLevelTimer);
   clearTimeout(this.imageCaptureTimer);
   clearInterval(this.imageCaptureInterval);
   
   if (this.audioStream) {
     this.audioStream.getTracks().forEach(track => track.stop());
   }
   
   if (this.cameraStream) {
     this.cameraStream.getTracks().forEach(track => track.stop());
   }
   
   if (this.speechRecognition) {
     this.stopSpeechRecognition();
   }
   
   if (this.isCapturingImages) {
     this.stopImageCapture();
   }
   
   // 停止语音播报
   this.stopSpeaking();
 }
};
</script>

<style scoped lang="scss">
.interview-page {
 min-height: 100vh;
 background: #f8f9fa;
 font-family: 'PingFang SC', sans-serif;

 .top-bar {
   display: flex;
   justify-content: space-between;
   align-items: center;
   padding: 12px 20px;
   background: white;
   box-shadow: 0 1px 3px rgba(0,0,0,0.1);

   .progress-info {
     display: flex;
     gap: 20px;
     align-items: center;
     
     span {
       font-size: 14px;
       color: #666;
     }
     
     .timer {
       font-weight: 500;
       color: #ff4d4f;
     }
   }

   .end-btn {
     padding: 8px 16px;
     background: #ff4d4f;
     color: white;
     border: none;
     border-radius: 4px;
     cursor: pointer;
     transition: background 0.3s;

     &:hover {
       background: #ff3333;
     }
   }
 }

 .main-content {
   display: flex;
   height: calc(100vh - 60px);
   padding: 20px;
   gap: 20px;

   .user-panel {
     width: 320px;
     background: white;
     border-radius: 8px;
     box-shadow: 0 1px 3px rgba(0,0,0,0.1);

     .user-card {
       padding: 16px;
       border-bottom: 1px solid #f0f0f0;

       .avatar {
         width: 80px;
         height: 80px;
         border-radius: 50%;
         display: flex;
         justify-content: center;
         align-items: center;
         font-size: 16px;
         margin: 0 auto 12px;

         &.blue {
           background: #409eff;
           color: white;
         }

         &.gray {
           background: #d9d9d9;
           color: #666;
         }
       }

       .status {
         text-align: center;
         font-size: 14px;
         color: #666;

         .online-dot {
           display: inline-block;
           width: 8px;
           height: 8px;
           border-radius: 50%;
           background: #52c41a;
           margin-right: 4px;
         }
       }
     }
     
     .question-status {
       padding: 16px;
       border-bottom: 1px solid #f0f0f0;
       
       h3 {
         font-size: 16px;
         margin-bottom: 12px;
         color: #333;
       }
       
       p {
         font-size: 14px;
         color: #666;
         line-height: 1.5;
         
         .recording-indicator, .speaking-indicator {
           margin-left: 8px;
           animation: blink 1s infinite;
         }
       }
     }
     
     .image-capture-status {
       padding: 16px;
       border-bottom: 1px solid #f0f0f0;
       background: #e6f7ff;
       
       h4 {
         font-size: 14px;
         color: #1890ff;
         margin-bottom: 0;
         font-weight: 600;
       }
     }
     
     .speech-status {
       padding: 16px;
       border-bottom: 1px solid #f0f0f0;
       
       h4 {
         font-size: 14px;
         color: #333;
         margin-bottom: 8px;
       }
       
       .transcription-text {
         background: #f8f9fa;
         border: 1px solid #e9ecef;
         border-radius: 4px;
         padding: 8px;
         font-size: 13px;
         line-height: 1.4;
         color: #495057;
         min-height: 60px;
         max-height: 120px;
         overflow-y: auto;
       }
     }
     
     .tts-controls {
       padding: 16px;
       
       h4 {
         font-size: 14px;
         color: #333;
         margin-bottom: 12px;
       }
       
       .control-item {
         display: flex;
         align-items: center;
         margin-bottom: 10px;
         
         label {
           width: 50px;
           font-size: 13px;
           color: #666;
         }
         
         input[type="range"] {
           flex: 1;
           margin: 0 10px;
           height: 4px;
           -webkit-appearance: none;
           appearance: none;
           background: #e0e0e0;
           outline: none;
           border-radius: 2px;
           
           &::-webkit-slider-thumb {
             -webkit-appearance: none;
             appearance: none;
             width: 16px;
             height: 16px;
             background: #409eff;
             cursor: pointer;
             border-radius: 50%;
           }
           
           &::-moz-range-thumb {
             width: 16px;
             height: 16px;
             background: #409eff;
             cursor: pointer;
             border-radius: 50%;
             border: none;
           }
         }
         
         span {
           width: 30px;
           font-size: 12px;
           color: #409eff;
           text-align: right;
         }
       }
     }
   }

   .chat-area {
     flex: 1;
     background: white;
     border-radius: 8px;
     box-shadow: 0 1px 3px rgba(0,0,0,0.1);
     padding: 20px;
     overflow-y: auto;
     max-height: calc(100vh - 180px);

     .message {
       margin-bottom: 20px;

       .bubble {
         max-width: 70%;
         padding: 12px 16px;
         border-radius: 16px;
         line-height: 1.5;
         position: relative;

         &.interviewer {
           background: #f5f7fa;
           margin-right: auto;
           color: #333;
         }

         &.user {
           background: #409eff;
           color: white;
           margin-left: auto;
         }
         
         &.system {
           background: #fff3cd;
           color: #856404;
           margin: 0 auto;
           text-align: center;
           font-size: 13px;
         }
         
         .timestamp {
           font-size: 11px;
           opacity: 0.7;
           margin-top: 4px;
           display: block;
         }
       }
     }
   }
 }
 
 // 固定在页面右上角的摄像头
 .camera-container-fixed {
   position: fixed;
   top: 80px;
   right: 20px;
   z-index: 1000;
   
   .camera-video {
     width: 160px;
     height: 120px;
     border-radius: 8px;
     border: 2px solid #ddd;
     background: #f5f5f5;
     object-fit: cover;
     box-shadow: 0 2px 8px rgba(0,0,0,0.15);
   }
   
   .camera-status {
     position: absolute;
     top: 5px;
     right: 5px;
     
     .camera-indicator {
       display: inline-block;
       padding: 2px 6px;
       background: rgba(0,0,0,0.7);
       color: white;
       border-radius: 12px;
       font-size: 12px;
       
       &.active {
         background: rgba(64,158,255,0.9);
         animation: pulse 2s infinite;
       }
       
       &.capturing {
         background: rgba(24,144,255,0.9);
         animation: capturingPulse 1s infinite;
       }
     }
   }
 }

 .bottom-control {
   position: fixed;
   bottom: 0;
   left: 0;
   right: 0;
   display: flex;
   justify-content: center;
   align-items: center;
   padding: 20px;
   background: white;
   box-shadow: 0 -1px 3px rgba(0,0,0,0.1);
   gap: 20px;

   .mic-btn {
     padding: 12px 32px;
     background: #f5f7fa;
     border: none;
     border-radius: 24px;
     cursor: pointer;
     transition: all 0.3s;
     font-size: 16px;

     &:hover:not(.disabled) {
       background: #e9e9e9;
     }
     
     &.active {
       background: #ff4d4f;
       color: white;
     }
     
     &.disabled {
       opacity: 0.5;
       cursor: not-allowed;
     }

     .icon {
       margin-right: 8px;
     }
   }
   
   .audio-level {
     width: 200px;
     height: 6px;
     background: #e9ecef;
     border-radius: 3px;
     overflow: hidden;
     
     .level-bar {
       height: 100%;
       background: linear-gradient(90deg, #28a745, #ffc107, #dc3545);
       transition: width 0.1s ease;
       border-radius: 3px;
     }
   }
 }
}

@keyframes blink {
 0%, 50% { opacity: 1; }
 51%, 100% { opacity: 0; }
}

@keyframes pulse {
 0% { transform: scale(1); }
 50% { transform: scale(1.1); }
 100% { transform: scale(1); }
}

@keyframes capturingPulse {
 0% { transform: scale(1); opacity: 1; }
 50% { transform: scale(1.2); opacity: 0.8; }
 100% { transform: scale(1); opacity: 1; }
}

::-webkit-scrollbar {
 width: 8px;
}
::-webkit-scrollbar-thumb {
 background: #d9d9d9;
 border-radius: 4px;
}
</style>