<template>
    <div class="job-info-container">
        <!-- 标题和步骤条 -->
        <StepBar
      :steps="steps"
      :current-step="currentStep"
    />
        <!-- 标题 -->
        <div class="header">
            <h1 class="title">准备面试什么岗位呢？</h1>
        </div>

        <!-- 行业选择与表单 -->
        <div class="content">
            <!-- 左侧行业选择 -->
            <div class="industry-column">
              <label class="label">行业名称</label>
                <div class="industry-wrapper">
                    <div
                        v-for="category in displayedCategories"
                        :key="category.id"
                        @click="selectCategory(category)"
                        :class="`industry-card ${selectedCategory?.id === category.id ? 'selected' : ''}`"
                    >
                        <div class="card-icon">
                            <i :class="getCategoryIcon(category)"></i>
                        </div>
                        <div class="card-content">
                            <h3 class="card-title">{{ category.name }}</h3>
                        </div>
                    </div>
                </div>

                <!-- 分页按钮 -->
                <div class="pagination">
                    <button
                        class="page-btn"
                        @click="prevPage"
                        :disabled="currentPage === 0"
                    >
                        <el-icon><ArrowLeft /></el-icon>
                    </button>
                    <button
                        class="page-btn"
                        @click="nextPage"
                        :disabled="(currentPage + 1) * pageSize >= categories.length"
                    >
                        <el-icon><ArrowRight /></el-icon>
                    </button>
                </div>
            </div>

            <!-- 右侧表单 -->
            <div class="form-column">
                <!-- 岗位名称搜索（自动完成） -->
                <div class="form-group">
                    <label class="label">岗位名称</label>
                    <el-autocomplete
                        v-model="jobTitle"
                        :fetch-suggestions="queryJobs"
                        placeholder="输入或选择岗位名称"
                        @select="handleJobSelect"
                        :value-key="name"
                        class="input"
                    >
                        <template #item="{ item }">
                            <span>{{ item.name }}</span>
                        </template>
                    </el-autocomplete>
                </div>

                <!-- 岗位描述（自动生成 + 可编辑） -->
                <div class="form-group">
                    <label class="label">岗位描述</label>
                    <textarea
                        v-model="jobDescription"
                        placeholder="自动生成的岗位描述，可在此编辑"
                        class="textarea"
                        rows="5"
                    />
                </div>

                <!-- 公司名称（可选） -->
                <div class="form-group">
                    <label class="label">公司名称</label>
                    <el-autocomplete
    v-model="companyName"
    :fetch-suggestions="queryCompanies"
    placeholder="请输入公司名称（如字节跳动）"
    @select="handleCompanySelect"
    :value-key="name"
    class="input"
  >
    <template #item="{ item }">
      <span>{{ item.name }}</span>
    </template>
  </el-autocomplete>
                </div>
            </div>
        </div>

        <!-- 底部按钮 -->
        <div class="buttons">
            <button type="button" class="btn-back" @click="goHome">返回首页</button>
            <button type="button" class="btn-next" @click="goNext">下一步</button>
        </div>
    </div>
</template>

<script>
import {ArrowLeft, ArrowRight} from "@element-plus/icons-vue";
import StepBar from "@/components/StepBar.vue";

