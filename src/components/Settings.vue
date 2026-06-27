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

          <div class="price-header mb-2">
            <span>Name</span>
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
            v-for="(t, index) in treatments"
            :key="t.name"
            class="price-row mb-2"
          >
            <input v-model="t.name" class="form-control form-control-sm" />
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
            <button class="btn btn-sm btn-outline-danger" @click="deleteTreatment(index)
              ">
              Delete
            </button>
          </div>
        </div>

        <div v-else class="clients-settings">
          <div class="settings-section">
            <div class="section-title">Top 5 spenders last 30 days</div>
            <div
              v-for="c in topSpenders"
              :key="c.id"
              class="client-row"
            >
              <span>{{ c.name }} {{ c.surname }} - {{ c.wallet }} €</span>
              <button
                class="btn btn-sm btn-outline-danger"
                @click="sendMail(c, '10% discount')"
              >
                Mail
              </button>
            </div>
          </div>

          <div class="settings-section">
            <div class="section-title">Top 5 cancellations last 90 days</div>
            <div v-for="c in topCancelled" :key="c.id" class="client-row">
              <span>{{ c.name }} {{ c.surname }}</span>
              <span>{{ c.cancelled }}</span>
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
                @click="sendMail(c, 'Reminder')"
              >
                Mail
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { clients } from "@/data/clientsData";
import { treatments } from "@/data/treatmentsData";

export default {
  data() {
    return {
      selectedMenu: "Price List",
      menu: ["Price List", "Clients"],
      treatments,
      clients,
      newTreatment: {
        name: "",
        price: null,
        duration: null,
      },
    };
  },
  computed: {
    canAddTreatment() {
      return (
        this.newTreatment.name.trim() &&
        Number(this.newTreatment.price) > 0 &&
        Number(this.newTreatment.duration) > 0
      );
    },
    topSpenders() {
      return [...this.clients].sort((a, b) => b.wallet - a.wallet).slice(0, 5);
    },
    topCancelled() {
      return [...this.clients].sort((a, b) => b.cancelled - a.cancelled).slice(0, 5);
    },
    newClients() {
      return this.clients.slice(-5);
    },
    inactiveClients() {
      return this.clients.slice(0, 5);
    },
  },
  methods: {
    addTreatment() {
      if (!this.canAddTreatment) return;

      this.treatments.push({
        name: this.newTreatment.name.trim(),
        specialty: "Facial",
        price: Number(this.newTreatment.price),
        duration: Number(this.newTreatment.duration),
      });

      this.newTreatment = {
        name: "",
        price: null,
        duration: null,
      };
    },
    deleteTreatment(index) {
      this.treatments.splice(index, 1);
    },
    sendMail(client, subject) {
      window.location.href = `mailto:${client.email}?subject=${encodeURIComponent(subject)}`;
    },
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
  grid-template-columns: 2fr 1fr 1fr 90px;
  gap: 10px;
  align-items: center;
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
</style>
