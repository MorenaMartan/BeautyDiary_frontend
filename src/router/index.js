import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Login from "../views/Login.vue";
import Signin from "../views/Signin.vue";
import { getCurrentUser } from "@/data/auth";

const routes = [
  {
    path: "/",
    component: Home,
  },
  {
    path: "/login",
    component: Login,
  },
  {
    path: "/signin",
    component: Signin,
  },
  {
    path: "/dashboard",
    component: () => import("../views/Dashboard.vue"),
    meta: { requiresAuth: true },
  },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !getCurrentUser()) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }

  if ((to.path === "/login" || to.path === "/signin") && getCurrentUser()) {
    return "/dashboard";
  }
});

export default router;
