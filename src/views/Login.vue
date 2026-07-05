<template>
  <div class="login">
    <div class="login-box">
      <h1 class="title">Login</h1>

      <form class="form" @submit.prevent="handleLogin">
        <input v-model="username" type="text" placeholder="Username" class="input" />

        <input
          v-model="password"
          type="password"
          placeholder="Password"
          class="input"
        />

        <div v-if="error" class="text-danger small">{{ error }}</div>

        <button class="btn">Log in</button>
      </form>
      <p>
        Don't have an account?
        <router-link to="/signin">Sign in</router-link>
      </p>
      <div class="small text-muted mt-2">
        Admin: Tara/tara, Beautician: Luna/luna, Client: Petra/petra
      </div>
    </div>
  </div>
</template>

<script>
import { login } from "@/data/auth";
import { api } from "@/services/api";

export default {
  data() {
    return {
      username: "",
      password: "",
      error: "",
    };
  },
  methods: {
    async handleLogin() {
      this.error = "";

      try {
        const { user } = await api.login({ username: this.username, password: this.password });
        localStorage.setItem("beautyDiaryUser", JSON.stringify(user));
        this.$router.push("/dashboard");
        return;
      } catch (error) {
        if (!import.meta.env.DEV) {
          this.error = error.message || "Wrong username or password.";
          return;
        }
      }

      const user = login(this.username, this.password);
      if (!user) {
        this.error = "Wrong username or password.";
        return;
      }

      this.$router.push("/dashboard");
    },
  },
};
</script>

<style scoped>
.login {
  height: 100vh;
  background-image: url("@/assets/background.png");
  background-size: cover;
  background-position: center;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: var(--bd-font);
  position: relative;
}

.login::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(255, 248, 246, 0.72), rgba(255, 255, 255, 0.28));
}

.login-box {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(139, 0, 0, 0.14);
  box-shadow: 0 28px 70px rgba(63, 15, 15, 0.18);
  backdrop-filter: blur(16px);
  padding: 42px;
  border-radius: 28px;
  width: 360px;
  text-align: center;
}

.title {
  font-size: 44px;
  color: var(--bd-primary);
  margin-bottom: 30px;
  font-family: var(--bd-brand-font);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input {
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(139, 0, 0, 0.16);
  font-size: 15px;
  background: rgba(255, 255, 255, 0.9);
}

.btn {
  background: linear-gradient(135deg, var(--bd-primary), var(--bd-primary-dark));
  color: white;
  border: none;
  padding: 12px;
  font-size: 16px;
  font-weight: 800;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 14px 30px rgba(139, 0, 0, 0.24);
}

.btn:hover {
  filter: brightness(1.06);
}
</style>
