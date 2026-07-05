<template>
  <div class="calendar-container">
    <div v-if="currentUser.role === 'Client'" class="card p-3 mb-3 client-info-card">
      <div class="fw-bold">Beauty points: {{ beautyPoints }}</div>
      <div v-if="beautyPoints >= 10">10% discount available for next treatment.</div>
    </div>

    <div class="calendar-date-controls mb-3">
      <input
        v-model="selectedDate"
        type="date"
        class="form-control calendar-date-picker"
        aria-label="Choose calendar date"
      />

      <div class="calendar-day-navigation">
        <button @click="prevDay" class="btn btn-danger">←</button>

        <div class="fw-bold fs-5 calendar-current-date">
          {{ formattedDate }}
        </div>

        <button @click="nextDay" class="btn btn-danger">→</button>
      </div>
    </div>

    <div class="calendar-legend mb-3">
      <div class="legend-item">
        <span class="legend-dot legend-available"></span>
        Available / beautician works
      </div>
      <div class="legend-item">
        <span class="legend-dot legend-booked"></span>
        Booked appointment
      </div>
      <div class="legend-item">
        <span class="legend-dot legend-unavailable"></span>
        Not working
      </div>
    </div>

    <div class="table-responsive calendar-table-wrapper" style="max-height: 70vh">
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
              class="calendar-cell"
              :class="getCellClass(employee.name, time)"
              :title="getCellTitle(employee.name, time)"
              @click="handleCellClick(employee.name, time)"
              :style="{
                cursor: isAvailable(employee.name, time) || canOpenAppointmentDetails(employee.name, time)
                  ? 'pointer'
                  : 'not-allowed',
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
          <b>{{ selectedAppointment ? "Appointment details" : "New appointment" }}</b>
          <button class="btn btn-sm btn-outline-danger" @click="closeModal">
            x
          </button>
        </div>

        <div v-if="selectedAppointment" class="appointment-details">
          <div class="detail-row">
            <span>Client</span>
            <b>{{ selectedAppointment.client_name }} {{ selectedAppointment.client_surname }}</b>
          </div>
          <div class="detail-row">
            <span>Treatment</span>
            <b>{{ selectedAppointment.treatment }}</b>
          </div>
          <div class="detail-row">
            <span>Beautician</span>
            <b>{{ selectedAppointment.beautician }}</b>
          </div>
          <div class="detail-row">
            <span>Date</span>
            <b>{{ appointmentDate(selectedAppointment) }}</b>
          </div>
          <div class="detail-row">
            <span>Time</span>
            <b>{{ appointmentTime(selectedAppointment) }}</b>
          </div>
          <div class="detail-row">
            <span>Duration</span>
            <b>{{ appointmentDuration(selectedAppointment) }} min</b>
          </div>
          <div class="detail-row">
            <span>Price</span>
            <b>{{ appointmentPrice(selectedAppointment) }}</b>
          </div>
          <div class="detail-row">
            <span>Status</span>
            <b>{{ appointmentStatusLabel(selectedAppointment) }}</b>
          </div>

          <div v-if="selectedAppointment.earningsAmount" class="detail-row">
            <span>Earnings</span>
            <b>{{ selectedAppointment.earningsAmount }} €</b>
          </div>

          <div v-if="canManageSelectedAppointment" class="appointment-actions">
            <button class="btn btn-sm btn-danger text-white" @click="completeAppointment">
              Mark as completed
            </button>
            <button class="btn btn-sm btn-outline-danger" @click="markNoShow">
              Client did not come
            </button>
            <button class="btn btn-sm btn-outline-danger" @click="cancelSelectedAppointment">
              Cancel appointment
            </button>
          </div>

          <div v-else-if="currentUser.role !== 'Client'" class="status-note">
            Appointment status has already been set.
          </div>
        </div>

        <template v-else>
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
        </template>
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
      selectedAppointment: null,
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

    canManageSelectedAppointment() {
      return (
        this.currentUser.role !== "Client" &&
        this.selectedAppointment &&
        (this.selectedAppointment.status || "booked") === "booked"
      );
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

    selectedDate: {
      get() {
        return this.currentDateKey;
      },
      set(value) {
        if (!value) return;
        this.currentDate = new Date(`${value}T00:00:00`);
      },
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

    handleCellClick(employee, time) {
      const appointment = this.getAppointmentAt(employee, time);
      if (appointment && this.canViewAppointmentDetails(appointment)) {
        this.openAppointmentDetails(appointment);
        return;
      }

      if (this.isAvailable(employee, time)) {
        this.openModal(employee, time);
      }
    },

    openAppointmentDetails(appointment) {
      this.selectedAppointment = appointment;
      this.showModal = true;
    },

    canOpenAppointmentDetails(employee, time) {
      const appointment = this.getAppointmentAt(employee, time);
      return Boolean(appointment && this.canViewAppointmentDetails(appointment));
    },

    canViewAppointmentDetails(appointment) {
      if (this.currentUser.role !== "Client") return true;

      return (
        appointment.client_name === this.currentUser.name &&
        appointment.client_surname === this.currentUser.surname
      );
    },

    closeModal() {
      this.showModal = false;
      this.selectedAppointment = null;
    },

    async openModal(employee, time) {
      if (this.isBooked(employee, time)) return;
      this.selectedAppointment = null;
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
      this.closeModal();
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

    appointmentDate(appointment) {
      return appointment.dayandhour.split(" ")[0];
    },

    appointmentTime(appointment) {
      return appointment.dayandhour.split(" ")[1];
    },

    appointmentDuration(appointment) {
      return appointment.duration || this.findTreatment(appointment.treatment)?.duration || 60;
    },

    appointmentPrice(appointment) {
      const price = appointment.price ?? this.findTreatment(appointment.treatment)?.price;
      return Number(price) ? `${price} €` : "-";
    },

    appointmentStatusLabel(appointment) {
      const labels = {
        booked: "Booked",
        completed: "Completed",
        cancelled: "Cancelled",
        no_show: "Client did not come",
      };

      return labels[appointment.status || "booked"] || appointment.status;
    },

    appointmentStartDate(appointment) {
      return new Date(appointment.dayandhour.replace(" ", "T"));
    },

    appointmentBasePrice(appointment) {
      return Number(appointment.price ?? this.findTreatment(appointment.treatment)?.price ?? 0);
    },

    async completeAppointment() {
      const appointment = this.selectedAppointment;
      const price = this.appointmentBasePrice(appointment);
      await this.updateAppointmentStatus(appointment, {
        status: "completed",
        earningsAmount: price,
      });
    },

    async markNoShow() {
      await this.updateAppointmentStatus(this.selectedAppointment, {
        status: "no_show",
        earningsAmount: 0,
      });
    },

    async cancelSelectedAppointment() {
      const appointment = this.selectedAppointment;
      const hoursUntilAppointment =
        (this.appointmentStartDate(appointment) - new Date()) / (60 * 60 * 1000);

      if (hoursUntilAppointment > 24) {
        await this.deleteSelectedAppointment(appointment);
        return;
      }

      await this.updateAppointmentStatus(appointment, {
        status: "cancelled",
        earningsAmount: this.appointmentBasePrice(appointment) / 2,
      });
    },

    async updateAppointmentStatus(appointment, data) {
      let updatedAppointment = { ...appointment, ...data };

      try {
        if (appointment.id) {
          updatedAppointment = await api.updateAppointment(appointment.id, data);
        }
      } catch (error) {
        alert(error.message);
        return;
      }

      const index = this.appointmentsList.findIndex((a) => this.isSameAppointment(a, appointment));
      if (index !== -1) {
        this.appointmentsList.splice(index, 1, updatedAppointment);
      }

      this.selectedAppointment = updatedAppointment;
      this.loadAppointments();
    },

    async deleteSelectedAppointment(appointment) {
      try {
        if (appointment.id) {
          await api.deleteAppointment(appointment.id);
        }
      } catch (error) {
        alert(error.message);
        return;
      }

      this.appointmentsList = this.appointmentsList.filter((a) => !this.isSameAppointment(a, appointment));
      this.loadAppointments();
      this.closeModal();
    },

    isSameAppointment(a, b) {
      if (a.id && b.id) return a.id === b.id;

      return (
        a.client_name === b.client_name &&
        a.client_surname === b.client_surname &&
        a.treatment === b.treatment &&
        a.dayandhour === b.dayandhour &&
        a.beautician === b.beautician
      );
    },

    getCellData(employee, time) {
      const appointment = this.getAppointmentAt(employee, time);
      if (appointment) {
        if (this.currentUser.role === "Client") return "";

        const startTime = appointment.dayandhour.split(" ")[1];
        if (startTime !== time) return this.appointmentStatusLabel(appointment);

        return `${this.appointmentStatusLabel(appointment)}: ${appointment.treatment} - ${appointment.client_name} ${appointment.client_surname}`;
      }

      return "";
    },

    isBooked(employee, time) {
      return Boolean(this.getAppointmentAt(employee, time));
    },

    isAvailable(employee, time) {
      return this.isWithinWorkHours(employee, time) && !this.isBooked(employee, time);
    },

    getCellClass(employee, time) {
      const appointment = this.getAppointmentAt(employee, time);
      if (appointment) return `cell-${appointment.status || "booked"}`;
      if (this.isWithinWorkHours(employee, time)) return "cell-available";
      return "cell-unavailable";
    },

    getCellTitle(employee, time) {
      const appointment = this.getAppointmentAt(employee, time);
      if (appointment) return this.appointmentStatusLabel(appointment);
      if (this.isWithinWorkHours(employee, time)) return "Available appointment";
      return "Beautician is not working";
    },

    getAppointmentAt(employee, time) {
      const targetMinutes = this.toMinutes(time);

      return this.appointmentsList.find((a) => {
        if (a.status === "cancelled" && !Number(a.earningsAmount)) return false;
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

.calendar-date-controls {
  position: relative;
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-day-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.calendar-current-date {
  min-width: 280px;
  text-align: center;
}

.calendar-date-picker {
  position: absolute;
  left: 0;
  width: 170px;
  min-width: 170px;
  color: #8b0000 !important;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
}

@media (max-width: 720px) {
  .calendar-date-controls {
    align-items: flex-start;
    justify-content: flex-start;
    gap: 12px;
    flex-direction: column;
  }

  .calendar-date-picker {
    position: static;
  }

  .calendar-day-navigation {
    width: 100%;
  }

  .calendar-current-date {
    min-width: 0;
  }
}

table {
  table-layout: fixed;
  width: 100%;
  border-radius: 16px;
}

.calendar-table-wrapper {
  position: relative;
  overflow: auto;
}

thead th {
  position: sticky;
  top: 0;
  z-index: 5;
  background: white !important;
  color: #8b0000;
  box-shadow: 0 2px 0 rgba(139, 0, 0, 0.14);
}

table td {
  background: rgba(255, 255, 255, 0.7);
  color: #8b0000;
}

.calendar-legend {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  color: #351515;
  font-size: 13px;
  font-weight: 700;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(139, 0, 0, 0.12);
  border-radius: 999px;
}

.legend-dot {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  display: inline-block;
}

.legend-available {
  background: #d9f4df;
  border: 1px solid #5fbf73;
}

.legend-booked {
  background: #ffd9d9;
  border: 1px solid #d94c4c;
}

.legend-unavailable {
  background: #ece4e1;
  border: 1px solid #b6aaa6;
}

.calendar-cell {
  position: relative;
  border-width: 1px !important;
  font-weight: 700;
  transition:
    background-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.calendar-cell.cell-available {
  background: linear-gradient(135deg, #effcf2, #d8f4df) !important;
  border-color: rgba(68, 155, 87, 0.38) !important;
  color: #1f6b31 !important;
}

.calendar-cell.cell-booked {
  background: linear-gradient(135deg, #fff0f0, #ffd9d9) !important;
  border-color: rgba(185, 41, 41, 0.38) !important;
  color: #8b0000 !important;
}

.calendar-cell.cell-completed {
  background: linear-gradient(135deg, #eef7ff, #d7ecff) !important;
  border-color: rgba(45, 111, 171, 0.36) !important;
  color: #174f83 !important;
}

.calendar-cell.cell-cancelled {
  background: linear-gradient(135deg, #fff7e8, #ffe2ad) !important;
  border-color: rgba(194, 120, 24, 0.38) !important;
  color: #8a4f00 !important;
}

.calendar-cell.cell-no_show {
  background: linear-gradient(135deg, #f5efff, #e7d7ff) !important;
  border-color: rgba(111, 70, 175, 0.34) !important;
  color: #4f2b89 !important;
}

.calendar-cell.cell-unavailable {
  background: repeating-linear-gradient(
    135deg,
    rgba(236, 228, 225, 0.9),
    rgba(236, 228, 225, 0.9) 8px,
    rgba(226, 215, 211, 0.9) 8px,
    rgba(226, 215, 211, 0.9) 16px
  ) !important;
  border-color: rgba(120, 100, 96, 0.18) !important;
  color: rgba(80, 61, 57, 0.45) !important;
}

.calendar-cell.cell-available:hover,
.calendar-cell.cell-booked:hover,
.calendar-cell.cell-completed:hover,
.calendar-cell.cell-cancelled:hover,
.calendar-cell.cell-no_show:hover {
  box-shadow: inset 0 0 0 2px rgba(139, 0, 0, 0.18);
  transform: scale(1.01);
}

.appointment-actions {
  display: grid;
  gap: 8px;
  margin-top: 6px;
}

.status-note {
  margin-top: 6px;
  padding: 9px 11px;
  background: rgba(139, 0, 0, 0.07);
  border-radius: 12px;
  color: #7d6565;
  font-size: 13px;
  font-weight: 700;
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

.appointment-details {
  display: grid;
  gap: 10px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #f1dada;
  padding-bottom: 7px;
}

.detail-row span {
  color: #777;
}

.detail-row b {
  color: #8b0000;
  text-align: right;
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
