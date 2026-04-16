// AICG 短视频剧本生成器 - 主逻辑
// 全局变量
let currentStep = 1;

// 默认模型列表（示例）
const defaultModelList = [
    { id: 'gpt-4o', name: 'GPT-4o', endpoint: '', apiKey: '' },
    { id: 'deepseek-chat', name: 'DeepSeek', endpoint: '', apiKey: '' }
];

// 用户模型列表
let modelList = [...defaultModelList];

// 默认模型ID（用于API调用）
let defaultModelId = null;

// 每个步骤的当前查看版本
let currentVersions = {
    format: 1,
    rewrite: 1,
    storyboard: 1,
    storyboardOpt: 1,
    character: 1,
    keyframe: 1,
    scene: 1
};

// 每个步骤的生成数量（从页面设置读取）
let stepGenerateCount = {
    format: 1,
    rewrite: 1,
    storyboard: 1,
    storyboardOpt: 1,
    character: 1,
    keyframe: 1,
    scene: 1
};

let results = {
    format: [],   // 排版结果数组
    rewrite: [],  // 洗稿结果数组
    storyboard: [], // 分镜结果数组
    storyboardOpt: [], // 优化结果数组
    character: [], // 定妆照结果数组
    keyframe: [],  // 关键帧结果数组
    scene: []      // 场景提示词结果数组
};

// 默认提示词
// 可用占位符：{输入} - 根据下拉选择自动填充
// 也可使用：{原始剧本} {排版结果} {洗稿结果} {分镜结果} {优化分镜} {定妆照} {场景提示词}
const defaultPrompts = {
    format: `你是一个专业的短视频编剧。请将下面的剧本进行排版：

要求：
1. 每个场景用标题标注
2. 每段对话要有说话人标识
3. 添加适当的动作、表情、情绪描述
4. 保持狗血短剧风格
5. 输出格式清晰易读

{输入}`,

    rewrite: `你是一个专业的短视频编剧。请根据下面的剧本进行大改重写：

要求：
1. 保留核心框架和爆点，主线冲突与反转不变
2. 重置所有人物名字，统一人物关系。男主要帅(25-35岁)，女主要漂亮(25-30岁)
3. 整体表达、台词、细节、转场、冲突全部换一种写法
4. 风格贴近微信视频号狗血短剧，情绪强烈，冲突猛烈，反转爽快
5. 逻辑顺畅，人物动机合理，前后衔接自然
6. 保留产品植入位置和功能作用，产品话术重新写
7. 字数尽量贴近原文
8. 直接输出完整改写版，不要解释和分析

{输入}`,

    storyboard: `你是一个专业的视频分镜师。请根据剧本，每15秒生成4-5个分镜：

要求：
1. 用 "1-1"、"1-2" 等形式区分
2. 详细描述镜头类型、人物动作、表情、情绪
3. 考虑黄金3秒原则
4. 每段开头添加具体场景描述

{输入}`,

    storyboardOpt: `请按照模板优化分镜：

要求：
1. 每个片段开头加上： "(生成视频不带字幕，生成视频不带 bgm 背景音乐，适当切镜，场景为{场景名}，人物为{人物列表})"
2. 镜头描述使用方括号括起来
3. 人物对话添加表情和动作描述

{输入}`,

    character: `你是一个国际知名定妆照摄影师。请根据下面的内容，生成所有主要人物的定妆照提示词：

要求：
1. 为每个主要角色生成全身定妆照提示词
2. 描述要详细：包括自然妆、发型、身高、服装质感等
3. 背景：纯色背景，影棚效果
4. 光影：根据角色特点选择柔光、强光、侧光、逆光等
5. 质量要求：写实，8k，超高清
6. 男主要帅(25-35岁)，女主要漂亮(25-30岁)

{输入}`,

    keyframe: `你是一个专业的动画分镜师。请为关键场景生成单帧分镜提示词：

要求：
1. 描述画面构图、人物位置、动作表情
2. 描述灯光效果和氛围
3. 描述画面细节和质感
4. 符合电影级构图，写实风格，8k超高清

{输入}`,

    scene: `你是一个专业的场景设计师。请根据下面的内容，为每个主要场景生成AI绘画提示词：

要求：
1. 识别剧本中的所有主要场景（室内、室外、白天、夜晚）
2. 为每个场景生成详细的视觉描述
3. 包含：场景类型、时间、光线、氛围、色调、道具布置
4. 适合AI绘画的英文提示词格式
5. 风格：写实风格，电影级画质，8k超高清

{输入}`
};

// 用户自定义提示词
let customPrompts = { ...defaultPrompts };

// DOM 元素
const elements = {
    inputScript: null,
    outputRewrite: null,
    outputFormat: null,
    outputStoryboard: null,
    outputStoryboardOpt: null,
    outputCharacter: null,
    outputKeyframe: null,
    outputScene: null,
    btnRunAll: null,
    btnRunStep: null,
    btnReset: null,
    btnCopy: null,
    btnDownload: null,
    btnExample: null,
    btnClearInput: null,
    processItems: null,
    tabBtns: null,
    tabContents: null,
    modelSelect: null,
    statusIndicator: null,
    progressStatus: null,
    apiStatus: null,
    modal: null,
    modalTitle: null,
    modalBody: null
};

// 初始化函数
function init() {
    // 获取DOM元素
    cacheElements();
    
    // 绑定事件
    bindEvents();

    // 初始化本地存储
    loadSettings();

    // 更新输入字数
    updateInputLength();

    // 更新 API 状态显示（不自动测试连接）
    updateApiStatusDisplay();

    console.log('AICG 短视频剧本生成器初始化完成');
}

// 缓存DOM元素
function cacheElements() {
    elements.inputScript = document.getElementById('input-script');
    elements.outputRewrite = document.getElementById('output-rewrite');
    elements.outputFormat = document.getElementById('output-format');
    elements.outputStoryboard = document.getElementById('output-storyboard');
    elements.outputStoryboardOpt = document.getElementById('output-storyboard-opt');
    elements.outputCharacter = document.getElementById('output-character');
    elements.outputKeyframe = document.getElementById('output-keyframe');
    elements.outputScene = document.getElementById('output-scene');

    elements.btnCopy = document.getElementById('btn-copy');
    elements.btnDownload = document.getElementById('btn-download');
    elements.btnExample = document.getElementById('btn-example');
    elements.btnClearInput = document.getElementById('btn-clear-input');

    elements.tabBtns = document.querySelectorAll('.tab-btn');
    elements.tabContents = document.querySelectorAll('.tab-content');

    elements.modelSelect = document.getElementById('model-select');

    elements.statusIndicator = document.getElementById('status-indicator');
    elements.progressStatus = document.getElementById('progress-status');
    elements.apiStatus = document.getElementById('api-status');

    elements.modal = document.getElementById('modal');
    elements.modalTitle = document.getElementById('modal-title');
    elements.modalBody = document.getElementById('modal-body');
}

// 绑定事件
function bindEvents() {
    // 输入区域
    elements.inputScript.addEventListener('input', updateInputLength);
    elements.btnClearInput.addEventListener('click', clearInput);
    elements.btnExample.addEventListener('click', loadExample);

    // 剧本保存和加载
    document.getElementById('btn-save-script').addEventListener('click', saveScript);
    document.getElementById('btn-load-script').addEventListener('click', showScriptManager);

    // 复制和下载
    elements.btnCopy.addEventListener('click', copyAllResults);
    elements.btnDownload.addEventListener('click', downloadResults);

    // 标签页切换
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            showTab(tabId);
        });
    });

    // 提示词编辑区域切换
    document.querySelectorAll('.prompt-step-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const step = btn.dataset.promptStep;
            showPromptEditor(step);
        });
    });

    // 单步执行按钮
    document.querySelectorAll('.btn-run-step').forEach(btn => {
        btn.addEventListener('click', () => {
            const step = parseInt(btn.dataset.step);
            currentStep = step;
            // 切换到对应的提示词编辑器和结果标签页
            showPromptEditor(step);
            showTab(step);
            // 执行该步骤
            runCurrentStep();
        });
    });

    // 提示词保存和管理
    document.getElementById('btn-save-prompt').addEventListener('click', savePrompts);
    document.getElementById('btn-reset-prompt').addEventListener('click', resetPrompts);
    document.getElementById('btn-manage-prompts').addEventListener('click', showPromptManager);

    // 提示词导入/导出
    document.getElementById('btn-export-prompts').addEventListener('click', exportPromptsToFile);
    document.getElementById('btn-import-prompts').addEventListener('click', () => {
        document.getElementById('import-prompts-file').click();
    });
    document.getElementById('import-prompts-file').addEventListener('change', importPromptsFromFile);

    // API 设置
    document.getElementById('btn-save-settings').addEventListener('click', saveSettings);

    // 默认模型选择器
    document.getElementById('default-model-select').addEventListener('change', (e) => {
        defaultModelId = e.target.value;
    });

    // 模态框
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.getElementById('btn-help').addEventListener('click', showHelp);
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) closeModal();
    });

    // API 状态栏点击测试连接
    elements.apiStatus.addEventListener('click', testApiConnectionManual);
    elements.apiStatus.style.cursor = 'pointer';
    elements.apiStatus.title = '点击测试 API 连接';

    // 暗色/亮色模式切换
    document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);

    // 版本切换事件
    bindVersionEvents();

    // 输出框内容变化时同步到 results（支持手动编辑）
    bindOutputSyncEvents();

    // 设置面板展开/收起
    document.getElementById('btn-settings-toggle').addEventListener('click', toggleSettingsPanel);
    document.getElementById('btn-settings-close').addEventListener('click', () => toggleSettingsPanel(false));

    // 添加模型按钮
    document.getElementById('btn-add-model')?.addEventListener('click', addNewModel);

    // 初始化提示词
    loadPrompts();
}

