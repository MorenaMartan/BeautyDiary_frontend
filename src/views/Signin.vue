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

select.input {
  cursor: pointer;
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
