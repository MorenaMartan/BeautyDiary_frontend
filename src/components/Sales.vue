<template>
  <div class="clients-wrapper p-3 main-wrapper">
    <div class="toolbar-row mb-3">
      <div class="left-tools" v-if="selectedMenu === 'Daily sales'">
        <input
          v-model="selectedDate"
          type="date"
          class="form-control date-input"
        />
      </div>

      <div class="right-tools" v-if="selectedMenu === 'Monthly sales'">
        <select v-model="selectedMonth" class="form-select month-select">
          <option
            v-for="month in months"
            :key="month.value"
            :value="month.value"
          >
            {{ month.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="mb-3"></div>

    <div class="d-flex gap-3 flex-nowrap h-100">
      <div class="card level1-card p-2 flex-shrink-0">
        <div class="list-group list-group-flush">
          <div
            v-for="item in filteredMenu"
            :key="item"
            class="list-group-item list-group-item-action"
            @click="selectMenu(item)"
          >
            {{ item }}
          </div>
        </div>
      </div>

      <div v-if="selectedMenu" class="card level2-card p-3 position-relative">
        <div class="charts-wrapper">
          <div class="chart-container">
            <canvas ref="employeesChart"></canvas>
            <button class="btn title-btn">Employees</button>
          </div>
          <div class="chart-container">
            <canvas ref="hoursChart"></canvas>
            <button class="btn title-btn">Booked Hours</button>
          </div>
          <div class="chart-container">
            <canvas ref="treatmentsChart"></canvas>
            <button class="btn title-btn">Treatments</button>
          </div>
          <div class="chart-container">
            <canvas ref="earningsChart"></canvas>
            <button class="btn title-btn">Earnings</button>
          </div>
        </div>

        <div class="export-actions">
          <button class="btn export-main-btn" :disabled="isExporting" @click="exportPDF">
            {{ isExporting ? "Generating PDF..." : "Export as PDF" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { appointments } from "@/data/appointments";
import { employeesData } from "@/data/employeesData";
import { getCurrentUser } from "@/data/auth";
import { api } from "@/services/api";
import Chart from "chart.js/auto";
import { jsPDF } from "jspdf";

export default {
  name: "Sales",
  props: {
    currentUser: {
      type: Object,
      default: () => getCurrentUser(),
    },
  },
  data() {
    const today = new Date();
    const monthValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    return {
      search: "",
      selectedMenu: "Daily sales",
      selectedDate: today.toISOString().slice(0, 10),
      selectedMonth: monthValue,
      appointmentsList: appointments,
      employeesList: employeesData,
      refreshTimer: null,
      isExporting: false,
      menuItems: [
        "Daily sales",
        "Monthly sales",
      ],
      charts: { employees: null, hours: null, treatments: null, earnings: null },
      chartData: { employees: {}, hours: {}, treatments: {}, earnings: {} },
      months: [
        { value: "2026-01", label: "January" },
        { value: "2026-02", label: "February" },
        { value: "2026-03", label: "March" },
        { value: "2026-04", label: "April" },
        { value: "2026-05", label: "May" },
        { value: "2026-06", label: "June" },
        { value: "2026-07", label: "July" },
        { value: "2026-08", label: "August" },
        { value: "2026-09", label: "September" },
        { value: "2026-10", label: "October" },
        { value: "2026-11", label: "November" },
        { value: "2026-12", label: "December" },
      ],
    };
  },
  computed: {
    visibleEmployees() {
      if (this.currentUser.role === "Admin") return this.employeesList;
      return this.employeesList.filter((employee) => employee.name === this.currentUser.name);
    },
    filteredMenu() {
      return this.menuItems.filter((m) =>
        m.toLowerCase().includes(this.search.toLowerCase()),
      );
    },
    formattedSelectedDate() {
      const d = new Date(this.selectedDate);
      return d.toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
    filteredAppointments() {
      const employeeNames = this.visibleEmployees.map((employee) => employee.name);
      const data = this.appointmentsList.filter(
        (appointment) =>
          appointment.status === "completed" && employeeNames.includes(appointment.beautician),
      );

      if (this.selectedMenu === "Daily sales") {
        return data.filter((a) =>
          a.dayandhour.startsWith(this.selectedDate),
        );
      }
      if (this.selectedMenu === "Monthly sales") {
        return data.filter((a) =>
          a.dayandhour.startsWith(this.selectedMonth),
        );
      }
      return data;
    },
  },
  watch: {
    selectedDate() {
      if (this.selectedMenu === "Daily sales") this.createCharts();
    },
    selectedMonth() {
      if (this.selectedMenu === "Monthly sales") this.createCharts();
    },
  },
  methods: {
    async loadSalesData() {
      try {
        const [employees, savedAppointments] = await Promise.all([
          api.getEmployees(),
          api.getAppointments(),
        ]);

        this.employeesList = employees;
        this.appointmentsList = savedAppointments;
        this.$nextTick(() => this.createCharts());
      } catch (error) {
        console.error(error);
      }
    },
    selectMenu(item) {
      this.selectedMenu = item;
      this.$nextTick(() => this.createCharts());
    },
    getSharedChartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      };
    },
    createCharts() {
      if (
        !this.$refs.employeesChart ||
        !this.$refs.hoursChart ||
        !this.$refs.treatmentsChart ||
        !this.$refs.earningsChart
      ) return;

      const data = this.filteredAppointments;
      this.createEmployeesChart(data);
      this.createHoursChart(data);
      this.createTreatmentsChart(data);
      this.createEarningsChart(data);
    },
    createEmployeesChart(data) {
      const counts = {};
      this.visibleEmployees.forEach((employee) => {
        counts[employee.name] = 0;
      });

      data.forEach(
        (a) => (counts[a.beautician] = (counts[a.beautician] || 0) + 1),
      );
      this.chartData.employees = counts;
      this.charts.employees?.destroy();
      this.charts.employees = new Chart(this.$refs.employeesChart, {
        type: "bar",
        data: {
          labels: Object.keys(counts),
          datasets: [
            {
              label: "Appointments",
              data: Object.values(counts),
              backgroundColor: "#8b0000",
            },
          ],
        },
        options: this.getSharedChartOptions(),
      });
    },
    createHoursChart(data) {
      const counts = {};
      this.visibleEmployees.forEach((employee) => {
        counts[employee.name] = 0;
      });

      data.forEach((a) => {
        const employee = a.beautician;
        counts[employee] =
          (counts[employee] || 0) + Number(a.duration || a.hours || 0) / 60;
      });
      this.chartData.hours = counts;
      this.charts.hours?.destroy();
      this.charts.hours = new Chart(this.$refs.hoursChart, {
        type: "bar",
        data: {
          labels: Object.keys(counts),
          datasets: [
            {
              label: "Booked Hours",
              data: Object.values(counts),
              backgroundColor: "#a52a2a",
            },
          ],
        },
        options: this.getSharedChartOptions(),
      });
    },
    createTreatmentsChart(data) {
      const counts = {};
      const treatmentNames = [...new Set(this.appointmentsList.map((appointment) => appointment.treatment))];
      treatmentNames.forEach((treatment) => {
        if (treatment) counts[treatment] = 0;
      });

      data.forEach(
        (a) => (counts[a.treatment] = (counts[a.treatment] || 0) + 1),
      );
      this.chartData.treatments = counts;
      this.charts.treatments?.destroy();
      this.charts.treatments = new Chart(this.$refs.treatmentsChart, {
        type: "bar",
        data: {
          labels: Object.keys(counts),
          datasets: [
            {
              label: "Treatments",
              data: Object.values(counts),
              backgroundColor: "#5a0f0f",
            },
          ],
        },
        options: this.getSharedChartOptions(),
      });
    },
    createEarningsChart(data) {
      const earnings = {};
      this.visibleEmployees.forEach((employee) => {
        earnings[employee.name] = 0;
      });

      data.forEach((appointment) => {
        earnings[appointment.beautician] =
          (earnings[appointment.beautician] || 0) + Number(appointment.price || 0);
      });

      this.chartData.earnings = earnings;
      this.charts.earnings?.destroy();
      this.charts.earnings = new Chart(this.$refs.earningsChart, {
        type: "bar",
        data: {
          labels: Object.keys(earnings),
          datasets: [
            {
              label: this.selectedMenu === "Daily sales" ? "Daily earnings €" : "Monthly earnings €",
              data: Object.values(earnings),
              backgroundColor: "#6f0000",
            },
          ],
        },
        options: this.getSharedChartOptions(),
      });
    },
    formatMetric(value) {
      return Number(value).toLocaleString("hr-HR", { maximumFractionDigits: 2 });
    },
    async exportPDF() {
      if (this.isExporting) return;

      this.isExporting = true;
      await this.$nextTick();

      try {
        const charts = [
          ["Appointments by employee", this.$refs.employeesChart?.toDataURL("image/png")],
          ["Booked hours", this.$refs.hoursChart?.toDataURL("image/png")],
          ["Treatment distribution", this.$refs.treatmentsChart?.toDataURL("image/png")],
          ["Earnings by employee", this.$refs.earningsChart?.toDataURL("image/png")],
        ];
        if (charts.some(([, image]) => !image)) throw new Error("Charts are not ready yet.");

        const revenue = this.filteredAppointments.reduce(
          (total, appointment) => total + Number(appointment.earningsAmount ?? appointment.price ?? 0),
          0,
        );
        const hours = this.filteredAppointments.reduce(
          (total, appointment) => total + Number(appointment.duration || appointment.hours || 0) / 60,
          0,
        );
        const period = this.selectedMenu === "Daily sales"
          ? this.formattedSelectedDate
          : `${this.months.find((month) => month.value === this.selectedMonth)?.label} ${this.selectedMonth.slice(0, 4)}`;
        const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

        pdf.setFillColor(139, 0, 0);
        pdf.rect(0, 0, 297, 7, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(25);
        pdf.setTextColor(139, 0, 0);
        pdf.text("Beauty Diary", 15, 22);
        pdf.setFontSize(11);
        pdf.setTextColor(111, 99, 99);
        pdf.text("Salon management report", 15, 29);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Generated: ${new Date().toLocaleDateString("hr-HR")}`, 282, 22, { align: "right" });
        pdf.text(`Report type: ${this.selectedMenu}`, 282, 29, { align: "right" });
        pdf.setDrawColor(139, 0, 0);
        pdf.line(15, 35, 282, 35);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.setTextColor(60, 48, 48);
        pdf.text("Sales overview", 15, 46);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        pdf.setTextColor(111, 99, 99);
        pdf.text(`Reporting period: ${period}`, 15, 53);

        [["Total appointments", this.filteredAppointments.length], ["Booked hours", this.formatMetric(hours)], ["Total revenue", `${this.formatMetric(revenue)} €`]].forEach(([label, value], index) => {
          const x = 15 + index * 90;
          pdf.setFillColor(248, 238, 238);
          pdf.roundedRect(x, 61, 82, 22, 2, 2, "F");
          pdf.setFontSize(9);
          pdf.setTextColor(120, 107, 107);
          pdf.text(label, x + 5, 69);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(15);
          pdf.setTextColor(139, 0, 0);
          pdf.text(String(value), x + 5, 78);
          pdf.setFont("helvetica", "normal");
        });

        charts.forEach(([title, image], index) => {
          const x = index % 2 === 0 ? 15 : 150;
          const y = index < 2 ? 92 : 170;
          pdf.setDrawColor(234, 218, 218);
          pdf.roundedRect(x, y, 132, 72, 3, 3, "S");
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          pdf.setTextColor(139, 0, 0);
          pdf.text(title, x + 5, y + 8);
          pdf.addImage(image, "PNG", x + 4, y + 12, 124, 55);
        });
        pdf.save(`beauty-diary-sales-${this.selectedMenu === "Daily sales" ? this.selectedDate : this.selectedMonth}.pdf`);
      } catch (error) {
        console.error("PDF export failed:", error);
        window.alert("PDF report could not be generated. Please try again once the charts have loaded.");
      } finally {
        this.isExporting = false;
      }

    },
  },
  mounted() {
    this.loadSalesData();
    this.refreshTimer = window.setInterval(this.loadSalesData, 5000);
  },
  beforeUnmount() {
    if (this.refreshTimer) window.clearInterval(this.refreshTimer);
    Object.values(this.charts).forEach((chart) => chart?.destroy());
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
.toolbar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.left-tools,
.right-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}
.date-label {
  font-weight: 600;
  color: #8b0000;
}
.date-input,
.month-select {
  width: 220px;
}
.card {
  border-radius: 12px;
  overflow: hidden;
}
.level1-card {
  width: 220px;
}
.level2-card {
  flex: 1;
  padding-bottom: 70px !important;
}
.list-group-item {
  cursor: pointer;
  font-size: 18px;
}
.charts-wrapper {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 20px;
  height: 100%;
  overflow-y: auto;
}
.chart-container {
  width: calc(50% - 10px);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.chart-container canvas {
  width: 100% !important;
  height: 190px !important;
}
.title-btn {
  width: 100%;
  background: #8b0000;
  color: white;
  border: none;
}
.export-main-btn {
  background: #5a0f0f;
  color: white;
  border: none;
}

.export-main-btn:disabled {
  cursor: wait;
  opacity: 0.7;
}

.export-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