// 设置面板展开/收起
function toggleSettingsPanel(show) {
    const panel = document.getElementById('settings-panel');
    const btn = document.getElementById('btn-settings-toggle');

    if (show === undefined) {
        show = panel.classList.contains('collapsed');
    }

    if (show) {
        panel.classList.remove('collapsed');
        btn.classList.add('active');
    } else {
        panel.classList.add('collapsed');
        btn.classList.remove('active');
    }
}

// 提示词编辑相关函数
function showPromptEditor(step) {
    // 确保 step 是字符串
    step = String(step);

    // 更新按钮状态
    document.querySelectorAll('.prompt-step-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.promptStep === step);
    });

    // 更新编辑器显示
    document.querySelectorAll('.prompt-editor').forEach(editor => {
        editor.classList.toggle('active', editor.id === `prompt-editor-${step}`);
    });
}

function savePrompts() {
    const prompts = {
        rewrite: document.getElementById('prompt-rewrite').value,
        format: document.getElementById('prompt-format').value,
        storyboard: document.getElementById('prompt-storyboard').value,
        storyboardOpt: document.getElementById('prompt-storyboard-opt').value,
        character: document.getElementById('prompt-character').value,
        keyframe: document.getElementById('prompt-keyframe').value,
        scene: document.getElementById('prompt-scene').value,
        // 保存输入来源设置
        inputSources: {
            format: document.getElementById('input-format')?.value || 'input',
            rewrite: document.getElementById('input-rewrite')?.value || 'format',
            storyboard: document.getElementById('input-storyboard')?.value || 'rewrite',
            storyboardOpt: document.getElementById('input-storyboard-opt')?.value || 'storyboard',
            character: document.getElementById('input-character')?.value || 'storyboardOpt',
            keyframe: document.getElementById('input-keyframe')?.value || 'storyboardOpt',
            scene: document.getElementById('input-scene')?.value || 'storyboardOpt'
        }
    };

    customPrompts = { ...prompts };
    localStorage.setItem('aicg_custom_prompts', JSON.stringify(prompts));
    showToast('提示词已保存到当前会话', 'success');
}

// 保存提示词到本地存储列表
function savePromptToLibrary() {
    const name = prompt('请输入提示词方案名称：');
    if (!name) return;

    const prompts = {
        rewrite: document.getElementById('prompt-rewrite').value,
        format: document.getElementById('prompt-format').value,
        storyboard: document.getElementById('prompt-storyboard').value,
        storyboardOpt: document.getElementById('prompt-storyboard-opt').value,
        character: document.getElementById('prompt-character').value,
        keyframe: document.getElementById('prompt-keyframe').value,
        scene: document.getElementById('prompt-scene').value,
        // 保存输入来源设置
        inputSources: {
            format: document.getElementById('input-format')?.value || 'input',
            rewrite: document.getElementById('input-rewrite')?.value || 'format',
            storyboard: document.getElementById('input-storyboard')?.value || 'rewrite',
            storyboardOpt: document.getElementById('input-storyboard-opt')?.value || 'storyboard',
            character: document.getElementById('input-character')?.value || 'storyboardOpt',
            keyframe: document.getElementById('input-keyframe')?.value || 'storyboardOpt',
            scene: document.getElementById('input-scene')?.value || 'storyboardOpt'
        },
        timestamp: new Date().toISOString()
    };

    // 获取已保存的提示词列表
    let promptLibrary = JSON.parse(localStorage.getItem('aicg_prompt_library') || '{}');
    promptLibrary[name] = prompts;
    localStorage.setItem('aicg_prompt_library', JSON.stringify(promptLibrary));

    showToast(`提示词方案 "${name}" 已保存`, 'success');
}

