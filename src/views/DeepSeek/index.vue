<template>
  <div class="chat-container">
    <div class="function-panel">
      <div class="new-dialogue" @click="newDialogue">
        <span class="el-icon el-icon-chat-dot-round"></span>
        <span>开启新对话</span>
      </div>
      <div class="history-header">
        <span class="el-icon el-icon-chat-dot-round"></span>
        <span>最近对话</span>
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
      <div class="chat-window">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="['message', msg.role]"
        >
          <div v-if="msg.role === 'assistant'">
            <div
              class="message-content"
              :id="'markdown-content-' + index"
            ></div>
            <span
              v-if="
                msg.role === 'assistant' &&
                loading &&
                index === messages.length - 1
              "
              class="cursor"
            ></span>
          </div>
          <div v-else class="message-content">
            {{ msg.content }}
          </div>
        </div>

        <div v-if="loading" class="loading">
          <span class="el-icon-loading"></span>
          思考中...
        </div>
      </div>

      <div class="input-area">
        <el-input
          type="textarea"
          :rows="2"
          v-model="inputMessage"
          placeholder="请输入您的问题"
          @keyup.enter.native="sendMessage"
          :disabled="loading"
        >
        </el-input>
        <div class="operate">
          <div style="display: flex">
            <i class="el-icon el-icon-picture-outline"></i>
            <el-upload
              class="upload-demo"
              action="http://api.deepseek.com/v1/file/recognize"
              :headers="uploadHeaders"
              :on-preview="handlePreview"
              :on-remove="handleRemove"
              :before-remove="beforeRemove"
              multiple
              :limit="3"
              :on-exceed="handleExceed"
              :file-list="fileList"
            >
              <i class="el-icon el-icon-paperclip"></i>
            </el-upload>
          </div>
          <el-button
            slot="append"
            icon="el-icon-top"
            @click="sendMessage"
            circle
            :disabled="loading || !inputMessage"
          >
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import OpenAI from "openai";
import marked from "marked";
export default {
  data() {
    return {
      inputMessage: "",
      messages: [],
      histories: [],
      loading: false,
      openai: null,
      fileList: [],
      uploadHeaders: {
        Authorization: "Bearer sk-8bf0406f418d4f45bfc6483a6a3aca14", // 认证信息
        "Content-Type": "application/json",
      },
    };
  },
  watch: {
    messages: {
      handler() {
        this.$nextTick(() => {
          const container = this.$el.querySelector(".chat-window");
          container.scrollTop = container.scrollHeight;
        });
      },
      deep: true,
    },
  },
  created() {
    this.openai = new OpenAI({
      baseURL:
        process.env.VUE_APP_DEEPSEEK_API_URL || "https://api.deepseek.com",
      apiKey: process.env.VUE_APP_DEEPSEEK_API_KEY,
      dangerouslyAllowBrowser: true, // 允许在浏览器环境中使用OpenAI
    });
  },
  methods: {
    handleRemove(file, fileList) {
      console.log(file, fileList);
    },
    handlePreview(file) {
      console.log(file);
    },
    handleExceed(files, fileList) {
      this.$message.warning(
        `当前限制选择 3 个文件，本次选择了 ${files.length} 个文件，共选择了 ${
          files.length + fileList.length
        } 个文件`
      );
    },
    beforeRemove(file, fileList) {
      return this.$confirm(`确定移除 ${file.name}？`);
    },
    // 保存对话
    saveHistory() {
      if (this.messages.length > 0) {
        const title = this.messages[0].content.substring(0, 20) + "...";
        this.histories.unshift({
          title,
          messages: [...this.messages],
        });
      }
    },
    // 打开新对话
    newDialogue() {
      this.messages = [];
    },
    // 查看历史对话
    loadHistory(history) {
      this.messages = [...history.messages];
      this.$nextTick(() => {
        history.messages.forEach((item, index) => {
          if (item.role == "assistant") {
            const htmlContent = marked.parse(item.content);
            document.getElementById(`markdown-content-${index}`).innerHTML =
              htmlContent;
          }
        });
      });
    },
    async sendMessage() {
      if (!this.inputMessage.trim()) return;

      this.messages.push({
        role: "user",
        content: this.inputMessage,
      });

      this.inputMessage = "";
      this.loading = true;

      try {
        const completion = await this.openai.chat.completions.create({
          messages: [
            ...this.messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          ],
          model: "deepseek-chat",
          stream: true,
        });

        let assistantMessage = "";
        this.messages.push({
          role: "assistant",
          content: "",
        });

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || "";
          assistantMessage += content;
          this.messages[this.messages.length - 1].content = assistantMessage;
          const htmlContent = marked.parse(assistantMessage);
          document.getElementById(
            `markdown-content-${this.messages.length - 1}`
          ).innerHTML = htmlContent;
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
  display: flex;
  align-items: flex-start;
  position: relative;
  margin: 0 auto;
  padding: 20px;
  width: 80%;
  height: 100%;
  gap: 20px;
  border-radius: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .function-panel {
    height: 690px;
    width: 200px;

    .history-header,
    .new-dialogue {
      display: flex;
      align-items: center;
      padding: 15px;
      font-size: 14px;
      font-weight: bold;
    }

    .new-dialogue {
      background-color: rgb(219, 234, 254);
      border-radius: 12px;
      color: #4d6bfe;
      cursor: pointer;
    }

    .el-icon {
      margin-right: 10px;
      font-size: 25px;
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
    width: 75%;
    min-width: 300px;
    max-width: 800px;
    background: white;
    z-index: 2000;
  }

  .chat-window {
    height: 580px;
    overflow-y: auto;
    padding: 10px;
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
          height: 20px;
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

  ::v-deep .input-area {
    background-color: rgb(243, 244, 246);
    box-shadow: 0px 0px 0px 0.5px #dce0e9;
    border-radius: 24px;
    .el-textarea__inner {
      padding: 10px 15px;
      resize: none;
      border-color: transparent;
      background-color: transparent;
      &:focus,
      &:hover {
        border-color: transparent;
      }
    }
    .operate {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 5px 15px;
      font-size: 22px;
      .el-icon {
        margin: 0 5px;
        cursor: pointer;
      }
      .el-button {
        padding: 6px;
        font-size: 22px !important;
        color: #fff;
        background: #4d6bfe;
      }
      .el-button.is-disabled,
      .el-button.is-disabled:focus,
      .el-button.is-disabled:hover {
        color: #c0c4cc;
        background-color: #fff;
      }
    }
  }
  ::v-deep .el-upload {
    &:focus {
      border-color: #000;
      color: #000;
    }
    .el-upload-list {
      display: flex;
      align-items: center;
      position: absolute;
      left: 240px;
      bottom: 140px;
      .el-upload-list__item {
        background-color: #f5f7fa;
        &:first-child {
          margin-top: unset;
        }
      }
    }
  }
}
</style>
