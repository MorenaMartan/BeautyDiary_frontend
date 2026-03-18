<template>
  <div class="calendar-container">
    <div class="d-flex justify-content-center align-items-center gap-3 mb-3">
      <button @click="prevDay" class="btn btn-danger">←</button>

      <div class="fw-bold fs-5">
        {{ formattedDate }}
      </div>

      <button @click="nextDay" class="btn btn-danger">→</button>
    </div>

    <div class="table-responsive" style="max-height: 70vh">
      <table class="table table-bordered text-center align-middle">
        <thead class="table-light sticky-top">
          <tr>
            <th>Time</th>
            <th v-for="employee in employees" :key="employee">
              {{ employee }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="time in times" :key="time">
            <td class="fw-semibold">{{ time }}</td>
            <td
              v-for="employee in employees"
              :key="employee + time"
              @click="openModal(employee, time)"
              style="cursor: pointer"
            >
              {{ getCellData(employee, time) }}
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="showModal" class="modal-backdrop-custom">
        <div class="modal-box">
          <h5 class="mb-3">Dodaj tretman</h5>

          <div class="mb-3">
            <label>Time:</label>
            <select v-model="selectedTime" class="form-select">
              <option v-for="t in times" :key="t" :value="t">
                {{ t }}
              </option>
            </select>
          </div>

          <div class="mb-3">
            <label>Treatment:</label>
            <select v-model="selectedTreatment" class="form-select">
              <option disabled value="">Odaberi tretman</option>
              <option v-for="t in treatments" :key="t" :value="t">
                {{ t }}
              </option>
            </select>
          </div>

          <div class="mb-3">
            <label>Client:</label>
            <input
              type="text"
              v-model="clientSearch"
              class="form-control"
              placeholder="Upiši ime klijenta..."
              @focus="showClientDropdown = true"
            />

            <div v-if="showClientDropdown" class="dropdown-list">
              <div
                v-for="c in filteredClients"
                :key="c"
                @click="selectClient(c)"
                class="dropdown-item-custom"
              >
                {{ c }}
              </div>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-3">
            <button @click="saveData" class="btn btn-success">Save</button>
            <button @click="closeModal" class="btn btn-secondary">Quit</button>
            <button @click="deleteData" class="btn btn-danger">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const currentDate = ref(new Date());

const prevDay = () => {
  currentDate.value.setDate(currentDate.value.getDate() - 1);
  currentDate.value = new Date(currentDate.value);
};

const nextDay = () => {
  currentDate.value.setDate(currentDate.value.getDate() + 1);
  currentDate.value = new Date(currentDate.value);
};

const formattedDate = computed(() => {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return currentDate.value.toLocaleDateString(undefined, options);
});

const employees = ["Luna", "Petra", "Ana"];

const times = [];
for (let hour = 7; hour <= 22; hour++) {
  for (let min of [0, 15, 30, 45]) {
    let h = hour.toString().padStart(2, "0");
    let m = min.toString().padStart(2, "0");
    times.push(`${h}:${m}`);
  }
}
const showModal = ref(false);
const selectedEmployee = ref("");
const selectedTime = ref("");
const selectedTreatment = ref("");
const clientSearch = ref("");
const selectedClient = ref("");
const showClientDropdown = ref(false);

const treatments = ref(["Masaža", "Manikura", "Pedikura"]);
const clients = ref([
  "Ivan Horvat",
  "Ana Kovač",
  "Petra Marić",
  "Marko Novak",
  "Luka Babić",
]);

const filteredClients = computed(() => {
  return clients.value.filter((c) =>
    c.toLowerCase().includes(clientSearch.value.toLowerCase()),
  );
});

const selectClient = (client) => {
  selectedClient.value = client;
  clientSearch.value = client;
  showClientDropdown.value = false;
};

const schedule = ref({});

const openModal = (employee, time) => {
  selectedEmployee.value = employee;
  selectedTime.value = time;
  selectedTreatment.value = "";
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveData = () => {
  if (!schedule.value[selectedEmployee.value]) {
    schedule.value[selectedEmployee.value] = {};
  }

  schedule.value[selectedEmployee.value][selectedTime.value] = {
    treatment: selectedTreatment.value,
    client: selectedClient.value,
  };

  closeModal();
};

const getCellData = (employee, time) => {
  const entry = schedule.value[employee]?.[time];
  if (!entry) return "";

  return `${entry.treatment} - ${entry.client}`;
};
const deleteData = () => {
  if (
    schedule.value[selectedEmployee.value] &&
    schedule.value[selectedEmployee.value][selectedTime.value]
  ) {
    delete schedule.value[selectedEmployee.value][selectedTime.value];
  }

  closeModal();
};
</script>

<style scoped>
.btn-danger {
  background: #8b0000;
  border: none;
  color: white;
}

.btn-danger:hover {
  background: #8b0000;
  transform: none;
  box-shadow: none;
}

table {
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
.modal-backdrop-custom {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);

  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-box {
  background: white;
  padding: 20px;
  border-radius: 12px;
  min-width: 300px;
}
.dropdown-list {
  border: 1px solid #ccc;
  max-height: 150px;
  overflow-y: auto;
  background: white;
  border-radius: 8px;
  margin-top: 4px;
}

.dropdown-item-custom {
  padding: 8px;
  cursor: pointer;
}

.dropdown-item-custom:hover {
  background: #f1f1f1;
}
</style>
