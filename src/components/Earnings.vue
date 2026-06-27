<template>
  <div class="earnings-wrapper p-3 main-wrapper">
    <div class="earnings-top mb-3">
      <div class="summary-card">
        <span>Total revenue</span>
        <b>{{ totalRevenue }} €</b>
      </div>
      <div class="summary-card">
        <span>Booked treatments</span>
        <b>{{ totalAppointments }}</b>
      </div>
      <div class="summary-card month-picker">
        <span>Month</span>
        <select v-model="selectedMonth" class="form-select form-select-sm">
          <option v-for="month in months" :key="month" :value="month">{{ month }}</option>
        </select>
      </div>
    </div>

    <div class="earnings-grid">
      <div v-for="emp in visibleEmployees" :key="emp.name" class="card p-3 earnings-card">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div>
            <b class="employee-name">{{ emp.name }}</b>
            <div class="employee-subtitle">{{ selectedMonth || "No month selected" }}</div>
          </div>
          <div class="total-badge">{{ employeeMonth(emp).total }} €</div>
        </div>

        <div class="appointments-count mb-3">
          {{ employeeMonth(emp).count }} booked treatments
        </div>

        <div v-if="!employeeMonth(emp).count" class="empty-state">
          No earnings for this month.
        </div>

        <div v-else class="treatment-list">
          <div v-for="row in employeeMonth(emp).rows" :key="row.treatment" class="treatment-row">
            <div class="d-flex justify-content-between gap-2 mb-1">
              <b>{{ row.treatment }}</b>
              <span>{{ row.total }} €</span>
            </div>
            <div class="d-flex justify-content-between small-info mb-2">
              <span>{{ row.count }} appointments</span>
              <span>{{ percent(row.total, employeeMonth(emp).total) }}%</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: percent(row.total, employeeMonth(emp).total) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { appointments } from "@/data/appointments";
import { employeesData } from "@/data/employeesData";
import { findTreatment } from "@/data/treatmentsData";
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
      employeesList: employeesData,
      appointmentsList: appointments,
      selectedMonth: "",
    };
  },
  computed: {
    visibleEmployees() {
      if (this.currentUser.role === "Admin") return this.employeesList;
      return this.employeesList.filter((e) => e.name === this.currentUser.name);
    },
    months() {
      const employeeNames = this.visibleEmployees.map((emp) => emp.name);
      const months = [...new Set(
        this.appointmentsList
          .filter((a) => a.status !== "cancelled" && employeeNames.includes(a.beautician))
          .map((a) => a.dayandhour.slice(0, 7)),
      )].sort().reverse();

      return months.length ? months : [new Date().toISOString().slice(0, 7)];
    },
    earnings() {
      const data = {};
      this.visibleEmployees.forEach((emp) => {
        data[emp.name] = { total: 0, count: 0, treatments: {} };
      });

      this.appointmentsList
        .filter((a) => a.status !== "cancelled" && a.dayandhour?.startsWith(this.selectedMonth))
        .forEach((a) => {
          if (!data[a.beautician]) return;

          const price = Number(a.price || findTreatment(a.treatment)?.price || 0);
          data[a.beautician].total += price;
          data[a.beautician].count += 1;

          if (!data[a.beautician].treatments[a.treatment]) {
            data[a.beautician].treatments[a.treatment] = { treatment: a.treatment, total: 0, count: 0 };
          }

          data[a.beautician].treatments[a.treatment].total += price;
          data[a.beautician].treatments[a.treatment].count += 1;
        });

      Object.values(data).forEach((employeeData) => {
        employeeData.rows = Object.values(employeeData.treatments).sort((a, b) => b.total - a.total);
      });

      return data;
    },
    totalRevenue() {
      return Object.values(this.earnings).reduce((sum, emp) => sum + emp.total, 0);
    },
    totalAppointments() {
      return Object.values(this.earnings).reduce((sum, emp) => sum + emp.count, 0);
    },
  },
  watch: {
    months: {
      immediate: true,
      handler(months) {
        if (!this.selectedMonth || !months.includes(this.selectedMonth)) {
          this.selectedMonth = months[0] || new Date().toISOString().slice(0, 7);
        }
      },
    },
  },
  methods: {
    employeeMonth(emp) {
      return this.earnings[emp.name] || { total: 0, count: 0, rows: [] };
    },
    percent(value, total) {
      if (!total) return 0;
      return Math.round((Number(value) / Number(total)) * 100);
    },
  },
  async mounted() {
    try {
      const [employees, savedAppointments] = await Promise.all([
        api.getEmployees(),
        api.getAppointments(),
      ]);
      this.employeesList = employees;
      this.appointmentsList = savedAppointments;
    } catch (error) {
      console.error(error);
      this.employeesList = employeesData;
      this.appointmentsList = appointments;
    }
  },
};
</script>

<style scoped>
.main-wrapper {
  height: calc(100vh - 160px);
  max-height: calc(100vh - 160px);
  box-sizing: border-box;
  overflow: hidden;
  color: #8b0000;
}

.earnings-wrapper {
  display: flex;
  flex-direction: column;
}

.earnings-top {
  display: grid;
  grid-template-columns: repeat(3, minmax(170px, 1fr));
  gap: 12px;
  flex-shrink: 0;
}

.summary-card,
.earnings-card {
  background: rgba(255, 255, 255, 0.72);
  border: none;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.summary-card {
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.summary-card span,
.employee-subtitle,
.small-info,
.appointments-count {
  font-size: 13px;
  opacity: 0.75;
}

.summary-card b {
  font-size: 20px;
}

.month-picker .form-select {
  max-width: 150px;
  color: #8b0000;
  border-color: rgba(139, 0, 0, 0.3);
}

.earnings-grid {
  display: flex;
  flex: 1;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  min-height: 0;
  padding-bottom: 4px;
}

.earnings-card {
  width: 340px;
  height: 100%;
  flex: 0 0 340px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.employee-name {
  font-size: 18px;
}

.total-badge {
  min-width: 72px;
  height: 36px;
  padding: 0 12px;
  border-radius: 18px;
  background: #8b0000;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.treatment-list {
  overflow-y: auto;
  padding-right: 4px;
}

.treatment-row {
  background: rgba(139, 0, 0, 0.07);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
}

.bar-track {
  height: 8px;
  background: rgba(139, 0, 0, 0.15);
  border-radius: 8px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #8b0000;
  border-radius: 8px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed rgba(139, 0, 0, 0.35);
  border-radius: 12px;
  opacity: 0.7;
}

@media (max-width: 900px) {
  .earnings-top {
    grid-template-columns: 1fr;
  }
}
</style>
