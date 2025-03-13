<template>
  <div class="chat-container">
    <el-dialog
      title="AI 对话"
      :visible.sync="dialogVisible"
      width="50%"
      :before-close="handleClose">
      
      <div class="chat-window">
        <div v-for="(msg, index) in messages" :key="index" 
             :class="['message', msg.role]">
      <div class="message-content">
        {{ msg.content }}
        <span v-if="loading && index === messages.length - 1" class="cursor"></span>
      </div>
        </div>
        
        <div v-if="loading" class="loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          思考中...
        </div>
      </div>

      <div class="input-area">
        <el-input
          v-model="inputMessage"
          placeholder="请输入您的问题"
          @keyup.enter.native="sendMessage"
          :disabled="loading">
          <el-button 
            slot="append" 
            icon="el-icon-s-promotion"
            @click="sendMessage"
            :disabled="loading || !inputMessage">
            发送
          </el-button>
        </el-input>
      </div>
    </el-dialog>

    <el-button 
      type="primary" 
      icon="el-icon-chat-dot-round"
      @click="dialogVisible = true">
      开始对话
    </el-button>
  </div>
</template>

<script>
import OpenAI from "openai";

export default {

  data() {
    return {
      dialogVisible: false,
      inputMessage: '',
      messages: [],
      loading: false,
      openai: null,
      controller: null
    }
  },
  created() {
    this.openai = new OpenAI({
      baseURL: process.env.VUE_APP_DEEPSEEK_API_URL || 'https://api.deepseek.com',
      apiKey: process.env.VUE_APP_DEEPSEEK_API_KEY,
      dangerouslyAllowBrowser: true
    });
  },
  methods: {
    async sendMessage() {
      if (!this.inputMessage.trim()) return;
      
      this.messages.push({
        role: 'user',
        content: this.inputMessage
      });
      
      const userMessage = this.inputMessage;
      this.inputMessage = '';
      this.loading = true;
      
      try {
        const completion = await this.openai.chat.completions.create({
          messages: [
            { role: "system", content: "你是一个乐于助人的AI助手" },
            ...this.messages.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          ],
          model: "deepseek-chat",
          stream: true
        }, {
          signal: this.controller?.signal
        });

        let assistantMessage = '';
        this.messages.push({
          role: 'assistant',
          content: ''
        });
        
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || '';
          assistantMessage += content;
          this.messages[this.messages.length - 1].content = assistantMessage;
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
      } finally {
        this.loading = false;
      }
    },
    handleClose(done) {
      this.$confirm('确认关闭对话框吗？')
        .then(_ => {
          this.messages = [];
          done();
        })
        .catch(_ => {});
    }
  }
}
</script>

<style lang="scss" scoped>
@keyframes blink {
  0% { opacity: 1; }
  50% { opacity: 0; }
  100% { opacity: 1; }
}

.chat-container {
width: 100%;
height: 100%;
  padding: 20px;
  
  .chat-window {
    height: 400px;
    overflow-y: auto;
    padding: 10px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    margin-bottom: 20px;
    
    .message {
      margin: 10px 0;
      max-width: 80%;
      
      &.user {
        margin-left: auto;
        text-align: right;
        
        .message-content {
          background: #409eff;
          color: white;
        }
      }
      
      &.assistant {
        margin-right: auto;
        text-align: left;
        
        .message-content {
          background: #f0f0f0;
          color: #333;
        }
      }
      
      .message-content {
        display: inline-block;
        padding: 8px 12px;
        border-radius: 4px;
        word-break: break-word;
        position: relative;
        
        .cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: #333;
          margin-left: 2px;
          animation: blink 1s infinite;
        }
      }
    }
    
    .loading {
      text-align: center;
      color: #909399;
      padding: 10px;
      
      .el-icon {
        margin-right: 5px;
      }
    }
  }
  
  .input-area {
    margin-top: 20px;
  }
}
</style>
