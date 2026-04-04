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
        </div>

        <button class="btn export-main-btn" @click="exportPDFPreview">
          Export as PDF
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { appointments } from "@/data/appointments";
import Chart from "chart.js/auto";

export default {
  name: "Sales",
  data() {
    const today = new Date();
    const monthValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    return {
      search: "",
      selectedMenu: null,
      selectedDate: "2026-04-06",
      selectedMonth: monthValue,
      menuItems: [
        "Daily sales",
        "Monthly sales",
        "Termins",
        "Clients",
        "Employees",
        "Payments",
      ],
      charts: { employees: null, hours: null, treatments: null },
      chartData: { employees: {}, hours: {}, treatments: {} },
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
      if (this.selectedMenu === "Daily sales") {
        return appointments.filter((a) =>
          a.dayandhour.startsWith(this.selectedDate),
        );
      }
      if (this.selectedMenu === "Monthly sales") {
        return appointments.filter((a) =>
          a.dayandhour.startsWith(this.selectedMonth),
        );
      }
      return appointments;
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
    selectMenu(item) {
      this.selectedMenu = item;
      this.$nextTick(() => this.createCharts());
    },
    getSharedChartOptions() {
      return { responsive: true, maintainAspectRatio: false };
    },
    createCharts() {
      const data = this.filteredAppointments;
      this.createEmployeesChart(data);
      this.createHoursChart(data);
      this.createTreatmentsChart(data);
    },
    createEmployeesChart(data) {
      const counts = {};
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
      data.forEach((a) => {
        const employee = a.beautician;
        counts[employee] =
          (counts[employee] || 0) + Number(a.duration || a.hours || 1);
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
    createDataColumn(data) {
      return Object.entries(data)
        .map(([k, v]) => `<div><strong>${k}</strong> = ${v}</div>`)
        .join("");
    },
    exportPDFPreview() {
      const exportTime = new Date().toLocaleDateString("hr-HR");
      const reportPeriod =
        this.selectedMenu === "Daily sales"
          ? this.formattedSelectedDate
          : this.selectedMenu === "Monthly sales"
            ? this.months.find((m) => m.value === this.selectedMonth)?.label +
              " " +
              this.selectedMonth.split("-")[0]
            : exportTime;
      const employeeImg = this.$refs.employeesChart?.toDataURL("image/png");
      const hoursImg = this.$refs.hoursChart?.toDataURL("image/png");
      const treatmentsImg = this.$refs.treatmentsChart?.toDataURL("image/png");

      const printWindow = window.open("", "_blank", "width=1000,height=900");
      if (!printWindow) return;

      printWindow.document.write(`
        <html>
          <head>
            <title>Beauty Diary Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 30px; color: #222; }
              .header { text-align: left; font-size: 28px; font-weight: bold; color: #8b0000; }
              .date { margin: 10px 0 30px; text-align: left; }
              .section { display:flex; gap:20px; align-items:flex-start; margin-bottom:28px; border-bottom:1px solid #ddd; padding-bottom:20px; }
              .section img { width:28%; max-width:280px; border:1px solid #ccc; }
              .data-column { width:35%; line-height:1.8; }
              .toolbar { position:sticky; top:0; background:white; padding-bottom:20px; }
              @media print { .toolbar { display:none; } }
            </style>
          </head>
          <body>
            <div class="toolbar"><button onclick="window.print()">Print / Save PDF</button></div>
            <div class="header">Beauty Diary</div>
          
            <div class="date">Report period: ${reportPeriod}</div>
            <div class="section">
              <img src="${employeeImg}" />
              <div class="data-column">${this.createDataColumn(this.chartData.employees)}</div>
            </div>
            <div class="section">
              <img src="${hoursImg}" />
              <div class="data-column">${this.createDataColumn(this.chartData.hours)}</div>
            </div>
            <div class="section">
              <img src="${treatmentsImg}" />
              <div class="data-column">${this.createDataColumn(this.chartData.treatments)}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    },
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
  justify-content: space-around;
  gap: 20px;
}
.chart-container {
  width: 30%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.chart-container canvas {
  width: 100% !important;
  height: 220px !important;
}
.title-btn {
  width: 100%;
  background: #8b0000;
  color: white;
  border: none;
}
.export-main-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: #5a0f0f;
  color: white;
  border: none;
}
</style>