// 显示提示词管理器
function showPromptManager() {
    const promptLibrary = JSON.parse(localStorage.getItem('aicg_prompt_library') || '{}');
    const savedNames = Object.keys(promptLibrary);

    let listHtml = '';
    if (savedNames.length === 0) {
        listHtml = '<p style="color: #94a3b8; text-align: center; padding: 20px;">暂无保存的提示词方案</p>';
    } else {
        listHtml = savedNames.map(name => {
            const item = promptLibrary[name];
            const date = new Date(item.timestamp).toLocaleString();
            return `
                <div class="prompt-library-item" data-name="${name}" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; margin: 8px 0; background: rgba(0,0,0,0.2); border: 1px solid var(--dark-border); border-radius: 6px;">
                    <div>
                        <strong style="color: var(--primary-color);">${name}</strong>
                        <small style="display: block; color: #94a3b8; font-size: 0.75rem;">${date}</small>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-load-prompt-lib btn-secondary" data-name="${name}" style="padding: 4px 10px; font-size: 0.8rem;">加载</button>
                        <button class="btn-delete-prompt-lib btn-danger" data-name="${name}" style="padding: 4px 10px; font-size: 0.8rem;">删除</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    elements.modalTitle.textContent = '提示词管理';
    elements.modalBody.innerHTML = `
        <div style="margin-bottom: 15px;">
            <button id="btn-save-prompt-lib" class="btn-primary" style="width: 100%;">
                <i class="fas fa-plus"></i> 保存当前提示词为新方案
            </button>
        </div>
        <h4 style="margin: 15px 0 10px; color: var(--dark-text);">已保存的方案</h4>
        <div style="max-height: 300px; overflow-y: auto;">${listHtml}</div>
    `;

    elements.modal.classList.add('active');

    // 绑定保存按钮
    document.getElementById('btn-save-prompt-lib').onclick = () => {
        closeModal();
        savePromptToLibrary();
    };

    // 绑定加载按钮
    document.querySelectorAll('.btn-load-prompt-lib').forEach(btn => {
        btn.onclick = () => {
            const name = btn.dataset.name;
            loadPromptFromLibrary(name);
            closeModal();
        };
    });

    // 绑定删除按钮
    document.querySelectorAll('.btn-delete-prompt-lib').forEach(btn => {
        btn.onclick = () => {
            const name = btn.dataset.name;
            if (confirm(`确定要删除方案 "${name}" 吗？`)) {
                deletePromptFromLibrary(name);
                showPromptManager(); // 刷新列表
            }
        };
    });
}

// 从方案库加载提示词
function loadPromptFromLibrary(name) {
    const promptLibrary = JSON.parse(localStorage.getItem('aicg_prompt_library') || '{}');
    const prompts = promptLibrary[name];

    if (prompts) {
        document.getElementById('prompt-rewrite').value = prompts.rewrite || '';
        document.getElementById('prompt-format').value = prompts.format || '';
        document.getElementById('prompt-storyboard').value = prompts.storyboard || '';
        document.getElementById('prompt-storyboard-opt').value = prompts.storyboardOpt || '';
        document.getElementById('prompt-character').value = prompts.character || '';
        document.getElementById('prompt-keyframe').value = prompts.keyframe || '';
        document.getElementById('prompt-scene').value = prompts.scene || '';

        // 加载输入来源设置
        if (prompts.inputSources) {
            const setInputValue = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.value = value;
            };
            setInputValue('input-format', prompts.inputSources.format || 'input');
            setInputValue('input-rewrite', prompts.inputSources.rewrite || 'format');
            setInputValue('input-storyboard', prompts.inputSources.storyboard || 'rewrite');
            setInputValue('input-storyboard-opt', prompts.inputSources.storyboardOpt || 'storyboard');
            setInputValue('input-character', prompts.inputSources.character || 'storyboardOpt');
            setInputValue('input-keyframe', prompts.inputSources.keyframe || 'storyboardOpt');
            setInputValue('input-scene', prompts.inputSources.scene || 'storyboardOpt');
        }

        customPrompts = { ...prompts };
        showToast(`已加载提示词方案 "${name}"`, 'success');
    }
}

// 删除提示词方案
function deletePromptFromLibrary(name) {
    let promptLibrary = JSON.parse(localStorage.getItem('aicg_prompt_library') || '{}');
    delete promptLibrary[name];
    localStorage.setItem('aicg_prompt_library', JSON.stringify(promptLibrary));
    showToast(`已删除方案 "${name}"`, 'success');
}

function resetPrompts() {
    if (confirm('确定要恢复默认提示词吗？')) {
        customPrompts = { ...defaultPrompts };
        localStorage.removeItem('aicg_custom_prompts');
        loadPrompts();
        showToast('已恢复默认提示词', 'success');
    }
}

// 导出所有提示词到JSON文件
function exportPromptsToFile() {
    const promptLibrary = JSON.parse(localStorage.getItem('aicg_prompt_library') || '{}');
    const currentPrompts = {
        rewrite: document.getElementById('prompt-rewrite').value,
        format: document.getElementById('prompt-format').value,
        storyboard: document.getElementById('prompt-storyboard').value,
        storyboardOpt: document.getElementById('prompt-storyboard-opt').value,
        character: document.getElementById('prompt-character').value,
        keyframe: document.getElementById('prompt-keyframe').value,
        scene: document.getElementById('prompt-scene').value,
        inputSources: {
            format: document.getElementById('input-format')?.value || 'input',
            rewrite: document.getElementById('input-rewrite')?.value || 'format',
            storyboard: document.getElementById('input-storyboard')?.value || 'rewrite',
            storyboardOpt: document.getElementById('input-storyboard-opt')?.value || 'storyboard',
            character: document.getElementById('input-character')?.value || 'storyboardOpt',
            keyframe: document.getElementById('input-keyframe')?.value || 'storyboardOpt',
            scene: document.getElementById('input-scene')?.value || 'storyboardOpt'
        }
    };

    const exportData = {
        version: '1.0',
        exportTime: new Date().toISOString(),
        currentPrompts: currentPrompts,
        promptLibrary: promptLibrary
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aicg_prompts_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('提示词已导出到文件', 'success');
}

// 从JSON文件导入提示词
function importPromptsFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            // 验证格式
            if (!data.currentPrompts && !data.promptLibrary) {
                throw new Error('无效的提示词文件格式');
            }

            // 导入当前提示词
            if (data.currentPrompts) {
                localStorage.setItem('aicg_custom_prompts', JSON.stringify(data.currentPrompts));
                customPrompts = { ...defaultPrompts, ...data.currentPrompts };
            }

            // 导入提示词库
            if (data.promptLibrary && Object.keys(data.promptLibrary).length > 0) {
                const existingLibrary = JSON.parse(localStorage.getItem('aicg_prompt_library') || '{}');
                // 合并，同名覆盖
                const mergedLibrary = { ...existingLibrary, ...data.promptLibrary };
                localStorage.setItem('aicg_prompt_library', JSON.stringify(mergedLibrary));
            }

            loadPrompts();
            showToast(`成功导入提示词配置`, 'success');
        } catch (err) {
            showToast('导入失败：' + err.message, 'error');
        }
    };
    reader.readAsText(file);
    // 清除文件选择，允许重复选择同一文件
    event.target.value = '';
}

function loadPrompts() {
    // 先尝试加载自定义提示词
    const saved = localStorage.getItem('aicg_custom_prompts');
    if (saved) {
        try {
            const prompts = JSON.parse(saved);
            customPrompts = { ...defaultPrompts, ...prompts };
        } catch (e) {
            console.error('加载提示词失败:', e);
        }
    } else {
        // 如果没有保存过，使用默认提示词
        customPrompts = { ...defaultPrompts };
    }

    // 填充到编辑框
    document.getElementById('prompt-rewrite').value = customPrompts.rewrite;
    document.getElementById('prompt-format').value = customPrompts.format;
    document.getElementById('prompt-storyboard').value = customPrompts.storyboard;
    document.getElementById('prompt-storyboard-opt').value = customPrompts.storyboardOpt;
    document.getElementById('prompt-character').value = customPrompts.character;
    document.getElementById('prompt-keyframe').value = customPrompts.keyframe;
    document.getElementById('prompt-scene').value = customPrompts.scene || defaultPrompts.scene;

    // 加载输入来源设置
    if (customPrompts.inputSources) {
        const setInputValue = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.value = value;
        };
        setInputValue('input-format', customPrompts.inputSources.format || 'input');
        setInputValue('input-rewrite', customPrompts.inputSources.rewrite || 'format');
        setInputValue('input-storyboard', customPrompts.inputSources.storyboard || 'rewrite');
        setInputValue('input-storyboard-opt', customPrompts.inputSources.storyboardOpt || 'storyboard');
        setInputValue('input-character', customPrompts.inputSources.character || 'storyboardOpt');
        setInputValue('input-keyframe', customPrompts.inputSources.keyframe || 'storyboardOpt');
        setInputValue('input-scene', customPrompts.inputSources.scene || 'storyboardOpt');
    }
}

// 剧本保存和加载相关函数
function saveScript() {
    const script = elements.inputScript.value.trim();
    if (!script) {
        showToast('剧本内容为空', 'warning');
        return;
    }

    const name = prompt('请输入剧本名称：');
    if (!name) return;

    // 获取已保存的剧本列表
    let scriptLibrary = JSON.parse(localStorage.getItem('aicg_script_library') || '{}');
    scriptLibrary[name] = {
        content: script,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('aicg_script_library', JSON.stringify(scriptLibrary));

    showToast(`剧本 "${name}" 已保存`, 'success');
}

function showScriptManager() {
    const scriptLibrary = JSON.parse(localStorage.getItem('aicg_script_library') || '{}');
    const savedNames = Object.keys(scriptLibrary);

    let listHtml = '';
    if (savedNames.length === 0) {
        listHtml = '<p style="color: #94a3b8; text-align: center; padding: 20px;">暂无保存的剧本</p>';
    } else {
        listHtml = savedNames.map(name => {
            const item = scriptLibrary[name];
            const date = new Date(item.timestamp).toLocaleString();
            const preview = (item.content || '').substring(0, 50).replace(/\n/g, ' ');
            return `
                <div class="script-library-item" data-name="${name}" style="padding: 10px; margin: 8px 0; background: rgba(0,0,0,0.2); border: 1px solid var(--dark-border); border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: var(--primary-color);">${name}</strong>
                            <small style="display: block; color: #94a3b8; font-size: 0.75rem;">${date}</small>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-load-script-lib btn-secondary" data-name="${name}" style="padding: 4px 10px; font-size: 0.8rem;">加载</button>
                            <button class="btn-delete-script-lib btn-danger" data-name="${name}" style="padding: 4px 10px; font-size: 0.8rem;">删除</button>
                        </div>
                    </div>
                    <div style="margin-top: 8px; font-size: 0.8rem; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${preview}...
                    </div>
                </div>
            `;
        }).join('');
    }

    elements.modalTitle.textContent = '剧本管理';
    elements.modalBody.innerHTML = `
        <h4 style="margin: 0 0 10px; color: var(--dark-text);">已保存的剧本</h4>
        <div style="max-height: 350px; overflow-y: auto;">${listHtml}</div>
    `;

    elements.modal.classList.add('active');

    // 绑定加载按钮
    document.querySelectorAll('.btn-load-script-lib').forEach(btn => {
        btn.onclick = () => {
            const name = btn.dataset.name;
            loadScriptFromLibrary(name);
            closeModal();
        };
    });

    // 绑定删除按钮
    document.querySelectorAll('.btn-delete-script-lib').forEach(btn => {
        btn.onclick = () => {
            const name = btn.dataset.name;
            if (confirm(`确定要删除剧本 "${name}" 吗？`)) {
                deleteScriptFromLibrary(name);
                showScriptManager(); // 刷新列表
            }
        };
    });
}

function loadScriptFromLibrary(name) {
    const scriptLibrary = JSON.parse(localStorage.getItem('aicg_script_library') || '{}');
    const item = scriptLibrary[name];

    if (item) {
        elements.inputScript.value = item.content || '';
        updateInputLength();
        showToast(`已加载剧本 "${name}"`, 'success');
    }
}

function deleteScriptFromLibrary(name) {
    let scriptLibrary = JSON.parse(localStorage.getItem('aicg_script_library') || '{}');
    delete scriptLibrary[name];
    localStorage.setItem('aicg_script_library', JSON.stringify(scriptLibrary));
    showToast(`已删除剧本 "${name}"`, 'success');
}

// 获取步骤对应的提示词
function getPrompt(step) {
    const stepMap = {
        1: 'format',      // 排版
        2: 'rewrite',     // 洗稿
        3: 'storyboard',  // 分镜
        4: 'storyboardOpt', // 优化
        5: 'character',   // 定妆照
        6: 'keyframe',    // 关键帧
        7: 'scene'        // 场景
    };
    return customPrompts[stepMap[step]] || defaultPrompts[stepMap[step]];
}

// 替换提示词中的占位符
// onlyIfHasResult: 如果为 true，则只替换有结果的位置符，无结果时替换为空
function replacePromptPlaceholders(promptTemplate, onlyIfHasResult = false) {
    const script = elements.inputScript.value.trim();

    // 获取各步骤的结果
    const getResult = (arr) => {
        if (arr && arr.length > 0) {
            return arr.join('\n\n---\n\n');
        }
        return '';
    };

    const replacements = {
        '{原始剧本}': script,
        '{排版结果}': getResult(results.format),
        '{洗稿结果}': getResult(results.rewrite),
        '{分镜结果}': getResult(results.storyboard),
        '{优化分镜}': getResult(results.storyboardOpt),
        '{定妆照}': getResult(results.character),
        '{场景提示词}': getResult(results.scene)
    };

    let prompt = promptTemplate;
    for (const [placeholder, value] of Object.entries(replacements)) {
        if (onlyIfHasResult) {
            // 只替换有结果的，无结果时替换为空字符串
            prompt = prompt.split(placeholder).join(value || '');
        } else {
            prompt = prompt.split(placeholder).join(value || '[暂无内容，请先执行对应步骤]');
        }
    }

    return prompt;
}

// 根据步骤获取用户选择的输入内容
function getInputByStep(step) {
    const script = elements.inputScript.value.trim();

    // 步骤对应的输入来源选择器ID
    const inputSelectIds = {
        1: 'input-format',
        2: 'input-rewrite',
        3: 'input-storyboard',
        4: 'input-storyboard-opt',
        5: 'input-character',
        6: 'input-keyframe',
        7: 'input-scene'
    };

    // 输入来源对应的结果获取函数
    const getInputContent = (source) => {
        switch(source) {
            case 'input':
                return script;
            case 'format':
                return results.format.length > 0 ? results.format[currentVersions.format - 1] || results.format[0] : '';
            case 'rewrite':
                return results.rewrite.length > 0 ? results.rewrite[currentVersions.rewrite - 1] || results.rewrite[0] : '';
            case 'storyboard':
                return results.storyboard.length > 0 ? results.storyboard[currentVersions.storyboard - 1] || results.storyboard[0] : '';
            case 'storyboardOpt':
                return results.storyboardOpt.length > 0 ? results.storyboardOpt[currentVersions.storyboardOpt - 1] || results.storyboardOpt[0] : '';
            case 'character':
                return results.character.length > 0 ? results.character[currentVersions.character - 1] || results.character[0] : '';
            case 'keyframe':
                return results.keyframe.length > 0 ? results.keyframe[currentVersions.keyframe - 1] || results.keyframe[0] : '';
            case 'scene':
                return results.scene.length > 0 ? results.scene[currentVersions.scene - 1] || results.scene[0] : '';
            default:
                return script;
        }
    };

    const selectEl = document.getElementById(inputSelectIds[step]);
    if (!selectEl) {
        return script; // 默认返回原始剧本
    }

    return getInputContent(selectEl.value);
}

// 根据步骤构建最终提示词（用输入内容替换占位符）
function buildPromptForStep(step) {
    let promptTemplate = getPrompt(step);
    const inputContent = getInputByStep(step);

    // 直接用输入内容替换 {输入} 占位符
    let prompt = promptTemplate;
    prompt = prompt.replace(/{输入}/g, inputContent || '[暂无内容，请先执行前置步骤]');

    // 同时替换其他占位符（兼容旧模板），但只在有结果时替换
    prompt = replacePromptPlaceholders(prompt, true);

    return prompt;
}

// 更新输入字数
function updateInputLength() {
    const length = elements.inputScript.value.length;
    document.getElementById('input-length').textContent = `${length} 字`;
}

// 清空输入
function clearInput() {
    elements.inputScript.value = '';
    updateInputLength();
}

// 加载示例
function loadExample() {
    const exampleScript = `老李，咱老家亲戚群里，现在都在传闲话，说厂里资金出问题，还有查封的不实消息，也不知道是谁乱往外说的，搞得大家都瞎猜疑。

"别查了，那闲话是我自己找人放的。"
"你疯了，这种玩笑能随便开吗？明天那些供货商能把咱家大⻔给拆了。"

秀兰，这几年咱们厂子越做越大，可这身边围着的亲戚到底是人是⻤，咱俩根本分不清。我就想借着这次机会刚好清理一下⻔戶，咱们就对外哭穷，说外面欠了一百万的死债，要去借钱，看看谁会念旧情伸出援手。

"行，那咱们先去我亲哥大军那儿，他当年赌钱欠债快，被人打死了，是你掏了三十万，帮他把现在的建材店开起来的。他亲妹妹有难，他肯定得......"`;

    elements.inputScript.value = exampleScript;
    updateInputLength();
    showToast('示例剧本已加载', 'success');
}

// 显示标签页
function showTab(tab) {
    // 如果是数字，转换为对应的标签页ID
    let tabId = tab;
    if (typeof tab === 'number') {
        tabId = `tab-${tab}`;
    }

    // 更新标签按钮
    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // 更新标签内容
    elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });
}

// 更新输出显示（单个步骤）
function updateOutputDisplay(step) {
    const idx = (currentVersions[step] || 1) - 1;
    const actualCount = results[step] ? results[step].length : 0;
    const count = Math.max(actualCount, stepGenerateCount[step]);

    switch(step) {
        case 'format':
            elements.outputFormat.value = results.format[idx] || '';
            break;
        case 'rewrite':
            elements.outputRewrite.value = results.rewrite[idx] || '';
            break;
        case 'storyboard':
            elements.outputStoryboard.value = results.storyboard[idx] || '';
            break;
        case 'storyboardOpt':
            elements.outputStoryboardOpt.value = results.storyboardOpt[idx] || '';
            break;
        case 'character':
            elements.outputCharacter.value = results.character[idx] || '';
            break;
        case 'keyframe':
            elements.outputKeyframe.value = results.keyframe[idx] || '';
            break;
        case 'scene':
            elements.outputScene.value = results.scene[idx] || '';
            break;
    }

    // 更新版本显示
    updateVersionInfo(step, idx, count);

    // 更新标签页上的数量显示
    const tabCount = document.querySelector(`.tab-count[data-for="${step}"]`);
    if (tabCount) {
        if (actualCount > 1) {
            tabCount.textContent = `(${actualCount})`;
        } else {
            tabCount.textContent = '';
        }
    }
}

// 更新所有输出显示
function updateAllOutputDisplay() {
    updateOutputDisplay('format');
    updateOutputDisplay('rewrite');
    updateOutputDisplay('storyboard');
    updateOutputDisplay('storyboardOpt');
    updateOutputDisplay('character');
    updateOutputDisplay('keyframe');
    updateOutputDisplay('scene');
}

// 更新版本信息显示
function updateVersionInfo(step, idx, count) {
    const versionInfo = document.querySelector(`.version-info[data-for="${step}"]`);
    if (versionInfo) {
        versionInfo.textContent = `${idx + 1}/${count}`;
    }

    // 更新按钮状态
    const btnPrev = document.querySelector(`.btn-prev[data-for="${step}"]`);
    const btnNext = document.querySelector(`.btn-next[data-for="${step}"]`);
    if (btnPrev) btnPrev.disabled = idx <= 0;
    if (btnNext) btnNext.disabled = idx >= count - 1;
}

// 更新所有版本选择器
function updateAllVersionSelectors() {
    const steps = ['format', 'rewrite', 'storyboard', 'storyboardOpt', 'character', 'keyframe', 'scene'];
    steps.forEach(step => {
        const header = document.querySelector(`.output-header[data-for="${step}"]`);
        const actualCount = results[step] ? results[step].length : 0;
        const count = Math.max(actualCount, stepGenerateCount[step]);

        if (header && count > 1) {
            header.classList.add('active');
        } else if (header) {
            header.classList.remove('active');
        }

        updateVersionInfo(step, 0, count);
    });
}

// 切换版本
function switchVersion(step, direction) {
    const actualCount = results[step] ? results[step].length : 0;
    const count = Math.max(actualCount, stepGenerateCount[step]);
    let newVersion = currentVersions[step] + direction;

    if (newVersion < 1) newVersion = 1;
    if (newVersion > count) newVersion = count;

    currentVersions[step] = newVersion;
    updateOutputDisplay(step);
}

// 绑定版本切换事件
function bindVersionEvents() {
    document.querySelectorAll('.version-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const step = btn.dataset.for;
            const direction = btn.classList.contains('btn-prev') ? -1 : 1;
            switchVersion(step, direction);
        });
    });
}

// 绑定输出框内容同步事件（支持手动编辑）
function bindOutputSyncEvents() {
    const outputMap = {
        'output-format': 'format',
        'output-rewrite': 'rewrite',
        'output-storyboard': 'storyboard',
        'output-storyboard-opt': 'storyboardOpt',
        'output-character': 'character',
        'output-keyframe': 'keyframe',
        'output-scene': 'scene'
    };

    Object.entries(outputMap).forEach(([elementId, stepName]) => {
        const el = document.getElementById(elementId);
        if (el) {
            el.addEventListener('input', () => {
                // 获取当前版本索引
                const idx = (currentVersions[stepName] || 1) - 1;
                // 确保 results 数组有足够的空间
                if (!results[stepName]) {
                    results[stepName] = [];
                }
                // 如果数组为空或当前版本超出数组长度，添加新条目
                while (results[stepName].length <= idx) {
                    results[stepName].push('');
                }
                // 同步内容
                results[stepName][idx] = el.value;
            });
        }
    });
}

// 运行当前步骤
async function runCurrentStep() {
    // 检查当前步骤的输入内容是否存在
    const inputContent = getInputByStep(currentStep);
    if (!inputContent || inputContent.trim() === '') {
        const stepNames = {
            1: '排版', 2: '洗稿', 3: '分镜', 4: '优化', 5: '定妆照', 6: '关键帧', 7: '场景'
        };
        const inputSelectId = {
            1: 'input-format', 2: 'input-rewrite', 3: 'input-storyboard',
            4: 'input-storyboard-opt', 5: 'input-character', 6: 'input-keyframe', 7: 'input-scene'
        };
        const selectEl = document.getElementById(inputSelectId[currentStep]);
        const sourceName = selectEl ? selectEl.options[selectEl.selectedIndex]?.text : '输入来源';
        const sourceValue = selectEl ? selectEl.value : '';

        // 自动切换到对应的输入源标签页
        if (sourceValue && sourceValue !== 'input') {
            // 输入来源是某个步骤的结果，切换到对应的标签页
            const tabMap = {
                'format': 1, 'rewrite': 2, 'storyboard': 3,
                'storyboardOpt': 4, 'character': 5, 'keyframe': 6, 'scene': 7
            };
            const tabIndex = tabMap[sourceValue];
            if (tabIndex) {
                showTab(tabIndex);
            }
        }

        showModal('错误', `输入内容为空，请检查"${sourceName}"是否有内容`);
        return;
    }

    if (!validateApiKey()) {
        showModal('错误', '请先设置有效的 OpenAI API Key');
        return;
    }

    // 读取生成数量设置
    stepGenerateCount.format = 1;
    stepGenerateCount.rewrite = parseInt(document.getElementById('count-rewrite')?.value || '1');
    stepGenerateCount.storyboard = parseInt(document.getElementById('count-storyboard')?.value || '1');
    stepGenerateCount.storyboardOpt = parseInt(document.getElementById('count-storyboard-opt')?.value || '1');
    stepGenerateCount.character = parseInt(document.getElementById('count-character')?.value || '1');
    stepGenerateCount.keyframe = 1;
    stepGenerateCount.scene = 1;

    setStatus('processing', '正在处理...');

    try {
        switch(currentStep) {
            case 1: // 排版
                elements.progressStatus.textContent = '正在排版...';
                results.format = [];
                const formatResult = await runFormatStep();
                results.format.push(formatResult);
                break;

            case 2: // 洗稿
                results.rewrite = [];
                for (let i = 0; i < stepGenerateCount.rewrite; i++) {
                    elements.progressStatus.textContent = `正在洗稿 ${i + 1}/${stepGenerateCount.rewrite}...`;
                    const rewriteResult = await runRewriteStep();
                    results.rewrite.push(rewriteResult);
                    if (i < stepGenerateCount.rewrite - 1) {
                        elements.outputRewrite.value = '';
                    }
                }
                currentVersions.rewrite = 1;
                updateAllVersionSelectors();
                break;

            case 3: // 分镜
                results.storyboard = [];
                for (let i = 0; i < stepGenerateCount.storyboard; i++) {
                    elements.progressStatus.textContent = `正在生成分镜 ${i + 1}/${stepGenerateCount.storyboard}...`;
                    const storyboardResult = await runStoryboardStep();
                    results.storyboard.push(storyboardResult);
                    if (i < stepGenerateCount.storyboard - 1) {
                        elements.outputStoryboard.value = '';
                    }
                }
                currentVersions.storyboard = 1;
                updateAllVersionSelectors();
                break;

            case 4: // 优化
                results.storyboardOpt = [];
                for (let i = 0; i < stepGenerateCount.storyboardOpt; i++) {
                    elements.progressStatus.textContent = `正在优化分镜 ${i + 1}/${stepGenerateCount.storyboardOpt}...`;
                    const storyboardOptResult = await runStoryboardOptStep();
                    results.storyboardOpt.push(storyboardOptResult);
                    if (i < stepGenerateCount.storyboardOpt - 1) {
                        elements.outputStoryboardOpt.value = '';
                    }
                }
                currentVersions.storyboardOpt = 1;
                updateAllVersionSelectors();
                break;

            case 5: // 定妆照
                results.character = [];
                for (let i = 0; i < stepGenerateCount.character; i++) {
                    elements.progressStatus.textContent = `正在生成定妆照 ${i + 1}/${stepGenerateCount.character}...`;
                    const characterResult = await runCharacterStep();
                    results.character.push(characterResult);
                    if (i < stepGenerateCount.character - 1) {
                        elements.outputCharacter.value = '';
                    }
                }
                currentVersions.character = 1;
                updateAllVersionSelectors();
                break;

            case 6: // 关键帧
                elements.progressStatus.textContent = '正在生成关键帧提示词...';
                const keyframeResult = await runKeyframeStep();
                results.keyframe = [keyframeResult];
                break;

            case 7: // 场景提示词
                elements.progressStatus.textContent = '正在生成场景提示词...';
                const sceneResult = await runSceneStep();
                results.scene = [sceneResult];
                break;
        }

        setStatus('idle', '步骤完成');
        elements.progressStatus.textContent = '步骤完成';
        showToast(`步骤 ${currentStep} 完成`, 'success');

    } catch (error) {
        console.error('处理过程中出错:', error);
        setStatus('error', '处理失败');
        elements.progressStatus.textContent = '处理失败';
        showModal('错误', `处理过程中出错: ${error.message}`);
    }
}

// 复制所有结果
function copyAllResults() {
    const formatResult = results.format[0] || '';
    const rewriteResult = results.rewrite.join('\n\n--- 洗稿版本分隔 ---\n\n');
    const storyboardResult = results.storyboard.join('\n\n--- 分镜版本分隔 ---\n\n');
    const storyboardOptResult = results.storyboardOpt.join('\n\n--- 优化版本分隔 ---\n\n');
    const characterResult = results.character.join('\n\n--- 定妆照版本分隔 ---\n\n');
    const keyframeResult = results.keyframe[0] || '';
    const sceneResult = results.scene[0] || '';

    const allResults = `=== 排版结果 ===\n${formatResult}\n\n=== 洗稿结果 ===\n${rewriteResult}\n\n=== 分镜结果 ===\n${storyboardResult}\n\n=== 优化分镜 ===\n${storyboardOptResult}\n\n=== 人物定妆照 ===\n${characterResult}\n\n=== 关键帧 ===\n${keyframeResult}\n\n=== 场景提示词 ===\n${sceneResult}`;

    navigator.clipboard.writeText(allResults)
        .then(() => showToast('已复制到剪贴板', 'success'))
        .catch(err => showModal('错误', '复制失败: ' + err.message));
}

// 下载结果
function downloadResults() {
    const formatResult = results.format[0] || '';
    const rewriteResult = results.rewrite.join('\n\n--- 洗稿版本分隔 ---\n\n');
    const storyboardResult = results.storyboard.join('\n\n--- 分镜版本分隔 ---\n\n');
    const storyboardOptResult = results.storyboardOpt.join('\n\n--- 优化版本分隔 ---\n\n');
    const characterResult = results.character.join('\n\n--- 定妆照版本分隔 ---\n\n');
    const keyframeResult = results.keyframe[0] || '';
    const sceneResult = results.scene[0] || '';

    const allResults = `=== 排版结果 ===\n${formatResult}\n\n=== 洗稿结果 ===\n${rewriteResult}\n\n=== 分镜结果 ===\n${storyboardResult}\n\n=== 优化分镜 ===\n${storyboardOptResult}\n\n=== 人物定妆照 ===\n${characterResult}\n\n=== 关键帧 ===\n${keyframeResult}\n\n=== 场景提示词 ===\n${sceneResult}`;

    const blob = new Blob([allResults], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aicg剧本生成_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('结果已下载', 'success');
}

// 调用 OpenAI API (流式输出)
// modelConfig: { id, name, endpoint, apiKey } 或字符串模型ID
async function callOpenAIStream(prompt, outputElement, modelConfig, onChunk) {
    // 处理模型配置
    let model, modelEndpoint, modelApiKey;
    if (typeof modelConfig === 'object' && modelConfig !== null) {
        model = modelConfig.id;
        modelEndpoint = modelConfig.endpoint;
        modelApiKey = modelConfig.apiKey;
    } else {
        // 兼容旧的字符串参数
        model = modelConfig || getCurrentModel();
        const config = modelList.find(m => m.id === model);
        modelEndpoint = config ? config.endpoint : '';
        modelApiKey = config ? config.apiKey : '';
    }

    // API 端点必须在模型配置中设置
    if (!modelEndpoint) {
        throw new Error('请先在设置中为该模型配置 API 端点');
    }

    const messages = [{ role: 'user', content: prompt }];

    const headers = {
        'Content-Type': 'application/json'
    };
    // 本地服务可能不需要 API Key
    if (modelApiKey) {
        headers['Authorization'] = `Bearer ${modelApiKey}`;
    }

    // ===== 超时配置 =====
    const REQUEST_TIMEOUT = 300000;     // 请求连接超时：5分钟
    const READ_TIMEOUT = 120000;        // 单次读取超时：2分钟（适应本地推理较慢的情况）
    const IDLE_TIMEOUT = 180000;        // 空闲超时：3分钟无数据则警告

    // 创建 AbortController 用于取消请求
    const controller = new AbortController();
    const requestTimeoutId = setTimeout(() => {
        controller.abort();
    }, REQUEST_TIMEOUT);

    let lastDataTime = Date.now();      // 记录最后一次收到数据的时间
    let fullContent = '';

    try {
        const response = await fetch(modelEndpoint, {
            signal: controller.signal,  // 关联 AbortController
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: model,
                messages: messages,
                stream: true  // 启用流式输出
            })
        });

        clearTimeout(requestTimeoutId); // 连接成功，清除请求超时

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API 请求失败: ${response.status}\n错误: ${errorData.error?.message || '未知错误'}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        // 清空输出元素
        if (outputElement) {
            outputElement.value = '';
        }

        // 空闲超时检测（仅用于日志警告）
        const idleCheckInterval = setInterval(() => {
            const idleTime = Date.now() - lastDataTime;
            if (idleTime > IDLE_TIMEOUT) {
                console.warn(`流式输出空闲超过 ${Math.round(idleTime/1000)} 秒，连接可能已断开`);
            }
        }, 30000); // 每30秒检查一次

        try {
            while (true) {
                // 读取超时控制
                const readPromise = reader.read();
                const readTimeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('读取超时')), READ_TIMEOUT);
                });

                const { done, value } = await Promise.race([readPromise, readTimeoutPromise]);

                if (done) break;

                lastDataTime = Date.now(); // 更新最后数据时间

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const json = JSON.parse(data);
                            const content = json.choices?.[0]?.delta?.content;
                            if (content) {
                                fullContent += content;
                                if (outputElement) {
                                    outputElement.value = fullContent;
                                    // 自动滚动到底部
                                    outputElement.scrollTop = outputElement.scrollHeight;
                                }
                                if (onChunk) {
                                    onChunk(content, fullContent);
                                }
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }
            }
        } finally {
            clearInterval(idleCheckInterval);
        }

        return fullContent;

    } catch (error) {
        clearTimeout(requestTimeoutId);

        // 友好的错误提示
        if (error.name === 'AbortError') {
            throw new Error(`请求超时（${REQUEST_TIMEOUT/1000}秒），请检查网络连接或尝试减少内容长度`);
        } else if (error.message === '读取超时') {
            throw new Error(`流式输出中断，可能是服务器响应超时。已接收内容长度：${fullContent.length} 字符`);
        }
        throw error;
    }
}

// 调用 OpenAI API (非流式，作为备选)
async function callOpenAI(prompt, systemPrompt = null) {
    const model = getCurrentModel();
    const config = modelList.find(m => m.id === model);

    if (!config || !config.endpoint) {
        throw new Error('请先在设置中为该模型配置 API 端点');
    }

    const messages = [];
    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const headers = {
        'Content-Type': 'application/json'
    };
    // 本地服务可能不需要 API Key
    if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            model: model,
            messages: messages
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API 请求失败: ${response.status}\n端点: ${config.endpoint}\n模型: ${model}\n错误: ${errorData.error?.message || '未知错误'}`);
    }

    const data = await response.json();
    console.log('API 返回数据:', data); // 调试用

    // 处理不同的返回格式
    if (data.choices && data.choices[0]) {
        return data.choices[0].message?.content || data.choices[0]?.text || JSON.stringify(data.choices[0]);
    } else if (data.content) {
        return data.content;
    } else if (data.text) {
        return data.text;
    } else if (data.response) {
        return data.response;
    } else {
        // 返回完整数据作为字符串
        return JSON.stringify(data, null, 2);
    }
}

// 步骤函数
// 所有步骤都使用 buildPromptForStep 来构建最终提示词
async function runFormatStep() {
    const prompt = buildPromptForStep(1);
    const modelConfig = getModelConfigForStep(1);
    console.log('排版提示词:', prompt.substring(0, 100));
    return await callOpenAIStream(prompt, elements.outputFormat, modelConfig);
}

async function runRewriteStep() {
    const prompt = buildPromptForStep(2);
    const modelConfig = getModelConfigForStep(2);
    console.log('洗稿提示词:', prompt.substring(0, 100));
    return await callOpenAIStream(prompt, elements.outputRewrite, modelConfig);
}

async function runStoryboardStep() {
    const prompt = buildPromptForStep(3);
    const modelConfig = getModelConfigForStep(3);
    console.log('分镜提示词:', prompt.substring(0, 100));
    return await callOpenAIStream(prompt, elements.outputStoryboard, modelConfig);
}

async function runStoryboardOptStep() {
    const prompt = buildPromptForStep(4);
    const modelConfig = getModelConfigForStep(4);
    console.log('优化提示词:', prompt.substring(0, 100));
    return await callOpenAIStream(prompt, elements.outputStoryboardOpt, modelConfig);
}

async function runCharacterStep() {
    const prompt = buildPromptForStep(5);
    const modelConfig = getModelConfigForStep(5);
    console.log('定妆照提示词:', prompt.substring(0, 100));
    return await callOpenAIStream(prompt, elements.outputCharacter, modelConfig);
}

async function runKeyframeStep() {
    const prompt = buildPromptForStep(6);
    const modelConfig = getModelConfigForStep(6);
    console.log('关键帧提示词:', prompt.substring(0, 100));
    return await callOpenAIStream(prompt, elements.outputKeyframe, modelConfig);
}

async function runSceneStep() {
    const prompt = buildPromptForStep(7);
    const modelConfig = getModelConfigForStep(7);
    console.log('场景提示词:', prompt.substring(0, 100));
    return await callOpenAIStream(prompt, elements.outputScene, modelConfig);
}

// 设置相关函数
function validateApiKey() {
    // 检查是否有模型配置了 API Key
    return modelList.some(m => m.apiKey && m.apiKey.trim());
}

// 获取默认模型（用于非步骤调用）
function getCurrentModel() {
    // 如果设置了默认模型且该模型存在，返回默认模型
    if (defaultModelId && modelList.find(m => m.id === defaultModelId)) {
        return defaultModelId;
    }
    // 否则返回第一个模型
    return modelList.length > 0 ? modelList[0].id : 'gpt-4o';
}

function saveSettings() {
    const settings = {
        modelList: modelList,
        defaultModelId: defaultModelId
    };

    localStorage.setItem('aicg_settings', JSON.stringify(settings));
    updateApiStatusDisplay();  // 更新 API 状态显示
    showToast('设置已保存', 'success');
}

function loadSettings() {
    const saved = localStorage.getItem('aicg_settings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);

            // 加载模型列表
            if (settings.modelList && settings.modelList.length > 0) {
                modelList = settings.modelList;
            }
            // 加载默认模型
            if (settings.defaultModelId) {
                defaultModelId = settings.defaultModelId;
            }
            updateModelListUI();
            updateStepModelSelects();
            updateDefaultModelSelect();
        } catch (e) {
            console.error('加载设置失败:', e);
        }
    } else {
        // 首次加载，使用默认模型列表
        updateModelListUI();
        updateStepModelSelects();
        updateDefaultModelSelect();
    }
}

