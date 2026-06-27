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

<style>
.login {
  height: 100vh;
  background-image: url("@/assets/background.png");
  background-size: cover;
  background-position: center;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family:
    system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    "Helvetica Neue",
    Arial,
    sans-serif !important;
}

.login-box {
  background: rgba(255, 255, 255, 0.9);
  padding: 40px;
  border-radius: 12px;
  width: 320px;
  text-align: center;
}

.title {
  font-size: 40px;
  color: #8b0000;
  margin-bottom: 30px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 16px;
}

.btn {
  background: #a40000;
  color: white;
  border: none;
  padding: 10px;
  font-size: 18px;
  border-radius: 8px;
  cursor: pointer;
}

.btn:hover {
  background: #7c0000;
}
</style>
