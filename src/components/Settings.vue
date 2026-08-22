<template>
  <div class="settings-wrapper p-3 main-wrapper">
    <div class="d-flex gap-3 flex-nowrap h-100">
      <div class="card level1-card p-2 flex-shrink-0 text-danger">
        <ul class="list-group list-group-flush">
          <li
            v-for="item in menu"
            :key="item"
            class="list-group-item list-group-item-action text-danger"
            :class="{ activeItem: selectedMenu === item }"
            @click="selectedMenu = item"
          >
            {{ item }}
          </li>
        </ul>
      </div>

      <div class="card level2-card p-3 flex-shrink-0 text-danger">
        <div v-if="selectedMenu === 'Price List'">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <b>Price List</b>
          </div>

            <div class="category-manager mb-3">
              <b>Categories</b>
              <div class="category-add-row mt-2">
                <input
                  v-model="newCategory"
                  class="form-control form-control-sm"
                  placeholder="New category"
                />
                <button class="btn btn-sm btn-danger text-white" @click="addCategory">
                  Add category
                </button>
              </div>
              <div v-for="category in categories" :key="category" class="category-edit-row mt-2">
                <input v-model="categoryNames[category]" class="form-control form-control-sm" />
                <button class="btn btn-sm btn-outline-danger" @click="saveCategory(category)">
                  Save category
                </button>
              </div>
            </div>

          <div class="price-header mb-2">
            <span>Name</span>
            <span>Category</span>
            <span>Price €</span>
            <span>Duration</span>
            <span></span>
          </div>

          <div class="price-row mb-3 add-row">
            <input
              v-model="newTreatment.name"
              class="form-control form-control-sm"
              placeholder="Treatment name"
            />
            <select v-model="newTreatment.specialty" class="form-select form-select-sm">
              <option disabled value="">Category</option>
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
            <input
              v-model.number="newTreatment.price"
              type="number"
              class="form-control form-control-sm"
              placeholder="Price"
            />
            <input
              v-model.number="newTreatment.duration"
              type="number"
              class="form-control form-control-sm"
              placeholder="Duration"
            />
            <button
              class="btn btn-sm btn-danger text-white"
              :disabled="!canAddTreatment"
              @click="addTreatment"
            >
              Add
            </button>
          </div>

          <div
            v-for="t in treatments"
            :key="t.name"
            class="price-row mb-2"
          >
            <input v-model="t.name" class="form-control form-control-sm" />
            <select v-model="t.specialty" class="form-select form-select-sm">
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
            <input
              v-model.number="t.price"
              type="number"
              class="form-control form-control-sm"
            />
            <input
              v-model.number="t.duration"
              type="number"
              class="form-control form-control-sm"
            />
            <div class="d-flex gap-1">
              <button class="btn btn-sm btn-danger text-white" @click="saveTreatment(t)">Save</button>
              <button class="btn btn-sm btn-outline-danger" @click="deleteTreatment(t)">Delete</button>
            </div>
          </div>
        </div>

        <div v-else-if="selectedMenu === 'Clients'" class="clients-settings">
          <div class="settings-section all-clients-section">
            <div class="d-flex justify-content-between align-items-center gap-2">
              <div class="section-title mb-0">Client directory</div>
              <button class="btn btn-sm btn-danger text-white" @click="showAllClients = true">
                All clients
              </button>
            </div>
            <div class="small text-muted mt-2">
              View profiles, diary entries, spending and complete appointment history.
            </div>
          </div>

          <div class="settings-section">
            <div class="section-title">Top 5 spenders last 30 days</div>
            <div
              v-for="c in topSpenders"
              :key="c.id"
              class="client-row"
            >
              <span>{{ c.name }} {{ c.surname }} - {{ c.spentLast30Days }} €</span>
              <button
                class="btn btn-sm btn-outline-danger"
                @click="prepareMail(c, '10% discount')"
              >
                Mail
              </button>
            </div>
          </div>

          <div class="settings-section">
            <div class="section-title">Top 5 cancellations last 90 days</div>
            <div v-for="c in topCancelled" :key="c.id" class="client-row">
              <span>{{ c.name }} {{ c.surname }}</span>
              <span>{{ c.cancelledLast90Days }}</span>
            </div>
          </div>

          <div class="settings-section">
            <div class="section-title">New clients last 30 days</div>
            <div v-for="c in newClients" :key="c.id" class="client-row">
              <span>{{ c.name }} {{ c.surname }}</span>
              <span>{{ c.email }}</span>
            </div>
          </div>

          <div class="settings-section">
            <div class="section-title">Clients without visit last 60 days</div>
            <div
              v-for="c in inactiveClients"
              :key="c.id"
              class="client-row"
            >
              <span>{{ c.name }} {{ c.surname }}</span>
              <button
                class="btn btn-sm btn-outline-danger"
                @click="prepareMail(c, 'Reminder')"
              >
                Mail
              </button>
            </div>
          </div>
        </div>

        <div v-else class="loyalty-settings">
          <h5>Beauty Points</h5>
          <p class="text-muted small">Set how clients earn points and what discount they receive when redeeming them.</p>
          <label class="form-label">Euros spent</label>
          <input v-model.number="loyaltySettings.eurosSpent" type="number" min="1" class="form-control mb-2" />
          <label class="form-label">Points earned</label>
          <input v-model.number="loyaltySettings.pointsEarned" type="number" min="1" class="form-control mb-3" />
          <div class="small text-muted mb-3">Example: every {{ loyaltySettings.eurosSpent || 0 }} € spent earns {{ loyaltySettings.pointsEarned || 0 }} point(s).</div>
          <label class="form-label">Points required for discount</label>
          <input v-model.number="loyaltySettings.pointsRequired" type="number" min="1" class="form-control mb-2" />
          <label class="form-label">Discount percentage</label>
          <input v-model.number="loyaltySettings.discountPercentage" type="number" min="1" max="100" class="form-control mb-3" />
          <button class="btn btn-danger text-white" @click="saveLoyaltySettings">Save Beauty Points rules</button>
        </div>
      </div>
    </div>

    <div v-if="showAllClients" class="modal-backdrop-custom">
      <div class="card client-directory-modal p-3">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <b>All clients</b>
          <button class="btn btn-sm btn-outline-danger" @click="showAllClients = false">Close</button>
        </div>
        <div class="client-directory-layout">
          <div class="client-directory-list">
            <button
              v-for="client in sortedClients"
              :key="client.id"
              class="client-directory-item"
              :class="{ active: selectedClient?.id === client.id }"
              @click="selectedClient = client"
            >
              {{ client.name }} {{ client.surname }}
            </button>
          </div>
          <div v-if="selectedClient" class="client-directory-details">
            <div class="d-flex justify-content-between align-items-start gap-2">
              <div>
                <h5 class="mb-1">{{ selectedClient.name }} {{ selectedClient.surname }}</h5>
                <div class="small text-muted">{{ selectedClient.email || 'No email address' }}</div>
                <div class="small text-muted">{{ selectedClient.mobile || 'No mobile number' }}</div>
              </div>
              <button class="btn btn-sm btn-outline-danger" @click="prepareMail(selectedClient, 'Salon message')">
                Mail
              </button>
            </div>

            <div class="client-stat-grid mt-3">
              <div><span>Total spending</span><b>{{ clientSpending(selectedClient) }} €</b></div>
              <div><span>Appointments</span><b>{{ clientAppointments(selectedClient).length }}</b></div>
              <div><span>Cancelled</span><b>{{ clientCancelledAppointments(selectedClient).length }}</b></div>
            </div>

            <div class="mt-3">
              <b>Diary</b>
              <div v-if="!(selectedClient.diary || []).filter((note) => note.text || note.date).length" class="small text-muted mt-1">
                No diary entries.
              </div>
              <div v-for="(note, index) in selectedClient.diary || []" :key="index" class="diary-entry">
                <template v-if="note.text || note.date">
                  <b>{{ note.date || 'No date' }}</b>
                  <div>{{ note.text }}</div>
                </template>
              </div>
            </div>

            <div class="mt-3">
              <b>All appointments</b>
              <div v-if="!clientAppointments(selectedClient).length" class="small text-muted mt-1">
                No appointments.
              </div>
              <div v-for="appointment in clientAppointments(selectedClient)" :key="appointment.id" class="appointment-entry">
                <div><b>{{ appointment.dayandhour }}</b> — {{ appointment.treatment }}</div>
                <div class="small text-muted">{{ appointment.beautician }} · {{ appointment.status || 'booked' }} · {{ appointment.price || 0 }} €</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="mailDraft" class="modal-backdrop-custom">
      <div class="card mail-modal p-3">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <b>Message for {{ mailDraft.client.name }} {{ mailDraft.client.surname }}</b>
          <button class="btn btn-sm btn-outline-danger" @click="mailDraft = null">Close</button>
        </div>
        <label class="form-label">To</label>
        <input :value="mailDraft.client.email" class="form-control form-control-sm mb-2" disabled />
        <label class="form-label">Subject</label>
        <input v-model="mailDraft.subject" class="form-control form-control-sm mb-2" />
        <label class="form-label">Message</label>
        <textarea v-model="mailDraft.body" rows="8" class="form-control form-control-sm mb-3"></textarea>
        <button class="btn btn-danger text-white" :disabled="!mailDraft.client.email" @click="openMailClient">
          Open email application
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { clients } from "@/data/clientsData";
import { treatments } from "@/data/treatmentsData";
import { specialties } from "@/data/employeesData";
import { getCurrentUser } from "@/data/auth";
import { api } from "@/services/api";

