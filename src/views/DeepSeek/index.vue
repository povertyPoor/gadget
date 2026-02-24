<template>
  <div class="deepSeek">
    <div id="floating-ball"></div>
    <div v-if="chatShow" class="chat-container">
      <div class="close" @click="chatShow = false">
        <i class="el-icon-close"></i>
      </div>
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
              <!-- <span
                v-if="
                  msg.role === 'assistant' &&
                  loading &&
                  index === messages.length - 1
                "
                class="cursor"
              ></span> -->
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
              <img src="@/assets/imageUpload.png" alt="" />
              <img src="@/assets/fileUpload.png" alt="" />
              <img
                src="@/assets/screenshot.png"
                alt=""
                @click="startScreenshot"
              />
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
    <div class="mask" v-show="isSelecting">
      <div
        class="selection-box"
        v-show="isSelecting"
        :style="{
          left: selectionBox.left + 'px',
          top: selectionBox.top + 'px',
          width: selectionBox.width + 'px',
          height: selectionBox.height + 'px',
        }"
      ></div>
    </div>
    <div class="result" v-if="capturedImage">
      <h3>截图结果：</h3>
      <img :src="capturedImage" alt="截图" />
    </div>
  </div>
</template>

<script>
import marked from "marked";
import html2canvas from "html2canvas";
export default {
  data() {
    return {
      chatShow: false,
      inputMessage: "",
      messages: [],
      histories: [],
      loading: false,
      openai: null,
      isDragging: false, // 鼠标是否点击悬浮球
      offsetX: null,
      offsetY: null,
      marked: null,
      isSelecting: false,
      isScreenshotShow: false,
      startX: 0,
      startY: 0,
      selectionBox: {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
      },
    };
  },
  watch: {
    messages: {
      handler() {
        this.$nextTick(() => {
          const container = this.$el.querySelector(".chat-window");
          if (
            container.clientHeight + Number(container.scrollTop.toFixed(0)) >=
            container.scrollHeight - 60
          ) {
            container.scrollTop = container.scrollHeight;
          }
        });
      },
      deep: true,
    },
  },
  created() {
    this.marked = marked;
    // this.openai = new OpenAI({
    //   baseURL:
    //     process.env.VUE_APP_DEEPSEEK_API_URL || "https://api.deepseek.com",
    //   apiKey: process.env.VUE_APP_DEEPSEEK_API_KEY,
    //   dangerouslyAllowBrowser: true, // 允许在浏览器环境中使用OpenAI
    // });
  },
  mounted() {
    this.setFloatingBallEvent();
  },
  methods: {
    // 设置悬浮球
    setFloatingBallEvent() {
      const floatingBall = document.getElementById("floating-ball");
      // 鼠标事件
      floatingBall.addEventListener("dblclick", (e) => {
        this.chatShow = true;
      });
      floatingBall.addEventListener("mousedown", (e) => {
        this.isDragging = true;
        this.offsetX = e.clientX - floatingBall.offsetLeft;
        this.offsetY = e.clientY - floatingBall.offsetTop;
      });

      floatingBall.addEventListener("mouseenter", (e) => {
        floatingBall.classList.add("dragging");
      });

      floatingBall.addEventListener("mouseleave", (e) => {
        floatingBall.classList.remove("dragging");
      });

      document.addEventListener("mousemove", (e) => {
        if (this.isDragging) {
          let x = e.clientX - this.offsetX;
          let y = e.clientY - this.offsetY;

          const ballWidth = floatingBall.offsetWidth;
          const ballHeight = floatingBall.offsetHeight;
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;

          x = Math.max(0, Math.min(x, windowWidth - ballWidth));
          y = Math.max(0, Math.min(y, windowHeight - ballHeight));

          floatingBall.style.left = `${x}px`;
          floatingBall.style.top = `${y}px`;
        }
        if (this.isScreenshotShow) {
          const currentX = e.clientX;
          const currentY = e.clientY;
          // const currentX =
          //   e.clientX -
          //   document.querySelector(".deepSeek").getBoundingClientRect().left;
          // const currentY =
          //   e.clientY -
          //   document.querySelector(".deepSeek").getBoundingClientRect().top;

          this.selectionBox = {
            left: Math.min(this.startX, currentX),
            top: Math.min(this.startY, currentY),
            width: Math.abs(currentX - this.startX),
            height: Math.abs(currentY - this.startY),
          };
        }
      });
      document.addEventListener("mouseup", () => {
        this.isDragging = false;
        this.isSelecting = false;
        this.isScreenshotShow = false;
        document.body.style.cursor = "default";
      });
      document.addEventListener("mousedown", (e) => {
        if (this.isSelecting) {
          this.isScreenshotShow = true;
          this.startX = e.clientX;
          this.startY = e.clientY;

          // this.startX =
          //   e.clientX -
          //   document.querySelector(".deepSeek").getBoundingClientRect().left;
          // this.startY =
          //   e.clientY -
          //   document.querySelector(".deepSeek").getBoundingClientRect().top;

          this.selectionBox = {
            left: this.startX,
            top: this.startY,
            width: 0,
            height: 0,
          };
        }
      });
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
      this.$nextTick(() => {
        // 发送新对话时，滚动到最低部
        const container = document.querySelector(".chat-window");
        container.scrollTop = container.scrollHeight;
      });

      this.inputMessage = "";
      this.loading = true;

      try {
        // const completion = await this.openai.chat.completions.create({
        //   messages: [
        //     ...this.messages.map((msg) => ({
        //       role: msg.role,
        //       content: msg.content,
        //     })),
        //   ],
        //   model: "deepseek-chat",
        //   stream: true,
        // });

        // let assistantMessage = "";
        // this.messages.push({
        //   role: "assistant",
        //   content: "",
        // });

        // for await (const chunk of completion) {
        //   const content = chunk.choices[0]?.delta?.content || "";
        //   assistantMessage += content;
        //   this.messages[this.messages.length - 1].content = assistantMessage;
        //   const htmlContent = marked.parse(assistantMessage);
        //   document.getElementById(
        //     `markdown-content-${this.messages.length - 1}`
        //   ).innerHTML = htmlContent;
        // }

        const that = this;
        const response = await fetch(
          process.env.VUE_APP_DEEPSEEK_API_URL_completions,
          {
            method: "post",
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                ...this.messages.map((msg) => ({
                  role: msg.role,
                  content: msg.content,
                })),
              ],
              stream: true,
            }),
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.VUE_APP_DEEPSEEK_API_KEY}`,
            },
            responseType: "stream",
          }
        );
        // 用来获取一个可读的流的读取器（Reader）以流的方式处理响应体数据
        const reader = response.body.getReader();

        let assistantMessage = "";
        this.messages.push({
          role: "assistant",
          content: "",
        });
        const read = async () => {
          // 获取流的读取器
          const { done, value } = await reader.read();
          // 获取流的读取器
          if (done) return; // 是否读取完成
          // 将流中的字节数据解码为文本字符串
          const textDecoder = new TextDecoder();
          const completion = textDecoder.decode(value);
          // 截取流数据
          const lines = completion.toString().split("\n");
          for await (const line of lines) {
            // 使用开头为"data: "的数据
            if (line.startsWith("data: ")) {
              try {
                const json = JSON.parse(line.slice(6));
                if (json.choices[0]?.delta?.content) {
                  const content = json.choices[0].delta.content;
                  assistantMessage += content;
                  that.messages[that.messages.length - 1].content =
                    assistantMessage;
                  const htmlContent = that.marked.parse(assistantMessage);
                  document.getElementById(
                    `markdown-content-${that.messages.length - 1}`
                  ).innerHTML = htmlContent;
                }
              } catch (e) {
                continue;
              }
            }
          }
          read();
        };
        read();
      } catch (error) {
        this.$message.error("请求失败：" + error.message);
      } finally {
        this.loading = false;
        this.saveHistory();
      }
    },
    startScreenshot() {
      this.isSelecting = true;
      document.body.style.cursor = "crosshair";
      this.startX = 0;
      this.startY = 0;
      this.selectionBox = {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
      };
    },
    // 截图
    screenshot() {
      const that = this;
      html2canvas(document.body).then(function (canvas) {
        that.downloadImage(canvas);
      });
    },
    downloadImage(canvas) {
      const link = document.createElement("a");
      link.download = "screenshot.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
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
.deepSeek {
  width: 100%;
  height: 100%;
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

  .close {
    position: absolute;
    right: 20px;
    font-size: 20px;
    cursor: pointer;
  }
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
    background-color: #7e889c;
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
      img {
        margin: 0 5px;
        width: 30px;
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
.mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgb(101 101 101 / 50%);
  z-index: 3000;
}
.selection-box {
  position: absolute;
  border: 2px dashed #3498db;
  background-color: rgba(52, 152, 219, 0.2);
  z-index: 3100;
}

.result {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #eee;
}

.result img {
  max-width: 100%;
  margin-top: 10px;
  border: 1px solid #ddd;
}

#floating-ball {
  position: absolute;
  width: 60px;
  height: 60px;
  background: url("../../assets/deepSeek.jpg") no-repeat 0 0 / cover;
  border-radius: 50%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  user-select: none;
  transition: opacity 0.3s, transform 0.3s;
  cursor: pointer;
  z-index: 999999;
}
#floating-ball.dragging {
  opacity: 0.8;
  transform: scale(1.1);
}
</style>
