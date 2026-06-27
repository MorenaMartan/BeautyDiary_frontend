<template>
  <div class="clients-wrapper p-3 main-wrapper">
    <div v-if="mode === 'list'" class="d-flex gap-3 flex-nowrap h-100">
      <div class="card level1-card p-2 flex-shrink-0">
        <div class="fw-bold mb-2">Treatments</div>
        <div
          v-for="t in treatmentsList"
          :key="t.name"
          class="list-group-item list-group-item-action"
          @click="selectedTreatment = t.name"
        >
          {{ t.name }} - {{ t.price }} €
        </div>
        <hr />
        <div><b>Beauty points:</b> {{ beautyPoints }}</div>
      </div>

      <div class="card level2-card p-3 flex-shrink-0">
        <b class="mb-2">Upcoming treatments</b>
        <div v-if="!upcoming.length" class="text-muted small">No upcoming treatments.</div>
        <div v-for="a in upcoming" :key="a.id || a.dayandhour" class="border-bottom py-2">
          <div>{{ a.dayandhour }} - {{ a.treatment }}</div>
          <div>{{ a.beautician }}</div>
          <button
            class="btn btn-sm btn-outline-danger mt-1"
            :disabled="!canCancel(a)"
            @click="cancelAppointment(a)"
          >
            Cancel
          </button>
        </div>
      </div>

      <div class="card level3-card p-3 flex-shrink-0">
        <b class="mb-2">Past treatments</b>
        <div v-if="!past.length" class="text-muted small">No past treatments.</div>
        <div v-for="a in past" :key="a.id || a.dayandhour" class="border-bottom py-2">
          <div>{{ a.dayandhour }} - {{ a.treatment }}</div>
          <div>{{ a.beautician }}</div>
          <select v-model.number="a.rating" class="form-select form-select-sm mt-1">
            <option :value="0">Rating</option>
            <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
          </select>
          <textarea
            v-model="a.comment"
            class="form-control form-control-sm mt-1"
            placeholder="Comment"
          ></textarea>
          <button class="btn btn-sm btn-danger text-white mt-1" @click="saveReview(a)">
            Save review
          </button>
        </div>
      </div>
    </div>

    <div v-else class="d-flex gap-3 flex-nowrap h-100">
      <div class="card new-treatment-card p-3 flex-shrink-0">
        <b class="mb-3">New treatment</b>

        <label class="form-label fw-bold mb-1">Treatment</label>
        <select v-model="selectedTreatment" class="form-select form-select-sm mb-2">
          <option v-for="t in treatmentsList" :key="t.name" :value="t.name">
            {{ t.name }} - {{ t.price }} € / {{ t.duration }} min
          </option>
        </select>

        <label class="form-label fw-bold mb-1">Date</label>
        <input v-model="selectedDate" type="date" class="form-control form-control-sm mb-2" />

        <label class="form-label fw-bold mb-1">Beautician</label>
        <select v-model="selectedBeautician" class="form-select form-select-sm mb-2">
          <option v-for="b in availableBeauticians" :key="b.name" :value="b.name">
            {{ b.name }}
          </option>
        </select>

        <label class="form-label fw-bold mb-1">Available time</label>
        <select v-model="selectedTime" class="form-select form-select-sm mb-2">
          <option v-for="t in availableTimes" :key="t" :value="t">{{ t }}</option>
        </select>

        <div v-if="!availableBeauticians.length" class="small text-muted mb-2">
          No beautician is available for this treatment.
        </div>
        <div v-else-if="!availableTimes.length" class="small text-muted mb-2">
          No free time for this date.
        </div>

        <button
          class="btn btn-danger text-white mt-2"
          :disabled="!selectedBeautician || !selectedTime"
          @click="bookAppointment"
        >
          Book
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { appointments as localAppointments } from "@/data/appointments";
import { clients as localClients } from "@/data/clientsData";
import { employeesData as localEmployees } from "@/data/employeesData";
import { treatments as localTreatments } from "@/data/treatmentsData";
import { getCurrentUser } from "@/data/auth";
import { api } from "@/services/api";