// 更新 API 状态显示（不实际测试连接）
function updateApiStatusDisplay() {
    // 优先检查默认模型
    let validModel = null;
    if (defaultModelId) {
        validModel = modelList.find(m => m.id === defaultModelId && m.endpoint && m.endpoint.trim());
    }
    if (!validModel) {
        validModel = modelList.find(m => m.endpoint && m.endpoint.trim());
    }

    if (!validModel) {
        // 没有有效配置，显示未配置状态
        elements.apiStatus.innerHTML = '<i class="fas fa-plug"></i> API: 未配置';
        elements.apiStatus.style.color = '#94a3b8';
    } else {
        // 有配置，显示已配置状态（实际连接状态待用户手动测试）
        elements.apiStatus.innerHTML = '<i class="fas fa-plug"></i> API: 已配置';
        elements.apiStatus.style.color = '#f59e0b';
    }
}

// 手动测试 API 连接（点击状态栏或设置中测试按钮时调用）
async function testApiConnectionManual() {
    // 优先使用默认模型，否则找第一个配置了端点的模型
    let validModel = null;

    if (defaultModelId) {
        validModel = modelList.find(m => m.id === defaultModelId && m.endpoint && m.endpoint.trim());
    }
    if (!validModel) {
        validModel = modelList.find(m => m.endpoint && m.endpoint.trim());
    }

    if (!validModel) {
        showToast('请先配置 API 端点', 'warning');
        return;
    }

    // 显示测试中状态
    elements.apiStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> API: 测试中...';
    elements.apiStatus.style.color = '#f59e0b';

    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (validModel.apiKey && validModel.apiKey.trim()) {
            headers['Authorization'] = `Bearer ${validModel.apiKey.trim()}`;
        }

        const response = await fetch(validModel.endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: validModel.id,
                messages: [{ role: 'user', content: 'hi' }],
                max_tokens: 5
            })
        });

        if (response.ok) {
            elements.apiStatus.innerHTML = '<i class="fas fa-plug"></i> API: 已连接';
            elements.apiStatus.style.color = '#10b981';
            showToast('API 连接成功', 'success');
        } else {
            elements.apiStatus.innerHTML = '<i class="fas fa-plug"></i> API: 连接失败';
            elements.apiStatus.style.color = '#ef4444';
            showToast('API 连接失败', 'error');
        }
    } catch (error) {
        elements.apiStatus.innerHTML = '<i class="fas fa-plug"></i> API: 连接失败';
        elements.apiStatus.style.color = '#ef4444';
        showToast('API 连接失败: ' + error.message, 'error');
    }
}

