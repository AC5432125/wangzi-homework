// 数据存储（使用 localStorage）
const Storage = {
    getRecords() {
        return JSON.parse(localStorage.getItem('homeworkRecords') || '[]');
    },
    saveRecord(record) {
        const records = this.getRecords();
        record.id = Date.now();
        record.date = new Date().toLocaleDateString('zh-CN');
        records.unshift(record);
        localStorage.setItem('homeworkRecords', JSON.stringify(records));
    },
    getMistakes() {
        return JSON.parse(localStorage.getItem('mistakes') || '[]');
    },
    saveMistake(mistake) {
        const mistakes = this.getMistakes();
        mistake.id = Date.now();
        mistakes.unshift(mistake);
        localStorage.setItem('mistakes', JSON.stringify(mistakes));
    }
};

// 标签切换
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
        
        // 加载对应标签的数据
        if (btn.dataset.tab === 'records') loadRecords();
        if (btn.dataset.tab === 'mistakes') loadMistakes();
        if (btn.dataset.tab === 'weak') loadWeakPoints();
    });
});

// 文件上传
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="预览">`;
                preview.dataset.image = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
}

// 提交批改
submitBtn.addEventListener('click', async () => {
    if (!preview.dataset.image) {
        alert('请先上传作业照片');
        return;
    }
    
    const subject = document.getElementById('subject').value;
    const subjectNames = { math: '数学', chinese: '语文', english: '英语' };
    
    submitBtn.textContent = 'AI批改中...';
    submitBtn.disabled = true;
    
    try {
        // 提取base64图片数据
        const imageBase64 = preview.dataset.image.split(',')[1];
        
        // 调用AI批改API
        const response = await fetch('/api/grade', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: imageBase64,
                subject: subjectNames[subject],
                studentName: '王子'
            })
        });
        
        if (!response.ok) {
            throw new Error('批改服务暂时不可用');
        }
        
        const data = await response.json();
        
        const result = {
            subject: subjectNames[subject],
            score: data.score || '评分中',
            content: data.content || data.result,
            image: preview.dataset.image,
            timestamp: new Date().toISOString()
        };
        
        displayAIResult(result);
        Storage.saveRecord(result);
        
    } catch (error) {
        alert('批改失败：' + error.message);
        console.error('Grading error:', error);
    }
    
    submitBtn.textContent = '开始批改';
    submitBtn.disabled = false;
});

function displayAIResult(result) {
    gradingResult.innerHTML = `
        <div class="grading-result">
            <h3>🤖 AI 批改结果</h3>
            <div class="score">${result.score}</div>
            <p>科目：${result.subject}</p>
            <div style="margin-top:16px;padding:16px;background:white;border-radius:8px;max-height:400px;overflow-y:auto;">
                ${result.content}
            </div>
            <p style="margin-top:16px;color:#666;font-size:12px">批改时间：${new Date(result.timestamp).toLocaleString('zh-CN')}</p>
        </div>
    `;
}

// 加载批改记录
function loadRecords() {
    const records = Storage.getRecords();
    const list = document.getElementById('recordsList');
    
    if (records.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="icon">📝</div>
                <p>还没有批改记录</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = records.map(r => `
        <div class="record-item">
            <div>
                <span class="subject-tag ${r.subject === '数学' ? 'math' : r.subject === '语文' ? 'chinese' : 'english'}">${r.subject}</span>
                <span style="margin-left:8px;font-weight:600">${r.score}分</span>
            </div>
            <span class="date">${r.date}</span>
        </div>
    `).join('');
}

// 加载错题本
function loadMistakes(subject = 'all') {
    const mistakes = Storage.getMistakes();
    const list = document.getElementById('mistakesList');
    
    const filtered = subject === 'all' ? mistakes : mistakes.filter(m => m.subject === subject);
    
    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="icon">✅</div>
                <p>暂无错题</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = filtered.map(m => `
        <div class="mistake-card">
            <h4>${m.question} · ${m.subject}</h4>
            <p><strong>错误类型：</strong>${m.type}</p>
            <p style="color:#666;font-size:14px">${m.reason}</p>
            <span style="font-size:12px;color:#999">${m.date}</span>
        </div>
    `).join('');
}

// 错题本筛选
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadMistakes(btn.dataset.subject);
    });
});

// 加载薄弱点
function loadWeakPoints() {
    const mistakes = Storage.getMistakes();
    const container = document.getElementById('weakPoints');
    
    // 统计错误类型
    const typeCount = {};
    mistakes.forEach(m => {
        typeCount[m.type] = (typeCount[m.type] || 0) + 1;
    });
    
    const sorted = Object.entries(typeCount).sort((a, b) => b[1] - a[1]);
    
    if (sorted.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">🎯</div>
                <p>练习数据不足，无法分析薄弱点</p>
            </div>
        `;
        return;
    }
    
    const max = sorted[0][1];
    container.innerHTML = sorted.map(([type, count]) => `
        <div class="weak-point-item">
            <div style="display:flex;justify-content:space-between">
                <span>${type}</span>
                <span style="color:#f97316;font-weight:600">${count}次</span>
            </div>
            <div class="progress-bar">
                <div class="progress" style="width:${(count/max)*100}%"></div>
            </div>
        </div>
    `).join('');
}

// 生成练习
generateBtn.addEventListener('click', async () => {
    const subject = document.getElementById('practiceSubject').value;
    const difficulty = document.getElementById('difficulty').value;
    const count = parseInt(document.getElementById('questionCount').value);
    
    const subjectNames = { math: '数学', chinese: '语文', english: '英语' };
    const diffNames = { easy: '基础', medium: '中等', hard: '挑战' };
    
    generateBtn.textContent = '生成中...';
    generateBtn.disabled = true;
    
    // 模拟生成练习（实际应调用AI API）
    await new Promise(r => setTimeout(r, 2000));
    
    const questions = [];
    for (let i = 1; i <= count; i++) {
        questions.push({
            num: i,
            content: `这是${subjectNames[subject]}${diffNames[difficulty]}难度的第${i}道练习题...`,
            answer: '答案略'
        });
    }
    
    document.getElementById('practiceContent').innerHTML = `
        <h3 style="margin-bottom:16px">${subjectNames[subject]} · ${diffNames[difficulty]}难度</h3>
        ${questions.map(q => `
            <div class="question-item">
                <span class="q-num">第${q.num}题</span>
                <p style="margin-top:8px">${q.content}</p>
                <p style="margin-top:8px;color:#666;font-size:14px">答案：${q.answer}</p>
            </div>
        `).join('')}
    `;
    
    generateBtn.textContent = '生成练习';
    generateBtn.disabled = false;
});

// 初始化
loadRecords();