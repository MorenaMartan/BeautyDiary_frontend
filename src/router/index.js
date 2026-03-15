import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Login from "../views/Login.vue";
import Signin from "../views/Signin.vue";

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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
