<template>
  <div class="code-buddy">
    <div class="chat-container">
      <div class="chat-header">
        <h2>CodeBuddy AI 助手</h2>
        <el-button type="text" @click="newDialogue">
          <i class="el-icon-refresh"></i> 新对话
        </el-button>
      </div>

      <div class="chat-window" ref="chatWindow">
        <div v-if="messages.length === 0" class="welcome-message">
          <i class="el-icon-chat-dot-round"></i>
          <p>你好！我是 CodeBuddy AI 助手，有什么可以帮你的吗？</p>
        </div>

        <div
          v-for="(msg, index) in messages"
          :key="msg.id"
          :class="['message', msg.role]"
        >
          <div class="avatar">
            <i :class="msg.role === 'user' ? 'el-icon-user' : 'el-icon-s-platform'"></i>
          </div>
          <div class="message-body">
            <div class="role-name">{{ msg.role === 'user' ? '我' : 'CodeBuddy' }}</div>
            <div v-if="msg.role === 'assistant'" class="message-content" :id="'markdown-content-' + index"></div>
            <div v-else class="message-content">{{ msg.content }}</div>
          </div>
        </div>

        <div v-if="loading" class="loading">
          <i class="el-icon-loading"></i>
          <span>思考中...</span>
        </div>
      </div>

      <div class="input-area">
        <el-input
          type="textarea"
          :rows="3"
          v-model="inputMessage"
          placeholder="请输入您的问题，按 Enter 发送..."
          @keyup.enter.native="handleEnter"
          :disabled="loading"
          resize="none"
        />
        <div class="button-area">
          <span class="tip">Enter 发送，Shift + Enter 换行</span>
          <el-button
            type="primary"
            icon="el-icon-s-promotion"
            @click="sendMessage"
            :loading="loading"
            :disabled="!inputMessage.trim()"
          >
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import marked from "marked";
import DOMPurify from "dompurify";

