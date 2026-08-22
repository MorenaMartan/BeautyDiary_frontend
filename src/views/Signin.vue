<template>
  <div class="login">
    <div class="login-box">
      <h1 class="title">Sign In</h1>

      <form class="form" @submit.prevent="signIn">
        <input v-model.trim="form.name" type="text" placeholder="First name" class="input" required autocomplete="given-name" />

        <input v-model.trim="form.surname" type="text" placeholder="Last name" class="input" required autocomplete="family-name" />

        <input v-model.trim="form.email" type="email" placeholder="Email" class="input" required autocomplete="email" />

        <input
          v-model="form.password"
          type="password"
          placeholder="Password"
          class="input"
          required
          minlength="8"
          autocomplete="new-password"
        />

        <input v-model.trim="form.mobile" type="tel" placeholder="Phone" class="input" autocomplete="tel" />

        <button class="btn" :disabled="isSubmitting">{{ isSubmitting ? "Creating account…" : "Sign up" }}</button>
        <div v-if="error" class="text-danger small">{{ error }}</div>
      </form>
    </div>
  </div>
</template>

<script>
import { saveSession } from "@/data/auth";
import { api } from "@/services/api";

export default {
  data() {
    return {
      form: {
        name: "",
        surname: "",
        email: "",
        password: "",
        mobile: "",
      },
      error: "",
      isSubmitting: false,
    };
  },
  methods: {
    async signIn() {
      this.error = "";
      this.isSubmitting = true;
      try {
        const { user, token } = await api.signup({
          ...this.form,
          username: this.form.name,
        });
        saveSession(user, token);
        this.$router.push("/dashboard");
      } catch (error) {
        this.error = error.message || "Unable to create the account.";
      } finally {
        this.isSubmitting = false;
      }
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
  width: 380px;
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

select.input {
  cursor: pointer;
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