export default {
  props: {
    currentUser: {
      type: Object,
      default: () => getCurrentUser(),
    },
    mode: {
      type: String,
      default: "list",
    },
  },
  data() {
    return {
      treatmentsList: localTreatments,
      appointmentsList: localAppointments,
      clientsList: localClients,
      employeesList: localEmployees,
      selectedTreatment: localTreatments[0]?.name || "",
      selectedDate: new Date().toISOString().slice(0, 10),
      selectedBeautician: "",
      selectedTime: "",
    };
  },
  computed: {
    client() {
      return (
        this.clientsList.find((c) => c.id === this.currentUser.id) ||
        this.clientsList.find((c) => c.username === this.currentUser.username) ||
        this.clientsList.find(
          (c) => c.name === this.currentUser.name && c.surname === this.currentUser.surname,
        ) ||
        this.clientsList[0]
      );
    },
    clientAppointments() {
      return this.appointmentsList.filter(
        (a) =>
          a.client_name === this.client?.name &&
          a.client_surname === this.client?.surname &&
          a.status !== "cancelled",
      );
    },
    upcoming() {
      return this.clientAppointments.filter((a) => new Date(a.dayandhour) > new Date());
    },
    past() {
      return this.clientAppointments.filter((a) => new Date(a.dayandhour) <= new Date());
    },
    beautyPoints() {
      return Math.floor((this.client?.wallet || 0) / 20) - (this.client?.spentBeautyPoints || 0);
    },
    selectedTreatmentData() {
      return this.treatmentsList.find((t) => t.name === this.selectedTreatment) || this.treatmentsList[0];
    },
    availableBeauticians() {
      const specialty = this.selectedTreatmentData?.specialty;
      if (!specialty) return [];

      return this.employeesList.filter((employee) => employee.specialties?.includes(specialty));
    },
    availableTimes() {
      const emp = this.employeesList.find((e) => e.name === this.selectedBeautician);
      if (!emp || !this.selectedTreatmentData) return [];

      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const schedule = emp.schedule?.[days[new Date(this.selectedDate).getDay()]];
      if (!schedule || schedule.start === "-" || schedule.end === "-") return [];

      const times = [];
      const duration = Number(this.selectedTreatmentData.duration || 60);
      for (let min = this.toMinutes(schedule.start); min + duration <= this.toMinutes(schedule.end); min += 15) {
        const time = this.toTime(min);
        if (!this.overlapsExisting(emp.name, time, duration)) times.push(time);
      }

      return times;
    },
  },
  watch: {
    selectedTreatment() {
      this.syncSelectedBeautician();
    },
    selectedDate() {
      this.syncSelectedTime();
    },
    selectedBeautician() {
      this.syncSelectedTime();
    },
    availableBeauticians() {
      this.syncSelectedBeautician();
    },
    availableTimes() {
      this.syncSelectedTime();
    },
  },
  methods: {
    async loadData() {
      try {
        const [clients, employees, treatments, appointments] = await Promise.all([
          api.getClients(),
          api.getEmployees(),
          api.getTreatments(),
          api.getAppointments(),
        ]);

        this.clientsList = clients;
        this.employeesList = employees;
        this.treatmentsList = treatments;
        this.appointmentsList = appointments;
        if (!this.selectedTreatment && treatments[0]) this.selectedTreatment = treatments[0].name;
      } catch (error) {
        console.error(error);
      }

      this.syncSelectedBeautician();
    },
    syncSelectedBeautician() {
      if (!this.availableBeauticians.length) {
        this.selectedBeautician = "";
        this.selectedTime = "";
        return;
      }

      if (!this.availableBeauticians.some((b) => b.name === this.selectedBeautician)) {
        this.selectedBeautician = this.availableBeauticians[0].name;
      }

      this.syncSelectedTime();
    },
    syncSelectedTime() {
      if (!this.availableTimes.length) {
        this.selectedTime = "";
        return;
      }

      if (!this.availableTimes.includes(this.selectedTime)) {
        this.selectedTime = this.availableTimes[0];
      }
    },
    canCancel(a) {
      const diff = new Date(a.dayandhour) - new Date();
      return diff > 48 * 60 * 60 * 1000;
    },
    async cancelAppointment(a) {
      if (!this.canCancel(a)) return;
      try {
        const cancelled = await api.cancelAppointment(a.id);
        Object.assign(a, cancelled);
      } catch (error) {
        alert(error.message);
      }
    },
    saveReview(a) {
      alert("Review saved.");
      a.rating = a.rating || 0;
      a.comment = a.comment || "";
    },
    async bookAppointment() {
      const appointment = {
        client_name: this.client?.name || this.currentUser.name,
        client_surname: this.client?.surname || this.currentUser.surname || "",
        treatment: this.selectedTreatment,
        dayandhour: `${this.selectedDate} ${this.selectedTime}`,
        beautician: this.selectedBeautician,
        price: this.selectedTreatmentData?.price || 0,
        duration: this.selectedTreatmentData?.duration || 60,
        status: "booked",
      };

      try {
        const savedAppointment = await api.createAppointment(appointment);
        this.appointmentsList.push(savedAppointment);
        alert("Appointment booked.");
        await this.loadData();
      } catch (error) {
        alert(error.message);
      }
    },
    overlapsExisting(beautician, time, duration) {
      const start = this.toMinutes(time);
      const end = start + duration;

      return this.appointmentsList.some((appointment) => {
        if (appointment.status === "cancelled") return false;
        if (appointment.beautician !== beautician) return false;
        if (!appointment.dayandhour?.startsWith(this.selectedDate)) return false;

        const appointmentStart = this.toMinutes(appointment.dayandhour.split(" ")[1]);
        const appointmentEnd = appointmentStart + Number(appointment.duration || 60);
        return start < appointmentEnd && end > appointmentStart;
      });
    },
    toMinutes(time) {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    },
    toTime(minutes) {
      return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    },
  },
  mounted() {
    this.loadData();
  },
};
</script>

<style scoped>
.clients-wrapper {
  height: 100vh;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}
.card {
  border-radius: 12px;
  overflow-y: auto;
}
.level1-card {
  width: 220px;
}
.level2-card,
.level3-card {
  width: 280px;
}
.new-treatment-card {
  width: 360px;
}
.list-group-item {
  cursor: pointer;
}
.main-wrapper {
  max-height: 80vh;
  overflow: hidden;
}
.btn-danger {
  background: #8b0000;
  border: none;
}
</style>
