<template>
  <div class="screenshot-container">
    <!-- 截图目标区域 -->
    <div
      class="screenshot-area"
      ref="screenshotArea"
      @mousedown="startSelection"
      @mousemove="drawSelection"
      @mouseup="endSelection"
      @mouseleave="handleMouseLeave"
    >
      <!-- 这里是要截图的内容 -->
      <div class="content">
        <h2>请框选要截图的区域</h2>
        <p>按住鼠标左键拖动来选择区域</p>
        <p>松开鼠标完成选择</p>
      </div>

      <!-- 选择框 -->
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

    <!-- 截图结果 -->
    <div class="result" v-if="capturedImage">
      <h3>截图结果：</h3>
      <img :src="capturedImage" alt="截图" />
      <button @click="downloadImage">下载截图</button>
    </div>
  </div>
</template>

<script>
import html2canvas from "html2canvas";

// 常量定义
const EMPTY_SELECTION = { left: 0, top: 0, width: 0, height: 0 };
const MIN_SELECTION_SIZE = 10;

export default {
  data() {
    return {
      isSelecting: false,
      startPoint: { x: 0, y: 0 },
      selectionBox: { ...EMPTY_SELECTION },
      capturedImage: null,
      cachedRect: null,
    };
  },
  methods: {
    // 获取截图区域的边界矩形（缓存优化）
    getAreaRect() {
      if (!this.cachedRect) {
        this.cachedRect = this.$refs.screenshotArea.getBoundingClientRect();
      }
      return this.cachedRect;
    },

    // 清除缓存
    clearRectCache() {
      this.cachedRect = null;
    },

    // 重置选择框
    resetSelection() {
      this.selectionBox = { ...EMPTY_SELECTION };
    },

    // 开始选择
    startSelection(e) {
      this.isSelecting = true;
      this.clearRectCache();
      const rect = this.getAreaRect();

      this.startPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      this.selectionBox = {
        left: this.startPoint.x,
        top: this.startPoint.y,
        width: 0,
        height: 0,
      };
    },

    // 绘制选择框
    drawSelection(e) {
      if (!this.isSelecting) return;

      const rect = this.getAreaRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      this.selectionBox = {
        left: Math.min(this.startPoint.x, currentX),
        top: Math.min(this.startPoint.y, currentY),
        width: Math.abs(currentX - this.startPoint.x),
        height: Math.abs(currentY - this.startPoint.y),
      };
    },

    // 鼠标离开区域
    handleMouseLeave() {
      if (this.isSelecting) {
        this.endSelection();
      }
    },

    // 结束选择并截图
    endSelection() {
      if (!this.isSelecting) return;
      this.isSelecting = false;
      this.clearRectCache();

      // 如果选择区域太小，则不处理
      if (
        this.selectionBox.width < MIN_SELECTION_SIZE ||
        this.selectionBox.height < MIN_SELECTION_SIZE
      ) {
        this.resetSelection();
        return;
      }

      this.captureSelectedArea();
    },

    // 截图选定区域
    async captureSelectedArea() {
      const area = this.$refs.screenshotArea;
      const options = {
        x: this.selectionBox.left,
        y: this.selectionBox.top,
        width: this.selectionBox.width,
        height: this.selectionBox.height,
        scale: 1,
        useCORS: true,
      };

      try {
        const canvas = await html2canvas(area, options);
        this.capturedImage = canvas.toDataURL("image/png");
        this.resetSelection();
      } catch (error) {
        this.$message.error("截图失败：" + error.message);
        this.resetSelection();
      }
    },

    // 下载图片
    downloadImage() {
      if (!this.capturedImage) return;

      const link = document.createElement("a");
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
      link.download = `screenshot_${timestamp}.png`;
      link.href = this.capturedImage;
      link.click();
    },
  },
};
</script>

<style scoped>
.screenshot-container {
  margin: 20px;
}

.screenshot-area {
  position: relative;
  border: 1px solid #ddd;
  padding: 20px;
  background: #f5f5f5;
  min-height: 300px;
  cursor: crosshair;
  user-select: none;
}

.content {
  pointer-events: none; /* 防止内容干扰选择 */
}

.selection-box {
  position: absolute;
  border: 2px dashed #3498db;
  background-color: rgba(52, 152, 219, 0.2);
  z-index: 100;
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

button {
  margin-top: 10px;
  padding: 8px 15px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #2980b9;
}
</style>