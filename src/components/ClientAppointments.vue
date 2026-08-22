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
        <div class="small text-muted mt-1">
          {{ loyaltySettings.pointsRequired }} points = {{ loyaltySettings.discountPercentage }}% discount
        </div>
        <button
          class="btn btn-sm btn-danger text-white mt-2 w-100"
          :disabled="!canRedeemBeautyPoints"
          @click="startBeautyPointsBooking"
        >
          Book with Beauty Points
        </button>
        <div v-if="!canRedeemBeautyPoints" class="small text-muted mt-1">
          You need {{ loyaltySettings.pointsRequired }} points to use the discount.
        </div>
      </div>

      <div class="card level2-card p-3 flex-shrink-0">
        <b class="mb-2">Upcoming treatments</b>
        <div v-if="!upcoming.length" class="text-muted small">No upcoming treatments.</div>
        <div v-for="a in upcoming" :key="a.id || a.dayandhour" class="border-bottom py-2">
          <div>{{ a.dayandhour }} - {{ a.treatment }}</div>
          <div>{{ a.beautician }}</div>
          <div v-if="a.beautyPointsRedeemed" class="small text-success">
            {{ a.beautyPointsRedeemed }} Beauty Points used:
            <span class="text-decoration-line-through">{{ a.originalPrice }} €</span>
            <b>{{ a.price }} €</b>
            <div class="text-muted">Used points are not returned after cancellation.</div>
          </div>
          <button
            class="btn btn-sm btn-outline-secondary mt-1 me-1"
            @click="downloadAppointmentConfirmation(a)"
          >
            Download confirmation
          </button>
          <button
            class="btn btn-sm btn-outline-danger mt-1"
            :disabled="!canCancel(a)"
            @click="cancelAppointment(a)"
          >
            Cancel
          </button>
          <div v-if="canCancel(a) && cancellationFee(a)" class="small text-muted mt-1">
            Cancelling within 24 hours adds a {{ cancellationFee(a) }} € fee to your balance.
          </div>
          <div v-else-if="!canCancel(a)" class="small text-muted mt-1">
            Appointments cannot be cancelled after they have started.
          </div>
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

        <div class="beauty-points-box mb-3">
          <div><b>Beauty points:</b> {{ beautyPoints }}</div>
          <div class="small text-muted">
            Use {{ loyaltySettings.pointsRequired }} points for a
            {{ loyaltySettings.discountPercentage }}% discount.
          </div>
          <div class="small text-muted mt-1">
            Points are deducted when the booking is confirmed. A discounted treatment does not earn new points.
          </div>
          <button
            class="btn btn-sm mt-2"
            :class="useBeautyPoints ? 'btn-danger text-white' : 'btn-outline-danger'"
            :disabled="!canRedeemBeautyPoints"
            @click="useBeautyPoints = !useBeautyPoints"
          >
            {{ useBeautyPoints ? "Discount selected" : "Use Beauty Points" }}
          </button>
          <div v-if="useBeautyPoints && selectedTreatmentData" class="small mt-2">
            Price:
            <span class="text-decoration-line-through me-1">{{ selectedTreatmentData.price }} €</span>
            <b>{{ discountedTreatmentPrice }} €</b>
          </div>
        </div>

        <label class="form-label fw-bold mb-1">Date</label>
        <input
          v-model="selectedDate"
          type="date"
          class="form-control form-control-sm mb-2"
          :min="todayDate"
        />

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
import { jsPDF } from "jspdf";

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
      selectedDate: new Date(Date.now() - new Date().getTimezoneOffset() * 60 * 1000).toISOString().slice(0, 10),
      selectedBeautician: "",
      selectedTime: "",
      useBeautyPoints: false,
      loyaltySettings: {
        eurosSpent: 15,
        pointsEarned: 1,
        pointsRequired: 10,
        discountPercentage: 10,
      },
    };
  },
  computed: {
    todayDate() {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60 * 1000;
      return new Date(now.getTime() - offset).toISOString().slice(0, 10);
    },
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
      return this.clientAppointments.filter(
        (a) => a.status === "completed" && new Date(a.dayandhour) <= new Date(),
      );
    },
    beautyPoints() {
      const earned =
        Math.floor((this.client?.wallet || 0) / this.loyaltySettings.eurosSpent) *
        this.loyaltySettings.pointsEarned;
      return Math.max(0, earned - (this.client?.spentBeautyPoints || 0));
    },
    canRedeemBeautyPoints() {
      return this.beautyPoints >= this.loyaltySettings.pointsRequired;
    },
    discountedTreatmentPrice() {
      const price = Number(this.selectedTreatmentData?.price || 0);
      return Math.round(price * (1 - this.loyaltySettings.discountPercentage / 100) * 100) / 100;
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
        const startsAt = new Date(`${this.selectedDate}T${time}:00`);
        if (startsAt > new Date() && !this.overlapsExisting(emp.name, time, duration)) times.push(time);
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
        const [clients, employees, treatments, appointments, loyaltySettings] = await Promise.all([
          api.getClients(),
          api.getEmployees(),
          api.getTreatments(),
          api.getAppointments(),
          api.getLoyaltySettings(),
        ]);

        this.clientsList = clients;
        this.employeesList = employees;
        this.treatmentsList = treatments;
        this.appointmentsList = appointments;
        this.loyaltySettings = loyaltySettings;
        if (!this.canRedeemBeautyPoints) this.useBeautyPoints = false;
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
    startBeautyPointsBooking() {
      if (!this.canRedeemBeautyPoints) return;
      this.$emit("book-with-points");
    },
    canCancel(a) {
      const diff = new Date(a.dayandhour) - new Date();
      return diff > 0;
    },
    cancellationFee(a) {
      const diff = new Date(a.dayandhour) - new Date();
      if (diff > 24 * 60 * 60 * 1000) return 0;
      return Number(a.price || 0) / 2;
    },
    async cancelAppointment(a) {
      if (!this.canCancel(a)) return;
      try {
        const cancellationMessages = [];
        if (a.beautyPointsRedeemed) {
          cancellationMessages.push("Used Beauty Points will not be returned.");
        }
        if (this.cancellationFee(a)) {
          cancellationMessages.push(
            `Cancelling this appointment adds a ${this.cancellationFee(a)} € fee to your balance.`,
          );
        }
        if (cancellationMessages.length && !confirm(`${cancellationMessages.join("\n")}\nContinue?`)) {
          return;
        }
        const cancelled = await api.cancelAppointment(a.id);
        Object.assign(a, cancelled);
      } catch (error) {
        alert(error.message);
      }
    },
    async saveReview(a) {
      if (!a.rating) {
        alert("Please select a rating.");
        return;
      }

      try {
        await api.createReview(a.beautician, {
          appointmentId: a.id,
          rating: a.rating,
          comment: a.comment || "",
        });
        alert("Review saved.");
      } catch (error) {
        alert(error.message);
      }
    },
    downloadAppointmentConfirmation(appointment) {
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const clientName = `${appointment.client_name} ${appointment.client_surname}`.trim();

      pdf.setFillColor(139, 0, 0);
      pdf.rect(0, 0, 210, 8, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(25);
      pdf.setTextColor(139, 0, 0);
      pdf.text("Beauty Diary", 20, 28);
      pdf.setFontSize(17);
      pdf.setTextColor(43, 37, 37);
      pdf.text("Appointment confirmation", 20, 43);
      pdf.setDrawColor(139, 0, 0);
      pdf.line(20, 49, 190, 49);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.setTextColor(43, 37, 37);
      [
        ["Client", clientName],
        ["Treatment", appointment.treatment],
        ["Date and time", appointment.dayandhour],
        ["Beautician", appointment.beautician],
        ["Duration", `${appointment.duration || 60} minutes`],
        ["Price", `${Number(appointment.price || 0).toLocaleString("hr-HR")} €`],
        ["Status", appointment.status || "booked"],
      ].forEach(([label, value], index) => {
        const y = 64 + index * 13;
        pdf.setFont("helvetica", "bold");
        pdf.text(`${label}:`, 25, y);
        pdf.setFont("helvetica", "normal");
        pdf.text(String(value), 75, y);
      });
      pdf.setTextColor(111, 99, 99);
      pdf.setFontSize(10);
      pdf.text("Please arrive on time. We look forward to seeing you.", 20, 175);
      pdf.save(`beauty-diary-appointment-${appointment.dayandhour.slice(0, 10)}.pdf`);
    },
    async bookAppointment() {
      const startsAt = new Date(`${this.selectedDate}T${this.selectedTime}:00`);
      if (Number.isNaN(startsAt.getTime()) || startsAt <= new Date()) {
        alert("Appointments can be booked only in the future.");
        this.syncSelectedTime();
        return;
      }

      const appointment = {
        client_name: this.client?.name || this.currentUser.name,
        client_surname: this.client?.surname || this.currentUser.surname || "",
        treatment: this.selectedTreatment,
        dayandhour: `${this.selectedDate} ${this.selectedTime}`,
        beautician: this.selectedBeautician,
        price: this.selectedTreatmentData?.price || 0,
        duration: this.selectedTreatmentData?.duration || 60,
        status: "booked",
        useBeautyPoints: this.useBeautyPoints,
      };

      try {
        const savedAppointment = await api.createAppointment(appointment);
        this.appointmentsList.push(savedAppointment);
        alert(
          this.useBeautyPoints
            ? `Appointment booked with a ${savedAppointment.discountPercentage}% Beauty Points discount.`
            : "Appointment booked.",
        );
        this.useBeautyPoints = false;
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
        if (!appointment.dayandhour?.startsWith(this.selectedDate)) return false;

        const appointmentStart = this.toMinutes(appointment.dayandhour.split(" ")[1]);
        const appointmentEnd = appointmentStart + Number(appointment.duration || 60);
        const overlaps = start < appointmentEnd && end > appointmentStart;
        if (!overlaps) return false;

        const sameBeautician = appointment.beautician === beautician;
        const sameClient =
          appointment.client_name === this.client?.name &&
          appointment.client_surname === this.client?.surname;

        return sameBeautician || sameClient;
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
.beauty-points-box {
  padding: 12px;
  border: 1px solid #e6c5c5;
  border-radius: 10px;
  background: #fff8f8;
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
