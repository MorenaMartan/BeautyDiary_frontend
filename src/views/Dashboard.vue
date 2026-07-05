<template>
  <div
    class="container-fluid vh-100 dashboard-root"
    :style="{
      backgroundImage: `url(${background})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }"
  >
    <div class="dashboard-shell h-100">
      <aside class="dashboard-sidebar" :class="{ 'mobile-menu-open': isMobileMenuOpen }">
        <div class="brand-block">
          <h3 class="title">Beauty Diary</h3>
          <div class="brand-subtitle">Salon management</div>
        </div>

        <nav class="nav flex-column">
          <a
            v-for="item in menuItems"
            :key="item.name"
            class="nav-link"
            :class="{ active: activeComponent === item.name }"
            @click="selectMenuItem(item.name)"
            >{{ item.label }}</a
          >
        </nav>
      </aside>

      <main class="dashboard-main">
        <div
          class="user-panel d-flex align-items-center justify-content-between mb-3"
        >
          <div>
            <div class="eyebrow">Workspace</div>
            <div class="active-title">
              {{ activeComponent }}
            </div>
          </div>

          <div class="d-flex align-items-center gap-2">
            <button class="btn-no-border mobile-menu-btn" @click="isMobileMenuOpen = !isMobileMenuOpen">
              ☰ Menu
            </button>
            <button class="btn-no-border user-btn" @click="openProfile">
              {{ currentUser.name }} ({{ currentUser.role }})
            </button>
            <button class="btn-no-border logout-btn" @click="handleLogout">
              Log out
            </button>
          </div>
        </div>

        <div class="workspace-panel">
          <component
            :is="activeView"
            :current-user="currentUser"
            :mode="activeComponent === 'New treatment' ? 'new' : 'list'"
          />
        </div>
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
      isMobileMenuOpen: false,
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
    selectMenuItem(name) {
      this.activeComponent = name;
      this.isMobileMenuOpen = false;
    },

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
  font-family: var(--bd-font);
  color: var(--bd-text);
}

.dashboard-root {
  overflow: hidden;
  padding: 18px;
  position: relative;
}

.dashboard-root::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(120deg, rgba(255, 248, 246, 0.78), rgba(255, 255, 255, 0.38)),
    radial-gradient(circle at top right, rgba(139, 0, 0, 0.12), transparent 30%);
  pointer-events: none;
}

.dashboard-shell {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 18px;
}

.dashboard-sidebar {
  min-height: 0;
  padding: 24px 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(139, 0, 0, 0.14);
  border-radius: 28px;
  box-shadow: 0 24px 55px rgba(63, 15, 15, 0.16);
  backdrop-filter: blur(18px);
  overflow: hidden;
}

.brand-block {
  margin-bottom: 26px;
  text-align: center;
}

.dashboard-main {
  max-height: calc(100vh - 36px);
  overflow: hidden;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.nav-link,
.nav-link:link,
.nav-link:visited {
  color: var(--bd-primary) !important;
  border-radius: 16px;
  margin-bottom: 8px;
  padding: 11px 14px;
  cursor: pointer;
  display: block;
  text-decoration: none;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: all 0.18s ease;
}

.nav-link.active,
.nav-link.active:link,
.nav-link.active:visited,
.nav-link:hover,
.nav-link:focus {
  background: linear-gradient(135deg, var(--bd-primary), var(--bd-primary-dark)) !important;
  color: white !important;
  box-shadow: 0 12px 24px rgba(139, 0, 0, 0.2);
}

.btn-no-border {
  background-color: rgba(255, 255, 255, 0.7) !important;
  color: var(--bd-primary) !important;
  border: 1px solid rgba(139, 0, 0, 0.14) !important;
  padding: 8px 14px;
  font-size: 14px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.18s ease;
}
.btn-no-border:hover,
.btn-no-border:focus,
.btn-no-border:active {
  background-color: white !important;
  color: var(--bd-primary-dark) !important;
  border-color: rgba(139, 0, 0, 0.24) !important;
  box-shadow: 0 10px 22px rgba(63, 15, 15, 0.12) !important;
}

.user-btn {
  font-size: 14px;
}

.logout-btn {
  font-size: 14px;
  background: rgba(139, 0, 0, 0.08) !important;
}

.mobile-menu-btn {
  display: none;
}

.title {
  font-family: var(--bd-brand-font);
  font-size: 42px;
  font-weight: 700;
  color: var(--bd-primary);
  margin: 0;
}
.brand-subtitle {
  margin-top: 4px;
  color: var(--bd-muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.user-panel {
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(139, 0, 0, 0.14);
  border-radius: 24px;
  box-shadow: 0 16px 38px rgba(63, 15, 15, 0.12);
  backdrop-filter: blur(18px);
}
.eyebrow {
  color: var(--bd-muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.active-title {
  font-size: 30px;
  font-weight: 800;
  color: var(--bd-primary);
  line-height: 1.1;
  margin: 0;
  text-align: left;
}

.workspace-panel {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.48);
  border: 1px solid rgba(139, 0, 0, 0.12);
  border-radius: 28px;
  box-shadow: 0 24px 55px rgba(63, 15, 15, 0.12);
  backdrop-filter: blur(14px);
}

table {
  border-radius: 16px;
}
.table {
  border-radius: 16px;
}
thead th {
  background: white;
  color: var(--bd-primary);
}
table td {
  background: rgba(255, 255, 255, 0.7);
  color: var(--bd-primary);
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
  background: rgba(36, 12, 12, 0.35);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  backdrop-filter: blur(4px);
}

.profile-card {
  width: 390px;
  border-radius: 22px;
  color: var(--bd-primary);
}

@media (max-width: 992px) {
  .dashboard-root {
    padding: 12px;
    overflow: auto;
  }

  .dashboard-shell {
    grid-template-columns: 1fr;
    min-height: 100%;
    gap: 12px;
  }

  .dashboard-sidebar {
    display: none;
    padding: 14px;
    border-radius: 22px;
  }

  .dashboard-sidebar.mobile-menu-open {
    display: block;
  }

  .brand-block {
    margin-bottom: 12px;
  }

  .title {
    font-size: 34px;
  }

  .brand-subtitle {
    font-size: 10px;
  }

  .nav.flex-column {
    gap: 6px;
    max-height: 46vh;
    overflow-y: auto;
    padding-right: 2px;
    scrollbar-width: thin;
  }

  .nav-link,
  .nav-link:link,
  .nav-link:visited {
    margin-bottom: 0;
    padding: 10px 13px;
    font-size: 14px;
  }

  .mobile-menu-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .dashboard-main {
    max-height: none;
    min-height: 0;
  }

  .user-panel {
    gap: 12px;
    align-items: flex-start !important;
    border-radius: 20px;
  }

  .active-title {
    font-size: 24px;
  }

  .workspace-panel {
    border-radius: 22px;
    overflow: auto;
  }
}

@media (max-width: 576px) {
  .dashboard-root {
    padding: 8px;
  }

  .dashboard-sidebar {
    padding: 12px;
  }

  .brand-block {
    text-align: left;
  }

  .title {
    font-size: 30px;
  }

  .user-panel {
    flex-direction: column;
    padding: 14px;
  }

  .user-panel > .d-flex {
    width: 100%;
    flex-wrap: wrap;
  }

  .btn-no-border {
    flex: 1 1 auto;
    min-width: 120px;
  }

  .active-title {
    font-size: 22px;
  }

  .workspace-panel {
    border-radius: 18px;
  }
}
</style>
