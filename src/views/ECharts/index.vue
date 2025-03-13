<template>
  <div class="3Decharts">
    <div class="gauge3d">
      <div class="vertical_color"></div>
      <div id="echarts"></div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import * as echarts from "echarts";

export default {
  name: "3DECharts",
  computed: {
    ...mapGetters(["name"]),
  },
  data() {
    return {
      echarts: null,
    };
  },
  mounted() {
    this.echarts = echarts.init(document.getElementById("echarts"));
    this.init();
  },
  methods: {
    init() {
      let option = {
        graphic: [
          {
            type: "circle", // 圆形
            left: "center", // 水平居中
            top: "27%", // 垂直位置
            shape: {
              r: 185, // 半径
            },
            style: {
              fill: {
                // 填充颜色为径向渐变
                type: "radial",
                x: 0.5, // 渐变中心的 x 坐标（相对圆形的宽度）
                y: 0.5, // 渐变中心的 y 坐标（相对圆形的高度）
                r: 0.5, // 渐变的半径（相对圆形的半径）
                colorStops: [
                  { offset: 0, color: "rgba(228,228,228,.4)" }, // 0% 处的颜色
                  { offset: 0.8, color: "rgba(228,228,228,.2)" }, // 0% 处的颜色
                  { offset: 1, color: "rgba(228,228,228,0)" }, // 100% 处的颜色
                ],
              },
            },
          },
        ],
        series: [
          {
            type: "gauge",
            center: ["50%", "60%"],
            startAngle: 220,
            endAngle: -40,
            min: 0,
            max: 60,
            splitNumber: 6,
            itemStyle: {
              color: "#00f9e2",
            },
            progress: {
              roundCap: true,
              show: true,
              width: 30,
            },
            pointer: {
              show: false,
            },
            axisLine: {
              roundCap: true,
              lineStyle: {
                width: 30,
              },
            },
            axisTick: {
              distance: -45,
              splitNumber: 10,
              lineStyle: {
                width: 2,
                color: "#ccc",
              },
            },
            splitLine: {
              distance: -52,
              length: 14,
              lineStyle: {
                width: 3,
                color: "#ccc",
              },
            },
            axisLabel: {
              show: false,
            },
            anchor: {
              show: false,
            },
            title: {
              show: false,
            },
            detail: false,
            data: [
              {
                value: 40,
              },
            ],
          },
        ],
      };
      this.echarts.setOption(option);
      this.echarts.resize();
    },
  },
};
</script>

<style lang="scss" scoped>
.gauge3d {
  position: relative;
  width: 500px;
  height: 500px;
  background-color: #35399a;
  .vertical_color {
    position: absolute;
    left: 50%;
    width: 370px;
    height: 300px;
    transform: translateX(-50%);
    background: linear-gradient(
      to bottom,
      rgba(228, 228, 228, 0),
      rgba(228, 228, 228, 0.2),
      rgba(228, 228, 228, 0.4),
      rgba(228, 228, 228, 0.2),
      rgba(228, 228, 228, 0)
    );
  }
  #echarts {
    width: 500px;
    height: 500px;
    transform: rotateX(60deg);
  }
}
</style>
