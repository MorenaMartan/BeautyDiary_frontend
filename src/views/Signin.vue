<template>
  <div class="login">
    <div class="login-box">
      <h1 class="title">Sign In</h1>

      <form class="form" @submit.prevent="signIn">
        <input v-model="form.name" type="text" placeholder="First name" class="input" />

        <input v-model="form.surname" type="text" placeholder="Last name" class="input" />

        <input v-model="form.email" type="email" placeholder="Email" class="input" />

        <input
          v-model="form.password"
          type="password"
          placeholder="Password"
          class="input"
        />

        <input v-model="form.mobile" type="phone" placeholder="Phone" class="input" />

        <select v-model="form.role" class="input">
          <option value="Client">Client</option>
        </select>

        <button class="btn">Sign in</button>
      </form>
    </div>
  </div>
</template>

<script>
import { clients, createClient } from "@/data/clientsData";
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
        role: "Client",
      },
    };
  },
  methods: {
    async signIn() {
      try {
        const { user } = await api.signup({
          ...this.form,
          username: this.form.name,
          password: this.form.password || this.form.name.toLowerCase(),
        });
        localStorage.setItem("beautyDiaryUser", JSON.stringify(user));
        this.$router.push("/dashboard");
        return;
      } catch (error) {
        if (!import.meta.env.DEV) {
          alert(error.message);
          return;
        }
      }

      const client = createClient({
        ...this.form,
        username: this.form.name,
        password: this.form.password || this.form.name.toLowerCase(),
      });
      clients.push(client);
      localStorage.setItem(
        "beautyDiaryUser",
        JSON.stringify({
          id: client.id,
          name: client.name,
          surname: client.surname,
          username: client.username,
          role: "Client",
          type: "client",
        }),
      );
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
