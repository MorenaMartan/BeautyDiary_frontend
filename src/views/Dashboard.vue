<template>
  <div
    class="container-fluid vh-100 dashboard-root"
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
            v-for="item in menuItems"
            :key="item.name"
            class="nav-link"
            :class="{ active: activeComponent === item.name }"
            @click="activeComponent = item.name"
            >{{ item.label }}</a
          >
        </nav>
      </aside>

      <main class="col p-4 dashboard-main">
        <div
          class="user-panel d-flex align-items-center justify-content-between mb-3"
        >
          <div class="active-title">
            {{ activeComponent }}
          </div>

          <div class="d-flex align-items-center gap-2">
            <button class="btn-no-border menu-btn" @click="openMenu">☰</button>
            <button class="btn-no-border user-btn" @click="openProfile">
              {{ currentUser.name }} ({{ currentUser.role }})
            </button>
            <button class="btn-no-border logout-btn" @click="handleLogout">
              Log out
            </button>
          </div>
        </div>

        <component
          :is="activeView"
          :current-user="currentUser"
          :mode="activeComponent === 'New treatment' ? 'new' : 'list'"
        />
      </main>
    </div>

    <div v-if="showProfileModal" class="profile-backdrop">
      <div class="card profile-card p-3">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <b>Edit profile</b>
          <button class="btn btn-sm btn-outline-danger" @click="showProfileModal = false">
            x
          </button>
        </div>

        <label class="form-label fw-bold mb-1">Name</label>
        <input v-model="profileForm.name" class="form-control form-control-sm mb-2" />

        <label class="form-label fw-bold mb-1">Surname</label>
        <input v-model="profileForm.surname" class="form-control form-control-sm mb-2" />

        <label class="form-label fw-bold mb-1">Email</label>
        <input v-model="profileForm.email" type="email" class="form-control form-control-sm mb-2" />

        <label class="form-label fw-bold mb-1">Mobile</label>
        <input v-model="profileForm.mobile" class="form-control form-control-sm mb-2" />

        <template v-if="currentUser.role === 'Client'">
          <label class="form-label fw-bold mb-1">Password</label>
          <input
            v-model="profileForm.password"
            type="password"
            class="form-control form-control-sm mb-2"
          />

          <label class="form-label fw-bold mb-1">Birthday</label>
          <input
            v-model="profileForm.birthday"
            type="date"
            class="form-control form-control-sm mb-3"
          />
        </template>

        <button class="btn btn-danger text-white" @click="saveProfile">
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import background from "@/assets/background.png";

import Calendar from "@/components/Calendar.vue";
import Employees from "@/components/Employees.vue";
import Clients from "@/components/Clients.vue";
import Sales from "@/components/Sales.vue";
import Settings from "@/components/Settings.vue";
import ClientAppointments from "@/components/ClientAppointments.vue";
import Reviews from "@/components/Reviews.vue";
import Earnings from "@/components/Earnings.vue";
import ProductOrders from "@/components/ProductOrders.vue";
import { getCurrentUser, logout } from "@/data/auth";
import { clients } from "@/data/clientsData";
import { employeesData } from "@/data/employeesData";
import { api } from "@/services/api";

export default {
  data() {
    const currentUser = getCurrentUser();
    return {
      activeComponent: "Calendar",
      currentUser,
      showProfileModal: false,
      profileForm: {
        name: "",
        surname: "",
        email: "",
        mobile: "",
        password: "",
        birthday: "",
      },
      background,
      components: {
        Calendar,
        Employees,
        Clients,
        Sales,
        Settings,
        Treatments: ClientAppointments,
        "New treatment": ClientAppointments,
        Reviews,
        Earnings,
        "Product orders": ProductOrders,
      },
    };
  },

  computed: {
    activeView() {
      return this.components[this.activeComponent];
    },
    menuItems() {
      if (this.currentUser.role === "Client") {
        return [
          { name: "Calendar", label: "Calendar" },
          { name: "Treatments", label: "Treatments" },
          { name: "New treatment", label: "New treatment" },
        ];
      }

      const items = [
        { name: "Calendar", label: "Calendar" },
        { name: "Clients", label: "Clients" },
        { name: "Reviews", label: "Reviews" },
        { name: "Earnings", label: "Earnings" },
        { name: "Product orders", label: "Product orders" },
      ];

      if (this.currentUser.role === "Admin") {
        items.splice(1, 0, { name: "Employees", label: "Employees" });
        items.push({ name: "Sales", label: "Sales" });
        items.push({ name: "Settings", label: "Settings" });
      }

      return items;
    },
  },

  methods: {
    openMenu() {
      console.log("Menu clicked");
    },

    async openProfile() {
      const user = this.currentUser.role === "Client"
        ? await this.findCurrentClient()
        : await this.findCurrentEmployee();

      if (!user) return;

      this.profileForm = {
        name: user.name || "",
        surname: user.surname || "",
        email: user.email || "",
        mobile: user.mobile || "",
        password: user.password?.startsWith("[") ? user.name.toLowerCase() : user.password || "",
        birthday: user.birthday || "",
      };
      this.showProfileModal = true;
    },

    async findCurrentClient() {
      try {
        const savedClients = await api.getClients();
        return (
          savedClients.find((c) => c.id === this.currentUser.id) ||
          savedClients.find((c) => c.username === this.currentUser.username)
        );
      } catch (error) {
        return (
          clients.find((c) => c.id === this.currentUser.id) ||
          clients.find((c) => c.username === this.currentUser.username)
        );
      }
    },

    async findCurrentEmployee() {
      try {
        const employees = await api.getEmployees();
        return (
          employees.find((e) => e.id === this.currentUser.id) ||
          employees.find((e) => e.username === this.currentUser.username)
        );
      } catch (error) {
        return employeesData.find((e) => e.username === this.currentUser.username);
      }
    },

    async saveProfile() {
      const data = {
        name: this.profileForm.name,
        surname: this.profileForm.surname,
        email: this.profileForm.email,
        mobile: this.profileForm.mobile,
      };

      let savedUser;

      try {
        if (this.currentUser.role === "Client") {
          const client = await this.findCurrentClient();
          if (!client) return;
          savedUser = await api.updateClient(client.id, {
            ...data,
            password: this.profileForm.password,
            birthday: this.profileForm.birthday,
            username: this.profileForm.name,
          });
        } else {
          const employee = await this.findCurrentEmployee();
          if (!employee) return;
          savedUser = await api.updateEmployeeProfile(employee.id, data);
        }
      } catch (error) {
        alert(error.message);
        return;
      }

      this.currentUser = {
        ...this.currentUser,
        id: savedUser.id,
        name: savedUser.name,
        surname: savedUser.surname,
        username: savedUser.username,
      };

      localStorage.setItem("beautyDiaryUser", JSON.stringify(this.currentUser));
      this.showProfileModal = false;
    },

    handleLogout() {
      logout();
      this.$router.push("/");
    },
  },
};
</script>

<style scoped>
* {
  font-family: "Dancing Script", cursive;
  color: #8b0000;
}

.dashboard-root {
  overflow: hidden;
}

.dashboard-main {
  max-height: 100vh;
  overflow: hidden;
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

.profile-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.profile-card {
  width: 360px;
  border-radius: 12px;
  color: #8b0000;
}
</style>