export default {
  name: 'CodeBuddy',
  data() {
    return {
      inputMessage: "",
      messages: [],
      loading: false,
      abortController: null,
      messageIdCounter: 0,
    };
  },
  beforeDestroy() {
    // 组件销毁时取消正在进行的请求
    if (this.abortController) {
      this.abortController.abort();
    }
  },
  watch: {
    messages: {
      handler() {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      },
      deep: true,
    },
  },
  methods: {
    scrollToBottom() {
      const container = this.$refs.chatWindow;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },

    newDialogue() {
      this.messages = [];
      this.inputMessage = "";
      this.messageIdCounter = 0;
    },

    generateMessageId() {
      return `msg_${Date.now()}_${++this.messageIdCounter}`;
    },

    handleEnter(event) {
      // Shift + Enter 换行，单独 Enter 发送
      if (!event.shiftKey) {
        event.preventDefault();
        this.sendMessage();
      }
    },

    async sendMessage() {
      if (!this.inputMessage.trim() || this.loading) return;

      const userMessage = this.inputMessage.trim();
      this.messages.push({
        id: this.generateMessageId(),
        role: "user",
        content: userMessage,
      });

      this.inputMessage = "";
      this.loading = true;

      try {
        this.abortController = new AbortController();
        const response = await fetch(
          process.env.VUE_APP_DEEPSEEK_API_URL_completions,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.VUE_APP_DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                {
                  role: "system",
                  content: "你是 CodeBuddy，一个专业的编程助手。你擅长解答编程问题、代码调试、技术方案设计等。请用清晰、专业的方式回答用户的问题。"
                },
                ...this.messages.map((msg) => ({
                  role: msg.role,
                  content: msg.content,
                })),
              ],
              stream: true,
            }),
            signal: this.abortController.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const textDecoder = new TextDecoder();
        let assistantMessage = "";
        const assistantMsgIndex = this.messages.length;

        this.messages.push({
          id: this.generateMessageId(),
          role: "assistant",
          content: "",
        });

        const read = async () => {
          try {
            const { done, value } = await reader.read();
            if (done) {
              this.loading = false;
              return;
            }

            const chunk = textDecoder.decode(value);
            const lines = chunk.toString().split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const json = JSON.parse(line.slice(6));
                  if (json.choices[0]?.delta?.content) {
                    const content = json.choices[0].delta.content;
                    assistantMessage += content;
                    this.messages[assistantMsgIndex].content = assistantMessage;
                    const htmlContent = DOMPurify.sanitize(marked.parse(assistantMessage));
                    const el = document.getElementById(
                      `markdown-content-${assistantMsgIndex}`
                    );
                    if (el) {
                      el.innerHTML = htmlContent;
                    }
                  }
                } catch (e) {
                  // Ignore parsing errors for incomplete JSON chunks
                }
              }
            }
            read();
          } catch (error) {
            // 如果是用户主动取消请求，不显示错误
            if (error.name !== 'AbortError') {
              this.loading = false;
              this.$message.error("读取响应失败：" + error.message);
            }
          }
        };
        read();
      } catch (error) {
        this.loading = false;
        // 如果是用户主动取消请求，不显示错误
        if (error.name !== 'AbortError') {
          this.$message.error("请求失败：" + error.message);
          // 移除空的助手消息
          if (this.messages.length > 0 && this.messages[this.messages.length - 1].content === "") {
            this.messages.pop();
          }
        }
      } finally {
        this.abortController = null;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.code-buddy {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.chat-container {
  width: 100%;
  max-width: 900px;
  height: calc(100vh - 140px);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 500;
  }

  .el-button {
    color: #fff;
    font-size: 14px;

    &:hover {
      color: rgba(255, 255, 255, 0.8);
    }
  }
}

.chat-window {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f7fa;

  .welcome-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #909399;

    i {
      font-size: 60px;
      margin-bottom: 16px;
    }

    p {
      font-size: 16px;
    }
  }

  .message {
    display: flex;
    margin-bottom: 16px;

    &.user {
      flex-direction: row-reverse;

      .avatar {
        background: #409eff;
        margin-left: 12px;
        margin-right: 0;
      }

      .message-body {
        align-items: flex-end;
      }

      .message-content {
        background: #409eff;
        color: #fff;
        border-radius: 16px 16px 4px 16px;
      }
    }

    &.assistant {
      .avatar {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        margin-right: 12px;
      }

      .message-content {
        background: #fff;
        color: #333;
        border-radius: 16px 16px 16px 4px;
        border: 1px solid #e4e7ed;
      }
    }
  }

  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    i {
      color: #fff;
      font-size: 18px;
    }
  }

  .message-body {
    display: flex;
    flex-direction: column;
    max-width: 70%;
  }

  .role-name {
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;
  }

  .message-content {
    padding: 12px 16px;
    word-break: break-word;
    line-height: 1.6;

    ::v-deep {
      pre {
        background: #282c34;
        color: #abb2bf;
        padding: 12px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 8px 0;
      }

      code {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 13px;
      }

      p {
        margin: 0 0 8px 0;

        &:last-child {
          margin-bottom: 0;
        }
      }

      ul, ol {
        padding-left: 20px;
        margin: 8px 0;
      }
    }
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    color: #909399;

    i {
      margin-right: 8px;
      font-size: 18px;
    }
  }
}

.input-area {
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #e4e7ed;

  ::v-deep .el-textarea__inner {
    border: 1px solid #dcdfe6;
    border-radius: 8px;
    padding: 12px;
    font-size: 14px;
    line-height: 1.6;

    &:focus {
      border-color: #667eea;
    }
  }

  .button-area {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;

    .tip {
      font-size: 12px;
      color: #909399;
    }

    .el-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;

      &:hover {
        opacity: 0.9;
      }

      &.is-disabled {
        background: #c0c4cc;
      }
    }
  }
}
</style>