export default {
    components:{
        ArrowRight,
        ArrowLeft,
        StepBar
    },
    data() {
        return {
            steps: [
                { label: '填写岗位信息' },
                { label: '选择简历' },
                { label: '面试押题' },
                { label: '准备完成' }
            ],
            currentStep: 0,
            categories: [
                { id: 1, name: "互联网" },
                { id: 2, name: "硬件" },
                { id: 3, name: "教育" },
                { id: 4, name: "金融" },
                { id: 5, name: "医疗" },
                { id: 6, name: "零售" },
                { id: 7, name: "物流" },
                { id: 8, name: "制造" },
                { id: 9, name: "传媒" }
            ],
            currentPage: 0,
            pageSize: 5, // 每页显示6个卡片
            selectedCategory: null, // 选中的行业
            jobTitle: "",
            companyName: "",
            companyInfo: "",
            selectedJob: null, // 选中的岗位
            jobs: [], // 不提供预设岗位，让用户自由输入
            jobDescription: "",
            companies: [], // 不提供预设公司，让用户自由输入
        };
    },
    computed: {
        filteredJobs() {
            return this.jobs.filter(job => job.industryId === this.selectedCategory?.id);
        },
        displayedCategories() {
            const start = this.currentPage * this.pageSize;
            const end = start + this.pageSize;
            return this.categories.slice(start, end);
        }
    },
    methods: {
        nextStep() {
            if (this.currentStep < this.steps.length - 1) {
                this.currentStep++;
            }
            // 处理下一步逻辑（如表单验证、数据提交等）
        },
        isCategorySelected(category) {
            return this.selectedCategories.some(c => c.id === category.id);
        },
        getCategoryIcon(category) {
            return category.icon || 'el-icon-folder'; // 直接使用对象属性
        },
        nextPage() {
            // 循环到下一页，使用模运算
            this.currentPage = (this.currentPage + 1) % this.categories.length;
        },
        prevPage() {
            // 循环到上一页，处理负数情况
            this.currentPage = (this.currentPage - 1 + this.categories.length) % this.categories.length;
        },
        // 选择行业
        selectCategory(category) {
            this.selectedCategory = category;
            // 不再重置任何内容，保留用户已输入的信息
        },

        // 搜索岗位（移除自动完成，改为普通输入）
        queryJobs(queryString, callback) {
            // 不提供任何建议，返回空数组
            callback([]);
        },
      queryCompanies(queryString, callback) {
      // 不提供任何建议，返回空数组
      callback([]);
    },

        // 修复岗位选择处理方法（不再自动填充描述）
        handleJobSelect(item) {
            // 仅保留用户输入的岗位名称
            this.jobTitle = item.value || item;
        },
        
        // 处理公司选择
        handleCompanySelect(item) {
            this.companyName = item.value;
        },

        // 生成prompt
        generatePrompt() {
            const industry = this.selectedCategory?.name || '未选择';
            const job = this.jobTitle || '未填写';
            const description = this.jobDescription || '未填写';
            const company = this.companyName || '未填写';
            
            return `该用户选择的行业为${industry}，岗位名称为${job}，他对于岗位的描述是${description}，想要面试的公司名称为${company}`;
        },

        // 验证表单
        validateForm() {
            if (!this.selectedCategory) {
                this.$message.error('请选择行业');
                return false;
            }
            if (!this.jobTitle) {
                this.$message.error('请填写岗位名称');
                return false;
            }
            if (!this.jobDescription) {
                this.$message.error('请填写岗位描述');
                return false;
            }
            // 公司名称为可选项，不做必填验证
            return true;
        },

        // 提交数据（模拟）
        submitData() {
            const data = {
                category: this.selectedCategory,
                job: this.selectedJob,
                jobDescription: this.jobDescription,
                companyName: this.companyName,
            };
            console.log("提交数据：", data);
            // 实际项目中调用API
        },
      goHome() {
      this.$router.push('/'); // 跳转到首页路径
    },
    goNext() {
        // 验证表单
        if (!this.validateForm()) {
            return;
        }
        
        // 生成prompt
        const prompt = this.generatePrompt();
        
        // 准备传递的数据
        const jobData = {
            industry: this.selectedCategory?.name,
            industryId: this.selectedCategory?.id,
            jobTitle: this.jobTitle,
            jobDescription: this.jobDescription,
            companyName: this.companyName,
            prompt: prompt
        };
        
        // 方式1：通过路由参数传递
        this.$router.push({
            path: '/sel_cv',
            query: {
                jobData: JSON.stringify(jobData)
            }
        });
        
        // 方式2：使用Vuex存储（如果项目中使用了Vuex）
        // this.$store.commit('setJobData', jobData);
        
        // 方式3：使用sessionStorage存储
        sessionStorage.setItem('jobData', JSON.stringify(jobData));
        
        console.log('生成的prompt:', prompt);
        console.log('传递的数据:', jobData);
    }
    }
};
</script>

