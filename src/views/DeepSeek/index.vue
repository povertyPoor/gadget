<template>
  <div class="chat-container">
    <div class="history-panel">
      <div class="history-header">
        <span>历史记录</span>
      </div>
      <div class="history-list">
        <div
          v-for="(history, index) in histories"
          :key="index"
          class="history-item"
          @click="loadHistory(history)"
        >
          {{ history.title }}
        </div>
      </div>
    </div>
    <div class="custom-dialog">
      <div class="dialog-header">
        <span>AI 对话</span>
      </div>
      <div class="chat-window">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="['message', msg.role]"
        >
          <div class="message-content">
            {{ msg.content }}
            <span
              v-if="
                msg.role === 'assistant' &&
                loading &&
                index === messages.length - 1
              "
              class="cursor"
            ></span>
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
          :disabled="loading"
        >
          <el-button
            slot="append"
            icon="el-icon-s-promotion"
            @click="sendMessage"
            :disabled="loading || !inputMessage"
          >
            发送
          </el-button>
        </el-input>
      </div>
    </div>
  </div>
</template>

<script>
import OpenAI from "openai";

export default {
  data() {
    return {
      inputMessage: "",
      messages: [],
      histories: [],
      loading: false,
      openai: null,
      controller: null,
    };
  },
  created() {
    this.openai = new OpenAI({
      baseURL:
        process.env.VUE_APP_DEEPSEEK_API_URL || "https://api.deepseek.com",
      apiKey: process.env.VUE_APP_DEEPSEEK_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  },
  methods: {
    saveHistory() {
      if (this.messages.length > 0) {
        const title = this.messages[0].content.substring(0, 20) + "...";
        this.histories.unshift({
          title,
          messages: [...this.messages],
        });
      }
    },
    loadHistory(history) {
      this.messages = history.messages;
    },
    async sendMessage() {
      if (!this.inputMessage.trim()) return;

      this.messages.push({
        role: "user",
        content: this.inputMessage,
      });

      const userMessage = this.inputMessage;
      this.inputMessage = "";
      this.loading = true;

      try {
        const completion = await this.openai.chat.completions.create(
          {
            messages: [
              { role: "system", content: "你是一个乐于助人的AI助手" },
              ...this.messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
              })),
            ],
            model: "deepseek-chat",
            stream: true,
          },
          {
            signal: this.controller?.signal,
          }
        );

        let assistantMessage = "";
        this.messages.push({
          role: "assistant",
          content: "",
        });

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || "";
          assistantMessage += content;
          this.messages[this.messages.length - 1].content = assistantMessage;
        }
      } catch (error) {
        this.$message.error("请求失败：" + error.message);
      } finally {
        this.loading = false;
        this.saveHistory();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.chat-container {
  width: 100%;
  height: 100%;
  padding: 20px;
  position: relative;
  display: flex;
  gap: 20px;
  align-items: flex-start;

  .history-panel {
    width: 200px;
    background: white;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    .history-header {
      padding: 15px;
      border-bottom: 1px solid #ebeef5;
      font-size: 14px;
      font-weight: bold;
    }

    .history-list {
      padding: 10px;

      .history-item {
        padding: 8px;
        margin: 4px 0;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;

        &:hover {
          background: #f5f7fa;
        }
      }
    }
  }

  .custom-dialog {
    width: 50%;
    min-width: 300px;
    max-width: 800px;
    background: white;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    z-index: 2000;

    .dialog-header {
      padding: 15px 20px;
      border-bottom: 1px solid #ebeef5;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;
      font-weight: bold;

      .el-button {
        padding: 0;
      }
    }
  }

  .chat-window {
    height: 400px;
    overflow-y: auto;
    padding: 10px;
    border: 1px solid #ebeef5;
    border-radius: 4px;

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
}
</style>
