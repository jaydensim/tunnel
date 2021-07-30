import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import App from '../views/App.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'App',
    component: App
  },
  {
    path: '/about',
    name: 'About',
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
