<template>
  <i class="el-icon-close" @click="close" />
</template>

<script>
export default {
  name: 'ColorfulLandingPage',
  methods: {
    close() {
      this.$parent.isShow = false
    }
  }
}
</script>

<style scoped>

</style>
