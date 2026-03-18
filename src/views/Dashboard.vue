<template>
  <div
    class="container-fluid vh-100"
    :style="{
      backgroundImage: `url(${background})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }"
  >
    <div class="row h-100">
      <aside class="col-2 p-4">
        <h3 class="text-center mb-4 title">Beauty Diary</h3>

        <nav class="nav flex-column">
          <a
            class="nav-link"
            :class="{ active: activeComponent === 'Calendar' }"
            @click="activeComponent = 'Calendar'"
            >Calendar</a
          >
          <a
            class="nav-link"
            :class="{ active: activeComponent === 'Employees' }"
            @click="activeComponent = 'Employees'"
            >Employees</a
          >
          <a
            class="nav-link"
            :class="{ active: activeComponent === 'Clients' }"
            @click="activeComponent = 'Clients'"
            >Clients</a
          >
          <a
            class="nav-link"
            :class="{ active: activeComponent === 'Sales' }"
            @click="activeComponent = 'Sales'"
            >Sales</a
          >
          <a
            class="nav-link"
            :class="{ active: activeComponent === 'Settings' }"
            @click="activeComponent = 'Settings'"
            >Settings</a
          >
        </nav>
      </aside>

      <main class="col p-4">
        <div
          class="user-panel d-flex align-items-center justify-content-between mb-3"
        >
          <div class="active-title">
            {{ activeComponent }}
          </div>

          <div class="d-flex align-items-center gap-2">
            <button class="btn-no-border menu-btn" @click="openMenu">☰</button>
            <button class="btn-no-border user-btn" @click="openProfile">
              Tara (Admin)
            </button>
            <button class="btn-no-border logout-btn" @click="logout">
              Log out
            </button>
          </div>
        </div>

        <component :is="components[activeComponent]" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import background from "@/assets/background.png";

import Calendar from "@/components/Calendar.vue";
import Employees from "@/components/Employees.vue";
import Clients from "@/components/Clients.vue";
import Sales from "@/components/Sales.vue";
import Settings from "@/components/Settings.vue";

const router = useRouter();
const activeComponent = ref("Calendar");

const openMenu = () => console.log("Menu clicked");
const openProfile = () => console.log("Profile clicked");
const logout = () => router.push("/");

const components = {
  Calendar,
  Employees,
  Clients,
  Sales,
  Settings,
};
</script>

<style scoped>
* {
  font-family: "Dancing Script", cursive;
  color: #8b0000;
}

.nav-link,
.nav-link:link,
.nav-link:visited {
  color: #8b0000 !important;
  border-radius: 10px;
  margin-bottom: 8px;
  padding: 6px 12px;
  cursor: pointer;
  display: block;
  text-decoration: none;
  transition: none;
}

.nav-link.active,
.nav-link.active:link,
.nav-link.active:visited,
.nav-link:hover,
.nav-link:focus {
  background-color: #8b0000 !important;
  color: white !important;
}

.btn-no-border {
  background-color: transparent !important;
  color: #8b0000 !important;
  border: none !important;
  padding: 6px 12px;
  font-size: 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: none;
}
.btn-no-border:hover,
.btn-no-border:focus,
.btn-no-border:active {
  background-color: transparent !important;
  color: #8b0000 !important;
  border: none !important;
  box-shadow: none !important;
  transform: none !important;
}

.menu-btn {
  font-size: 20px;
}

.user-btn {
  font-size: 18px;
}

.logout-btn {
  font-size: 14px;
}

.title {
  font-family: "Brush Script MT", cursive;
  font-size: 40px;
  font-weight: 700;
}
.active-title {
  font-size: 28px;
  font-weight: 400;
  color: #8b0000;
  margin-bottom: 10px;
  text-align: left;
}

table {
  border-radius: 16px;
}
.table {
  border-radius: 16px;
}
thead th {
  background: white;
  color: #8b0000;
}
table td {
  background: rgba(255, 255, 255, 0.7);
  color: #8b0000;
}

table th,
table td {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  text-align: center;
}

.table-responsive::-webkit-scrollbar {
  width: 8px;
}
.table-responsive::-webkit-scrollbar-thumb {
  background: #8b0000;
  border-radius: 10px;
}
</style>
