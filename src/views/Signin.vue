<template>
  <div class="login">
    <div class="login-box">
      <h1 class="title">Sign In</h1>

      <form class="form">
        <input type="text" placeholder="First name" class="input" />

        <input type="text" placeholder="Last name" class="input" />

        <input type="email" placeholder="Email" class="input" />

        <input type="password" placeholder="Password" class="input" />

        <input type="phone" placeholder="Phone" class="input" />

        <select class="input">
          <option disabled selected>Login as</option>
          <option value="client">Client</option>
          <option value="beautician">Beautician</option>
        </select>

        <button class="btn">Sign in</button>
      </form>
    </div>
  </div>
</template>

<script setup></script>

<style>
.login {
  height: 100vh;
  background-image: url("@/assets/background.png");
  background-size: cover;
  background-position: center;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: "Segoe Script", cursive;
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
