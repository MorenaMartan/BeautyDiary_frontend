<template>
  <div class="calendar-container">
    <div v-if="currentUser.role === 'Client'" class="card p-3 mb-3 client-info-card">
      <div class="fw-bold">Beauty points: {{ beautyPoints }}</div>
      <div v-if="beautyPoints >= 10">10% discount available for next treatment.</div>
    </div>

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
            <th v-for="employee in employees" :key="employee.name">
              {{ employee.name }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="time in times" :key="time">
            <td class="fw-semibold" style="background-color: #f8f9fa">
              {{ time }}
            </td>
            <td
              v-for="employee in employees"
              :key="employee.name + time"
              @click="
                isAvailable(employee.name, time)
                  ? openModal(employee.name, time)
                  : null
              "
              :style="{
                backgroundColor: isAvailable(employee.name, time)
                  ? '#f8f9fa'
                  : 'rgba(255,255,255,0.7)',
                cursor: isAvailable(employee.name, time)
                  ? 'pointer'
                  : 'not-allowed',
                color: '#8b0000',
              }"
            >
              {{ getCellData(employee.name, time) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-backdrop-custom">
      <div class="card p-3 modal-card">
        <div class="d-flex justify-content-between mb-2">
          <b>New appointment</b>
          <button class="btn btn-sm btn-outline-danger" @click="showModal = false">
            x
          </button>
        </div>

        <input
          v-if="currentUser.role === 'Client'"
          :value="`${form.client_name} ${form.client_surname}`"
          class="form-control form-control-sm mb-2"
          placeholder="Client"
          disabled
        />
        <div v-else class="client-select mb-2">
          <input
            v-model="clientSearch"
            class="form-control form-control-sm"
            placeholder="Start typing client name"
            autocomplete="off"
            @focus="showClientDropdown = true"
            @input="onClientSearch"
          />
          <div v-if="showClientDropdown && clientSearch" class="client-dropdown">
            <button
              v-for="client in filteredClients"
              :key="client.id"
              type="button"
              class="client-option"
              @mousedown.prevent="selectClient(client)"
            >
              {{ client.name }} {{ client.surname }}
            </button>
            <div v-if="!filteredClients.length" class="client-option empty">
              Client does not exist
            </div>
          </div>
        </div>
        <select v-model="form.treatment" class="form-select form-select-sm mb-2">
          <option v-for="t in allowedTreatments" :key="t.name" :value="t.name">
            {{ treatmentOptionLabel(t) }}
          </option>
        </select>

        <button class="btn btn-danger text-white" @click="saveAppointment">
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { clients as localClients } from "@/data/clientsData";
import { employeesData as localEmployees } from "@/data/employeesData.js";
import { appointments as localAppointments } from "@/data/appointments";
import { treatments as localTreatments } from "@/data/treatmentsData";
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
      schedule: {},
      currentDate: new Date(),
      clientsList: localClients,
      employeesList: localEmployees,
      appointmentsList: localAppointments,
      treatmentsList: localTreatments,
      showModal: false,
      selectedEmployee: "",
      selectedTime: "",
      clientSearch: "",
      selectedClientId: null,
      showClientDropdown: false,
      form: {
        client_name: "",
        client_surname: "",
        treatment: "massage",
      },
    };
  },

  async created() {
    await this.loadData();
  },

  computed: {
    employees() {
      return this.employeesList;
    },
    client() {
      return this.clientsList.find((c) => c.id === this.currentUser.id) || this.clientsList[0];
    },
    beautyPoints() {
      return Math.floor((this.client?.wallet || 0) / 20) - (this.client?.spentBeautyPoints || 0);
    },
    allowedTreatments() {
      const emp = this.employeesMap[this.selectedEmployee];
      if (!emp) return this.treatmentsList;
      const employeeSpecialties = emp.specialties || [];
      if (!employeeSpecialties.length) return this.treatmentsList;

      const treatmentsForSpecialties = this.treatmentsList.filter((t) =>
        employeeSpecialties.includes(t.specialty),
      );
      const coveredSpecialties = treatmentsForSpecialties.map((t) => t.specialty);
      const specialtiesWithoutTreatment = employeeSpecialties.filter(
        (specialty) => !coveredSpecialties.includes(specialty),
      );

      return [
        ...treatmentsForSpecialties,
        ...specialtiesWithoutTreatment.map((specialty) => ({
          name: specialty,
          specialty,
          price: 0,
          duration: 60,
        })),
      ];
    },

    filteredClients() {
      const search = this.clientSearch.trim().toLowerCase();
      if (!search) return this.clientsList;

      return this.clientsList.filter((client) =>
        `${client.name} ${client.surname}`.toLowerCase().includes(search),
      );
    },

    selectedClient() {
      return this.clientsList.find((client) => client.id === this.selectedClientId);
    },

    formattedDate() {
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      return this.currentDate.toLocaleDateString(undefined, options);
    },

    employeesMap() {
      const map = {};
      this.employeesList.forEach((emp) => {
        map[emp.name] = emp;
      });
      return map;
    },

    currentDateKey() {
      return this.currentDate.toISOString().split("T")[0];
    },

    times() {
      const arr = [];
      for (let hour = 7; hour <= 22; hour++) {
        for (let min of [0, 15, 30, 45]) {
          let h = hour.toString().padStart(2, "0");
          let m = min.toString().padStart(2, "0");
          arr.push(`${h}:${m}`);
        }
      }
      return arr;
    },
  },

  methods: {
    async loadData() {
      try {
        const [clients, employees, appointments, treatments] = await Promise.all([
          api.getClients(),
          api.getEmployees(),
          api.getAppointments(),
          api.getTreatments(),
        ]);

        this.clientsList = clients;
        this.employeesList = employees;
        this.appointmentsList = appointments;
        this.treatmentsList = treatments;
      } catch (error) {
        console.error(error);
      }

      this.loadAppointments();
    },

    loadAppointments() {
      const structured = {};

      this.appointmentsList.forEach((a) => {
        if (a.status === "cancelled") return;
        const [date, time] = a.dayandhour.split(" ");

        if (!structured[date]) structured[date] = {};
        if (!structured[date][a.beautician]) {
          structured[date][a.beautician] = {};
        }

        structured[date][a.beautician][time] = {
          treatment: a.treatment,
          client: `${a.client_name} ${a.client_surname}`,
        };
      });

      this.schedule = structured;
    },

    prevDay() {
      this.currentDate.setDate(this.currentDate.getDate() - 1);
      this.currentDate = new Date(this.currentDate);
    },

    nextDay() {
      this.currentDate.setDate(this.currentDate.getDate() + 1);
      this.currentDate = new Date(this.currentDate);
    },

    async openModal(employee, time) {
      if (this.isBooked(employee, time)) return;
      try {
        this.clientsList = await api.getClients();
      } catch (error) {
        console.error(error);
      }

      this.selectedEmployee = employee;
      this.selectedTime = time;
      this.clientSearch = "";
      this.selectedClientId = null;
      this.showClientDropdown = false;
      this.form.client_name = "";
      this.form.client_surname = "";
      if (this.currentUser.role === "Client") {
        this.form.client_name = this.currentUser.name;
        this.form.client_surname = this.currentUser.surname;
      }
      this.form.treatment = this.allowedTreatments[0]?.name || this.treatmentsList[0]?.name || "";
      this.showModal = true;
    },

    onClientSearch() {
      this.selectedClientId = null;
      this.showClientDropdown = true;
    },

    selectClient(client) {
      this.selectedClientId = client.id;
      this.clientSearch = `${client.name} ${client.surname}`;
      this.form.client_name = client.name;
      this.form.client_surname = client.surname;
      this.showClientDropdown = false;
    },

    async saveAppointment() {
      if (this.currentUser.role !== "Client") {
        if (!this.selectedClient) {
          alert("Please choose an existing client from the list.");
          return;
        }

        this.form.client_name = this.selectedClient.name;
        this.form.client_surname = this.selectedClient.surname;
      }

      const treatment = this.findTreatment(this.form.treatment);
      const appointment = {
        client_name: this.form.client_name,
        client_surname: this.form.client_surname,
        treatment: this.form.treatment,
        dayandhour: `${this.currentDateKey} ${this.selectedTime}`,
        beautician: this.selectedEmployee,
        price: treatment?.price || 0,
        duration: treatment?.duration || 60,
        status: "booked",
      };

      try {
        const savedAppointment = await api.createAppointment(appointment);
        this.appointmentsList.push(savedAppointment);
      } catch (error) {
        alert(error.message);
        return;
      }

      this.loadAppointments();
      this.showModal = false;
    },

    findTreatment(name) {
      return (
        this.treatmentsList.find((t) => t.name.toLowerCase() === name.toLowerCase()) ||
        this.allowedTreatments.find((t) => t.name.toLowerCase() === name.toLowerCase())
      );
    },

    treatmentOptionLabel(treatment) {
      if (!Number(treatment.price)) return treatment.name;
      return `${treatment.name} - ${treatment.price} € / ${treatment.duration} min`;
    },

    getCellData(employee, time) {
      const appointment = this.getAppointmentAt(employee, time);
      if (appointment) {
        if (this.currentUser.role === "Client") return "";

        const startTime = appointment.dayandhour.split(" ")[1];
        if (startTime !== time) return "Booked";

        return `${appointment.treatment} - ${appointment.client_name} ${appointment.client_surname}`;
      }

      return "";
    },

    isBooked(employee, time) {
      return Boolean(this.getAppointmentAt(employee, time));
    },

    isAvailable(employee, time) {
      return this.isWithinWorkHours(employee, time) && !this.isBooked(employee, time);
    },

    getAppointmentAt(employee, time) {
      const targetMinutes = this.toMinutes(time);

      return this.appointmentsList.find((a) => {
        if (a.status === "cancelled") return false;
        if (a.beautician !== employee) return false;

        const [date, startTime] = a.dayandhour.split(" ");
        if (date !== this.currentDateKey) return false;

        const startMinutes = this.toMinutes(startTime);
        const duration = Number(a.duration || this.findTreatment(a.treatment)?.duration || 60);

        return (
          targetMinutes >= startMinutes &&
          targetMinutes < startMinutes + duration
        );
      });
    },

    toMinutes(t) {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    },

    isWithinWorkHours(employee, time) {
      const emp = this.employeesMap[employee];
      if (!emp) return false;

      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      const day = days[this.currentDate.getDay()];
      const work = emp.schedule[day];

      if (!work || work.start === "-" || work.end === "-") return false;

      return (
        this.toMinutes(time) >= this.toMinutes(work.start) &&
        this.toMinutes(time) < this.toMinutes(work.end)
      );
    },
  },
};
</script>

<style scoped>
.btn-danger {
  background: #8b0000;
  border: none;
  color: white;
}

table {
  table-layout: fixed;
  width: 100%;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.client-info-card {
  max-width: 420px;
}

.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-card {
  width: 340px;
}

.client-select {
  position: relative;
}

.client-dropdown {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  z-index: 5;
  background: white;
  border: 1px solid #e5caca;
  border-radius: 8px;
  max-height: 150px;
  overflow-y: auto;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.client-option {
  width: 100%;
  border: none;
  background: white;
  color: #8b0000;
  text-align: left;
  padding: 7px 10px;
}

.client-option:hover {
  background: #f8eeee;
}

.client-option.empty {
  color: #777;
  font-size: 13px;
}
</style>
