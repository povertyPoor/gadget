<template>
  <el-scrollbar>
    <el-menu
      :default-active="activeMenu"
      :background-color="variables.menuBg"
      :text-color="variables.menuText"
      :unique-opened="false"
      :active-text-color="variables.menuActiveText"
      :collapse-transition="false"
      mode="vertical"
    >
      <sidebar-item
        v-for="route in routes"
        :key="route.path"
        :item="route"
        :base-path="route.path"
      />
    </el-menu>
  </el-scrollbar>
</template>

<script>
import { mapGetters } from "vuex";
import SidebarItem from "./SidebarItem";
import variables from "@/styles/variables.scss";

export default {
  components: { SidebarItem },
  computed: {
    ...mapGetters(["sidebar"]),
    routes() {
      return this.$router.options.routes;
    },
    activeMenu() {
      const route = this.$route;
      const { meta, path } = route;
      // if set path, the sidebar will highlight the path you set
      if (meta.activeMenu) {
        return meta.activeMenu;
      }
      return path;
    },
    showLogo() {
      return this.$store.state.settings.sidebarLogo;
    },
    variables() {
      return variables;
    },
  },
  mounted() {
    const barArr = document.querySelectorAll(".el-scrollbar__bar");
    barArr.forEach((item) => {
      item.parentNode.removeChild(item);
    });
  },
};
</script>

<style lang="scss" scoped>
@keyframes moveGradation {
  0% {
    transform: translateX(0px);
  }

  /* 结束状态 */
  100% {
    transform: translateX(-1710px);
  }
}
::v-deep .el-scrollbar__wrap::after {
  content: "";
  display: block;
  position: absolute;
  width: 1920px;
  height: 100%;
  background: linear-gradient(
    145deg,
    #fbc2eb 0%,
    #a6c1ee 51%,
    #fbc2eb 100%
  ) !important;
  animation: moveGradation 2s linear infinite alternate;
  z-index: -1;
}
::v-deep .el-scrollbar__view {
  position: absolute;
}
::v-deep .el-scrollbar__wrap {
  overflow: hidden;
  margin-bottom: unset !important;
  margin-right: unset !important;
}
</style>