<style scoped lang="scss">
.job-info-container {
    min-height: 100vh;
    background: #ebf4fa;
    padding: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;

    .header {
        text-align: center;
        margin-bottom: 30px;

        .title {
            font-size: 28px;
            color: #2d3748;
            margin-bottom: 0;
        }

        .step {
            font-size: 14px;
            color: #646c7b;
            background: #f0f8ff;
            padding: 5px 15px;
            border-radius: 20px;
        }
    }

    .content {
        display: grid;
        grid-template-columns: 1fr 4fr;
        gap: 40px;
        width: 60%;
        max-width: 1200px;

        @media (max-width: 992px) {
            grid-template-columns: 1fr;
        }
    }

    .industry-column {
        display: flex;
        flex-direction: column;
        gap: 20px;

        .industry-wrapper {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
        }

        .industry-card {
            display: flex;
            align-items: center;
            padding: 4px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            border: 2px solid transparent;
            cursor: pointer;
            transition: all 0.3s;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
            }

            &.selected {
                border-color: #409eff;
                background: #f5faff;
            }

            .card-icon {
                width: 20px;
                height: 20px;
                border-radius: 5px;
                background: #f0f8ff;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #409eff;
                margin-right: 2px;
            }

            .card-content {
                flex: 1;

                .card-title {
                    font-size: 15px;
                    font-weight: 500;
                    color: #333;
                    margin-bottom: 20px;
                }
            }
            .selected & {
                background: #409eff;
                border-color: #409eff;
            }
        }
    }
    .pagination {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 5px;

        .page-btn {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            background: #f0f8ff;
            border: 2px solid #e0e0e0;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;

            &:hover {
                background: #e0f2fe;
                border-color: #409eff;
            }

            &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                background: #f5f5f5;
                border-color: #ddd;
            }

            i {
                font-size: 18px;
                color: #666;
            }
        }
    }

    .form-column {
        display: flex;
        flex-direction: column;
        gap: 20px;


        .form-group {
            width: 100%;

            .label {
                font-size: 16px;
                color: #2d3748;
                margin-bottom: 8px;
            }

            .input,
            .textarea {
                width: 100% !important;
                padding: 8px;
                border: 1px solid #e0e0e0; // 统一1px边框
                border-radius: 8px; // 统一圆角
                font-size: 16px;
                transition: border-color 0.3s;

                &:focus {
                    border-color: #409eff;
                    outline: none;
                }
            }

            .textarea {
                resize: vertical;
                margin-top: 20px;
                min-height: 130px; // 保持高度一致
            }

            // 调整Element Autocomplete的下拉菜单样式（可选）
            .el-autocomplete-suggestion {
                border-radius: 8px;
                border: 1px solid #e0e0e0;
            }
        }
    }

    .buttons {
        margin-top: 30px;

        .btn-next {
            background: #409eff;
            color: white;

            &:hover {
                background: #337ab7;
            }
        }
    }
    .buttons {
  display: flex;
  gap: 80px;
  margin-top: 0px;
  justify-content: flex-end; // 靠右对齐，符合表单操作习惯

  .btn-back,
  .btn-next {
    padding: 14px 28px;
    border-radius: 12px; // 更大的圆角，更柔和
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    font-size: 16px;
    font-weight: 600; // 文字更粗，增强可读性
    letter-spacing: 0.5px; // 字母间距，提升美感

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12); // 更细腻的阴影
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1); // 点击后阴影恢复
    }
  }

  .btn-back {
    background: linear-gradient(145deg, #f0f0f0, #e0e0e0); // 渐变背景，增加质感
    color: #666;
    border: none; // 去掉边框，更简洁
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08); // 初始阴影

    &:hover {
      background: linear-gradient(145deg, #e0e0e0, #d0d0d0); // hover时渐变加深
      color: #444;
    }
  }

  .btn-next {
    background: linear-gradient(145deg, #409eff, #3688e6); // 主题渐变，更有层次感
    color: white;
    border: none;
    box-shadow: 0 3px 6px rgba(64, 158, 255, 0.2); // 初始主题阴影

    &:hover {
      background: linear-gradient(145deg, #3688e6, #2c76d6); // hover时渐变加深
      box-shadow: 0 4px 10px rgba(64, 158, 255, 0.25); // 阴影增强
    }
  }
    }
}
</style>