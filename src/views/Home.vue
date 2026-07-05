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

<style scoped>
.home {
  height: 100vh;
  width: 100%;
  background-image: url("@/assets/background.png");
  background-size: cover;
  background-position: center;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  font-family: var(--bd-font);
}

.home::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(115deg, rgba(255, 250, 248, 0.72), rgba(255, 255, 255, 0.2)),
    radial-gradient(circle at 50% 30%, rgba(139, 0, 0, 0.12), transparent 32%);
}

.overlay {
  position: relative;
  z-index: 1;
  text-align: center;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(139, 0, 0, 0.14);
  border-radius: 34px;
  box-shadow: 0 28px 70px rgba(63, 15, 15, 0.18);
  backdrop-filter: blur(16px);
  padding: 54px 64px;
}

.title {
  font-size: clamp(56px, 8vw, 92px);
  color: var(--bd-primary);
  margin-bottom: 38px;
  font-family: var(--bd-brand-font);
  letter-spacing: 2px;
  line-height: 0.95;
  text-shadow: 0 10px 26px rgba(139, 0, 0, 0.12);
}

.buttons {
  display: flex;
  justify-content: center;
  gap: 25px;
}

.btn,
.btn.outline {
  background: linear-gradient(135deg, var(--bd-primary), var(--bd-primary-dark)) !important;
  color: white !important;
  border: none !important;
  padding: 12px 34px;
  font-size: 14px;
  border-radius: 30px;
  cursor: pointer;
  font-family: var(--bd-font);
  font-weight: 800;
  box-shadow: 0 14px 30px rgba(139, 0, 0, 0.24);
  transition: all 0.18s ease;
}

.btn:hover {
  filter: brightness(1.06);
  transform: translateY(-2px);
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
.btn:hover,
.btn:focus,
.btn:active,
.btn.outline:hover,
.btn.outline:focus,
.btn.outline:active {
  background-color: var(--bd-primary) !important;
  color: white !important;
  box-shadow: 0 14px 30px rgba(139, 0, 0, 0.24) !important;
  border: none !important;
}
</style>
