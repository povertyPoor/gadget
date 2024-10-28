<template>
  <div class="cssPage">
    <div
      v-for="(item, index) in cssData"
      :key="index"
      class="content"
      @click="openCard(item, $event)"
    >
      {{ item.title }}
    </div>
    <div v-if="isShow" class="box">
      <component :is="component" />
    </div>
  </div>
</template>

<script>
import { cssData } from "@/assets/app";
export default {
  data() {
    return {
      cssData: null,
      isShow: false,
      component: null,
    };
  },
  mounted() {
    this.cssData = cssData();
  },
  methods: {
    openCard(item, e) {
      this.isShow = true;
      this.$nextTick(() => {
        this.box = document.querySelector(".box");
        this.box.style.left = e.target.offsetLeft + "px";
        this.box.style.top = e.target.offsetTop + "px";
        this.box.style.width = "400px";
        this.box.style.height = "200px";
        this.component = (resolve) =>
          require([`@/views/cssPage/components/${item.address}`], resolve);
      });
      setTimeout(() => {
        // this.box.innerHTML = e.target.innerHTML
        this.box.style.width = "900px";
        this.box.style.height = "600px";
        this.box.style.left = "200px";
        this.box.style.top =
          e.target.offsetTop -
          e.srcElement.getBoundingClientRect().top +
          70 +
          "px";
      }, 200);
    },
  },
};
</script>

<style lang="scss" scoped>
@import "src/styles/cssPage";
</style>

