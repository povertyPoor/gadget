<template>
  <div>
    <div
      class="floating-ball"
      ref="ball"
      @mousedown="startDrag"
      @click="showSmallPopup"
      @dblclick="showLargePopup"
      :style="{ left: position.x + 'px', top: position.y + 'px' }"
    ></div>

    <div
      v-if="showSmall"
      class="small-popup"
      :style="{ left: position.x + 50 + 'px', top: position.y + 50 + 'px' }"
    >
      小弹窗内容
    </div>

    <div
      v-if="showLarge"
      class="large-popup"
      :style="{ left: position.x - 100 + 'px', top: position.y - 100 + 'px' }"
    >
      大弹窗内容
    </div>
  </div>
</template>

<script>
export default {
  name: "FloatingBall",
  data() {
    return {
      position: { x: 100, y: 100 },
      isDragging: false,
      showSmall: false,
      showLarge: false,
      dragStartPos: { x: 0, y: 0 },
    };
  },
  methods: {
    startDrag(e) {
      this.isDragging = true;
      this.dragStartPos = {
        x: e.clientX - this.position.x,
        y: e.clientY - this.position.y,
      };
      document.addEventListener("mousemove", this.onDrag);
      document.addEventListener("mouseup", this.stopDrag);
    },
    onDrag(e) {
      if (!this.isDragging) return;
      this.position = {
        x: e.clientX - this.dragStartPos.x,
        y: e.clientY - this.dragStartPos.y,
      };
    },
    stopDrag() {
      this.isDragging = false;
      document.removeEventListener("mousemove", this.onDrag);
      document.removeEventListener("mouseup", this.stopDrag);
      // 拖动结束后保持当前弹窗状态
    },
    showSmallPopup(e) {
      // 只有当是纯点击事件(没有移动)才显示小弹窗
      if (
        this.isDragging ||
        Math.abs(e.clientX - this.dragStartPos.x) > 5 ||
        Math.abs(e.clientY - this.dragStartPos.y) > 5
      ) {
        return;
      }
      this.showSmall = !this.showSmall;
      this.showLarge = false;
    },
    showLargePopup() {
      if (this.isDragging) return;
      this.showSmall = false;
      this.showLarge = true;
    },
  },
};
</script>

<style scoped>
.floating-ball {
  position: fixed;
  width: 50px;
  height: 50px;
  background-color: #409eff;
  border-radius: 50%;
  cursor: move;
  z-index: 9999;
}

.small-popup {
  position: fixed;
  width: 150px;
  height: 100px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  z-index: 9998;
}

.large-popup {
  position: fixed;
  width: 300px;
  height: 200px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  z-index: 9998;
}
</style>