export default {
  props: {
    currentUser: {
      type: Object,
      default: () => getCurrentUser(),
    },
  },
  data() {
    return {
      selectedMenu: "Price List",
      menu: ["Price List", "Clients", "Beauty Points"],
      treatments: [...treatments],
      clients,
      categories: [...specialties],
      categoryNames: Object.fromEntries(specialties.map((category) => [category, category])),
      clientStats: {
        topSpenders: [],
        mostCancelled: [],
        newClients: [],
        inactiveClients: [],
      },
      loyaltySettings: { eurosSpent: 15, pointsEarned: 1, pointsRequired: 10, discountPercentage: 10 },
      newCategory: "",
      appointments: [],
      selectedClient: null,
      showAllClients: false,
      mailDraft: null,
      newTreatment: {
        name: "",
        specialty: "",
        price: null,
        duration: null,
      },
    };
  },
  computed: {
    canAddTreatment() {
      return (
        this.newTreatment.name.trim() &&
        this.newTreatment.specialty &&
        Number(this.newTreatment.price) > 0 &&
        Number(this.newTreatment.duration) > 0
      );
    },
    topSpenders() {
      return this.clientStats.topSpenders;
    },
    topCancelled() {
      return this.clientStats.mostCancelled;
    },
    newClients() {
      return this.clientStats.newClients;
    },
    inactiveClients() {
      return this.clientStats.inactiveClients;
    },
    sortedClients() {
      return [...this.clients].sort((a, b) =>
        `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`),
      );
    },
  },
  methods: {
    async addCategory() {
      const category = this.newCategory.trim();
      if (!category) return;

      try {
        this.categories = await api.createSpecialty(category, this.currentUser.role);
        this.categoryNames = Object.fromEntries(this.categories.map((name) => [name, name]));
        this.newCategory = "";
      } catch (error) {
        alert(error.message);
      }
    },
    async saveLoyaltySettings() {
      try {
        this.loyaltySettings = await api.updateLoyaltySettings(this.loyaltySettings);
        alert("Beauty Points rules saved.");
      } catch (error) {
        alert(error.message);
      }
    },
    async saveCategory(currentName) {
      const name = this.categoryNames[currentName]?.trim();
      if (!name || name === currentName) return;

      try {
        await api.updateSpecialty(currentName, name, this.currentUser.role);
        this.categories = this.categories.map((category) => (category === currentName ? name : category));
        this.treatments.forEach((treatment) => {
          if (treatment.specialty === currentName) treatment.specialty = name;
        });
        this.categoryNames = Object.fromEntries(this.categories.map((category) => [category, category]));
      } catch (error) {
        alert(error.message);
      }
    },
    async addTreatment() {
      if (!this.canAddTreatment) return;

      try {
        const treatment = await api.createTreatment(this.newTreatment, this.currentUser.role);
        this.treatments.push(treatment);
        this.newTreatment = { name: "", specialty: "", price: null, duration: null };
      } catch (error) {
        alert(error.message);
      }
    },
    async saveTreatment(treatment) {
      if (!treatment.id) {
        alert("This treatment is not saved in the database.");
        return;
      }

      try {
        const savedTreatment = await api.updateTreatment(treatment.id, treatment, this.currentUser.role);
        Object.assign(treatment, savedTreatment);
      } catch (error) {
        alert(error.message);
      }
    },
    async deleteTreatment(treatment) {
      if (!treatment.id || !confirm(`Delete treatment \"${treatment.name}\"?`)) return;

      try {
        await api.deleteTreatment(treatment.id, this.currentUser.role);
        this.treatments = this.treatments.filter((item) => item.id !== treatment.id);
      } catch (error) {
        alert(error.message);
      }
    },
    clientAppointments(client) {
      return this.appointments
        .filter(
          (appointment) =>
            appointment.client_name === client.name && appointment.client_surname === client.surname,
        )
        .sort((a, b) => new Date(b.dayandhour) - new Date(a.dayandhour));
    },
    clientCancelledAppointments(client) {
      return this.clientAppointments(client).filter((appointment) => appointment.status === "cancelled");
    },
    clientSpending(client) {
      return this.clientAppointments(client)
        .filter((appointment) => appointment.status !== "cancelled")
        .reduce((total, appointment) => total + Number(appointment.earningsAmount ?? appointment.price ?? 0), 0);
    },
    prepareMail(client, subject) {
      if (!client.email) {
        alert("This client does not have an email address.");
        return;
      }

      this.mailDraft = {
        client,
        subject,
        body: `Dear ${client.name},\n\nWe are contacting you from Beauty Diary.\n\nBest regards,\nBeauty Diary`,
      };
    },
    openMailClient() {
      const { client, subject, body } = this.mailDraft;
      window.location.href = `mailto:${encodeURIComponent(client.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      this.mailDraft = null;
    },
  },
  async mounted() {
    try {
      const [savedTreatments, savedCategories, savedClients, savedAppointments, clientStats, loyaltySettings] = await Promise.all([
        api.getTreatments(),
        api.getSpecialties(),
        api.getClients(),
        api.getAppointments(),
        api.getClientStats(),
        api.getLoyaltySettings(),
      ]);
      this.treatments = savedTreatments;
      this.categories = savedCategories;
      this.categoryNames = Object.fromEntries(savedCategories.map((category) => [category, category]));
      this.clients = savedClients;
      this.appointments = savedAppointments;
      this.clientStats = clientStats;
      this.loyaltySettings = loyaltySettings;
      this.selectedClient = this.sortedClients[0] || null;
    } catch (error) {
      console.error(error);
    }
  },
};
</script>

<style scoped>
.settings-wrapper {
  height: 70vh;
  max-height: 70vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.card {
  border-radius: 12px;
  overflow-y: auto;
}
.level1-card {
  width: 220px;
  max-height: 100%;
}
.level2-card {
  width: 620px;
  max-height: 100%;
}
.list-group-item {
  cursor: pointer;
}
.activeItem {
  background-color: #8b0000 !important;
  color: white !important;
  border-radius: 8px;
}
.price-header,
.price-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 130px;
  gap: 10px;
  align-items: center;
}
.category-manager {
  border-bottom: 1px solid rgba(139, 0, 0, 0.2);
  padding-bottom: 12px;
}
.category-add-row,
.category-edit-row {
  display: flex;
  gap: 10px;
}
.add-row {
  border-bottom: 1px solid rgba(139, 0, 0, 0.2);
  padding-bottom: 12px;
}
.price-header {
  font-weight: bold;
  font-size: 14px;
  color: #8b0000;
}
.clients-settings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.settings-section {
  background: rgba(139, 0, 0, 0.08);
  border-radius: 10px;
  padding: 12px;
}
.section-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: #8b0000;
}
.client-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(139, 0, 0, 0.12);
  font-size: 14px;
}
.btn-danger {
  background: #8b0000;
  border: none;
}
.btn-outline-danger {
  color: #8b0000;
  border-color: #8b0000;
}
.all-clients-section {
  grid-column: 1 / -1;
}
.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.45);
}
.client-directory-modal,
.mail-modal {
  width: min(960px, 100%);
  max-height: calc(100vh - 40px);
  color: #212529;
  overflow: auto;
}
.mail-modal {
  width: min(600px, 100%);
}
.client-directory-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  min-height: 420px;
}
.client-directory-list {
  border-right: 1px solid #dee2e6;
  overflow-y: auto;
  padding-right: 10px;
}
.client-directory-item {
  width: 100%;
  border: 0;
  border-radius: 6px;
  background: transparent;
  padding: 8px;
  text-align: left;
}
.client-directory-item:hover,
.client-directory-item.active {
  background: rgba(139, 0, 0, 0.1);
}
.client-directory-details {
  overflow-y: auto;
  padding-left: 20px;
}
.client-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.client-stat-grid div {
  border-radius: 8px;
  background: rgba(139, 0, 0, 0.08);
  padding: 10px;
}
.client-stat-grid span,
.client-stat-grid b {
  display: block;
}
.client-stat-grid span {
  font-size: 12px;
}
.diary-entry,
.appointment-entry {
  border-bottom: 1px solid #e9ecef;
  padding: 8px 0;
}
@media (max-width: 700px) {
  .client-directory-layout {
    grid-template-columns: 1fr;
  }
  .client-directory-list {
    max-height: 160px;
    border-right: 0;
    border-bottom: 1px solid #dee2e6;
  }
  .client-directory-details {
    padding: 16px 0 0;
  }
  .client-stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
