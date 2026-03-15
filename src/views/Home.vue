<template>
  <div class="home">
    <div class="overlay">
      <h1 class="title">
        Welcome to your <br />
        Beauty diary
      </h1>

      <div class="buttons">
        <router-link to="/login">
          <button class="btn outline">Log in</button>
        </router-link>

        <router-link to="/signin">
          <button class="btn outline">Sign in</button>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup></script>

<style>
.home {
  height: 100vh;
  width: 100%;
  background-image: url("@/assets/background.png");
  background-size: cover;
  background-position: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.overlay {
  text-align: center;
  backdrop-filter: blur(3px);
  padding: 40px;
}

.title {
  font-size: 72px;
  color: #8b0000;
  margin-bottom: 50px;
  font-family: "Brush Script MT", cursive;
  letter-spacing: 2px;
}

.buttons {
  display: flex;
  justify-content: center;
  gap: 25px;
}

.btn {
  background: #a40000;
  color: white;
  border: none;
  padding: 14px 36px;
  font-size: 18px;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: "Segoe UI", sans-serif;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}

.btn:hover {
  background: #7c0000;
  transform: translateY(-3px);
}

.btn.outline {
  background: transparent;
  border: 2px solid #a40000;
  color: #a40000;
}

.btn.outline:hover {
  background: #a40000;
  color: white;
}
</style>
