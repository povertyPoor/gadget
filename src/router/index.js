import Vue from 'vue'
import Router from 'vue-router'
/* Layout */
import Layout from '@/layout'

Vue.use(Router)

export const constantRoutes = [
  {
    path: '/',
    component: Layout,
    redirect: '/首页',
    children: [{
      path: '首页',
      name: '首页',
      component: () => import('@/views/dashboard/index'),
      meta: { title: '首页' }
    }]
  },

  {
    path: '/css',
    component: Layout,
    children: [
      {
        path: '',
        name: 'css',
        component: () => import('@/views/cssPage/index'),
        meta: { title: 'Css' }
      }
    ]
  },
  {
    path: '/ECharts',
    component: Layout,
    children: [
      {
        path: '',
        name: 'ECharts',
        component: () => import('@/views/ECharts/index'),
        meta: { title: 'ECharts' }
      }
    ]
  },
  {
    path: '/DeepSeek',
    component: Layout,
    children: [
      {
        path: '',
        name: 'DeepSeek',
        component: () => import('@/views/DeepSeek/index'),
        meta: { title: 'DeepSeek' }
      }
    ]
  },
  {
    path: '/screenshot',
    component: Layout,
    children: [
      {
        path: '',
        name: 'screenshot',
        component: () => import('@/views/screenshot/index'),
        meta: { title: 'screenshot' }
      }
    ]
  },
  {
    path: '/CodeBuddy',
    component: Layout,
    children: [
      {
        path: '',
        name: 'CodeBuddy',
        component: () => import('@/views/CodeBuddy/index'),
        meta: { title: 'CodeBuddy' }
      }
    ]
  }
]

const createRouter = () => new Router({
  mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router