// 更新设置面板中的模型列表UI
function updateModelListUI() {
    const container = document.getElementById('model-list-container');
    if (!container) return;

    container.innerHTML = modelList.map((model, index) => `
        <div class="model-item" style="margin-bottom: 12px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 6px;">
            <div style="display: flex; gap: 8px; margin-bottom: 6px;">
                <input type="text" class="text-input model-id-input" value="${model.id}" placeholder="模型ID (如: deepseek-chat)" style="flex: 1;" data-index="${index}" autocomplete="off">
                <input type="text" class="text-input model-name-input" value="${model.name}" placeholder="显示名称" style="flex: 1;" data-index="${index}" autocomplete="off">
            </div>
            <div style="display: flex; gap: 8px; margin-bottom: 6px;">
                <input type="text" class="text-input model-endpoint-input" value="${model.endpoint || ''}" placeholder="API端点 (必填)" style="flex: 1; font-size: 0.75rem;" data-index="${index}" autocomplete="off">
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
                <input type="password" class="text-input model-apikey-input" value="${model.apiKey || ''}" placeholder="API Key (本地服务可留空)" style="flex: 1; font-size: 0.75rem;" data-index="${index}" autocomplete="off">
                <button class="btn-icon-small btn-toggle-model-key" data-index="${index}" title="显示/隐藏">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon-small btn-test-model" data-index="${index}" title="测试连接">
                    <i class="fas fa-plug"></i>
                </button>
                <button class="btn-icon btn-remove-model" data-index="${index}" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    // 绑定删除按钮事件
    container.querySelectorAll('.btn-remove-model').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            modelList.splice(index, 1);
            updateModelListUI();
            updateStepModelSelects();
        });
    });

    // 绑定显示/隐藏 API Key 按钮
    container.querySelectorAll('.btn-toggle-model-key').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            const input = container.querySelector(`.model-apikey-input[data-index="${index}"]`);
            if (input) {
                if (input.type === 'password') {
                    input.type = 'text';
                    btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
                } else {
                    input.type = 'password';
                    btn.innerHTML = '<i class="fas fa-eye"></i>';
                }
            }
        });
    });

    // 绑定测试按钮
    container.querySelectorAll('.btn-test-model').forEach(btn => {
        btn.addEventListener('click', async () => {
            const index = parseInt(btn.dataset.index);
            await testModelConnection(index, btn);
        });
    });

    // 绑定输入变化事件
    container.querySelectorAll('.model-id-input, .model-name-input, .model-endpoint-input, .model-apikey-input').forEach(input => {
        input.addEventListener('change', () => {
            const index = parseInt(input.dataset.index);
            if (input.classList.contains('model-id-input')) {
                modelList[index].id = input.value;
            } else if (input.classList.contains('model-name-input')) {
                modelList[index].name = input.value;
            } else if (input.classList.contains('model-endpoint-input')) {
                modelList[index].endpoint = input.value;
            } else if (input.classList.contains('model-apikey-input')) {
                modelList[index].apiKey = input.value;
            }
            updateStepModelSelects();
        });
    });
}

// 更新每个步骤的模型选择下拉框
function updateStepModelSelects() {
    for (let i = 1; i <= 7; i++) {
        const select = document.getElementById(`model-step-${i}`);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = modelList.map(model =>
                `<option value="${model.id}">${model.name}</option>`
            ).join('');
            // 尝试保持之前的选择
            if (currentValue && modelList.find(m => m.id === currentValue)) {
                select.value = currentValue;
            }
        }
    }
}

// 更新默认模型选择器
function updateDefaultModelSelect() {
    const select = document.getElementById('default-model-select');
    if (!select) return;

    const currentValue = defaultModelId || (modelList.length > 0 ? modelList[0].id : '');

    select.innerHTML = modelList.map(model =>
        `<option value="${model.id}">${model.name} (${model.id})</option>`
    ).join('');

    // 设置当前选中值
    if (currentValue && modelList.find(m => m.id === currentValue)) {
        select.value = currentValue;
    }
}

// 添加新模型
function addNewModel() {
    modelList.push({ id: '', name: '', endpoint: '', apiKey: '' });
    updateModelListUI();
    // 聚焦到新添加的输入框
    const container = document.getElementById('model-list-container');
    const lastInput = container.querySelector('.model-item:last-child .model-id-input');
    if (lastInput) lastInput.focus();
}

// 获取指定步骤使用的模型配置
function getModelConfigForStep(step) {
    const select = document.getElementById(`model-step-${step}`);
    const modelId = select && select.value ? select.value : (modelList.length > 0 ? modelList[0].id : 'gpt-4o');

    // 查找模型配置
    const modelConfig = modelList.find(m => m.id === modelId) || { id: modelId, name: modelId, endpoint: '', apiKey: '' };
    return modelConfig;
}

async function testApiConnection() {
    // 使用第一个配置了 API Key 和端点的模型进行测试
    const validModel = modelList.find(m => m.apiKey && m.apiKey.trim() && m.endpoint && m.endpoint.trim());

    if (!validModel) {
        showModal('错误', '请先在模型列表中配置至少一个模型的 API 端点和 API Key');
        return;
    }

    setStatus('processing', '测试连接中...');

    try {
        // 从聊天端点提取模型列表端点
        let modelsEndpoint = validModel.endpoint.replace('/v1/chat/completions', '/v1/models');

        const response = await fetch(modelsEndpoint, {
            headers: {
                'Authorization': `Bearer ${validModel.apiKey.trim()}`
            }
        });

        if (response.ok) {
            setStatus('idle', '连接成功');
            showToast(`API 连接成功 (${validModel.name})`, 'success');
            elements.apiStatus.innerHTML = '<i class="fas fa-plug"></i> API: 已连接';
            elements.apiStatus.style.color = '#10b981';
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        setStatus('error', '连接失败');
        showModal('错误', `API 连接失败: ${error.message}`);
        elements.apiStatus.innerHTML = '<i class="fas fa-plug"></i> API: 连接失败';
        elements.apiStatus.style.color = '#ef4444';
    }
}

// 测试单个模型的连接
async function testModelConnection(index, btn) {
    const model = modelList[index];
    if (!model) return;

    // 先保存当前输入的值
    const container = document.getElementById('model-list-container');
    const endpointInput = container.querySelector(`.model-endpoint-input[data-index="${index}"]`);
    const apiKeyInput = container.querySelector(`.model-apikey-input[data-index="${index}"]`);

    model.endpoint = endpointInput ? endpointInput.value.trim() : model.endpoint;
    model.apiKey = apiKeyInput ? apiKeyInput.value.trim() : model.apiKey;

    if (!model.endpoint) {
        showToast('请填写 API 端点', 'error');
        return;
    }

    // 显示测试中状态
    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        // 直接用聊天接口发送一个简单请求来测试连接
        const headers = {
            'Content-Type': 'application/json'
        };
        // 本地服务可能不需要 API Key
        if (model.apiKey) {
            headers['Authorization'] = `Bearer ${model.apiKey}`;
        }

        const response = await fetch(model.endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: model.id,
                messages: [{ role: 'user', content: 'hi' }],
                max_tokens: 1,
                stream: false
            })
        });

        if (response.ok) {
            showToast(`${model.name || model.id} 连接成功`, 'success');
            btn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i>';
            btn.title = '连接成功';

            // 更新全局状态
            elements.apiStatus.innerHTML = '<i class="fas fa-plug"></i> API: 已连接';
            elements.apiStatus.style.color = '#10b981';
        } else {
            // 尝试获取错误详情
            let errorMsg = `HTTP ${response.status}`;
            try {
                const errorData = await response.json();
                // 显示完整错误信息
                if (errorData.error?.message) {
                    errorMsg = errorData.error.message;
                } else if (errorData.message) {
                    errorMsg = errorData.message;
                }
                // 如果有更多错误详情，也显示
                if (errorData.error?.type) {
                    errorMsg += ` (${errorData.error.type})`;
                }
            } catch (e) {
                // 无法解析 JSON
            }
            throw new Error(errorMsg);
        }
    } catch (error) {
        showToast(`${model.name || model.id} 连接失败`, 'error');
        btn.innerHTML = '<i class="fas fa-times" style="color: #ef4444;"></i>';
        btn.title = `连接失败: ${error.message}`;
        // 显示详细错误弹窗
        showModal('连接失败', `模型: ${model.name || model.id}\n端点: ${model.endpoint}\n\n错误: ${error.message}`);
    }

    // 恢复按钮
    setTimeout(() => {
        btn.innerHTML = originalIcon;
        btn.title = '测试连接';
        btn.disabled = false;
    }, 2000);
}

function toggleDarkMode() {
    // 简单的暗色/亮色模式切换（如果需要的话）
    document.body.classList.toggle('light-mode');
    const btn = document.getElementById('dark-mode-toggle');
    if (document.body.classList.contains('light-mode')) {
        btn.innerHTML = '<i class="fas fa-sun"></i>';
        btn.title = '切换到深色模式';
    } else {
        btn.innerHTML = '<i class="fas fa-moon"></i>';
        btn.title = '切换到浅色模式';
    }
}

// 状态管理
function setStatus(type, text) {
    elements.statusIndicator.className = `status-indicator ${type}`;
    elements.statusIndicator.innerHTML = `<i class="fas fa-circle"></i> ${text}`;
}

// 弹窗和提示
function showModal(title, content) {
    elements.modalTitle.textContent = title;
    elements.modalBody.textContent = content;
    elements.modal.classList.add('active');
}

function closeModal() {
    elements.modal.classList.remove('active');
}

function showToast(message, type = 'info') {
    // 简单的toast提示
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    const bgColors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };

    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '12px 24px',
        background: bgColors[type] || bgColors.info,
        color: 'white',
        borderRadius: '8px',
        zIndex: '9999',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        animation: 'fadeIn 0.3s'
    });

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(20px); }
}
.toast { animation: fadeIn 0.3s; }
`;
document.head.appendChild(style);

function showHelp() {
    const helpContent = `
    <h3>使用说明</h3>
    <ol>
        <li><strong>配置API</strong>: 在右侧设置面板输入你的OpenAI API Key并保存</li>
        <li><strong>输入剧本</strong>: 在左侧输入框中粘贴原始剧本文本</li>
        <li><strong>选择流程</strong>:
            <ul>
                <li>点击"一键生成"自动执行全部6个步骤</li>
                <li>点击"单步执行"只执行当前选中步骤</li>
                <li>点击左侧步骤可以切换当前步骤</li>
            </ul>
        </li>
        <li><strong>查看结果</strong>: 在中间区域点击标签页查看不同步骤的结果</li>
        <li><strong>导出结果</strong>: 使用右上角的复制或下载按钮</li>
    </ol>
    
    <h3>6步工作流程</h3>
    <ol>
        <li><strong>洗稿</strong>: 重写剧本，更换人物和台词</li>
        <li><strong>排版</strong>: 格式化剧本，添加场景标注</li>
        <li><strong>分镜</strong>: 生成每15秒4-5个分镜提示词</li>
        <li><strong>分镜优化</strong>: 按视频制作模板格式化</li>
        <li><strong>定妆照+场景</strong>: 生成AI绘画提示词</li>
        <li><strong>关键帧</strong>: 生成关键帧图片提示词</li>
    </ol>
    
    <h3>API 设置</h3>
    <ul>
        <li><strong>API Key</strong>: 从OpenAI官网获取的API密钥</li>
        <li><strong>模型</strong>: 推荐使用GPT-4o，平衡效果和成本</li>
        <li><strong>创造力</strong>: 值越高越有创造性，越低越稳定</li>
        <li><strong>最大长度</strong>: 控制AI生成内容的长度</li>
    </ul>
    `;
    
    elements.modalTitle.textContent = '帮助文档';
    elements.modalBody.innerHTML = helpContent;
    elements.modal.classList.add('active');
}

// 初始化
document.addEventListener('DOMContentLoaded', init);
