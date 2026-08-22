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
          <button class="btn export-preview-btn" :disabled="isExporting" @click="exportPDF('view')">
            View as PDF
          </button>
          <button class="btn export-main-btn" :disabled="isExporting" @click="exportPDF('download')">
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
    async exportPDF(mode) {
      if (this.isExporting) return;

      const previewWindow = mode === "view" ? window.open("about:blank", "_blank") : null;
      if (mode === "view" && !previewWindow) {
        window.alert("Allow pop-ups to preview the PDF.");
        return;
      }

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
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const generatedAt = new Date().toLocaleString("hr-HR", {
          dateStyle: "medium",
          timeStyle: "short",
        });
        const drawHeader = (title, subtitle) => {
          pdf.setFillColor(112, 18, 42);
          pdf.rect(0, 0, pageWidth, 28, "F");
          pdf.setFillColor(255, 255, 255);
          pdf.circle(margin + 6, 14, 6, "F");
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8);
          pdf.setTextColor(112, 18, 42);
          pdf.text("BD", margin + 6, 16, { align: "center" });
          pdf.setFontSize(20);
          pdf.setTextColor(255, 255, 255);
          pdf.text("Beauty Diary", margin + 16, 14);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8.5);
          pdf.setTextColor(247, 215, 224);
          pdf.text("SALON MANAGEMENT REPORT", margin + 16, 21);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          pdf.setTextColor(255, 255, 255);
          pdf.text(title, pageWidth - margin, 12, { align: "right" });
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8.5);
          pdf.setTextColor(247, 215, 224);
          pdf.text(subtitle, pageWidth - margin, 19, { align: "right" });
        };
        const drawChart = ([title, image], x, y, width = 128, height = 90) => {
          pdf.setFillColor(255, 252, 253);
          pdf.setDrawColor(231, 214, 218);
          pdf.roundedRect(x, y, width, height, 3, 3, "FD");
          pdf.setFillColor(112, 18, 42);
          pdf.roundedRect(x, y, width, 11, 3, 3, "F");
          pdf.rect(x, y + 6, width, 5, "F");
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(9.5);
          pdf.setTextColor(255, 255, 255);
          pdf.text(title, x + 5, y + 7.5);
          pdf.addImage(image, "PNG", x + 4, y + 14, width - 8, height - 18);
        };
        const drawTableHeader = (y) => {
          pdf.setFillColor(112, 18, 42);
          pdf.rect(margin, y, pageWidth - margin * 2, 9, "F");
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8);
          pdf.setTextColor(255, 255, 255);
          pdf.text("EMPLOYEE", margin + 4, y + 5.8);
          pdf.text("APPOINTMENTS", 115, y + 5.8, { align: "right" });
          pdf.text("BOOKED HOURS", 190, y + 5.8, { align: "right" });
          pdf.text("REVENUE", pageWidth - margin - 4, y + 5.8, { align: "right" });
          return y + 9;
        };

        drawHeader("Sales report", this.selectedMenu);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.setTextColor(54, 42, 45);
        pdf.text("Sales overview", margin, 41);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(111, 99, 102);
        pdf.text(`Reporting period: ${period}`, margin, 48);
        pdf.text(`Generated: ${generatedAt}`, pageWidth - margin, 48, { align: "right" });

        const averageRevenue = this.filteredAppointments.length
          ? revenue / this.filteredAppointments.length
          : 0;
        const metrics = [
          ["COMPLETED APPOINTMENTS", this.filteredAppointments.length],
          ["BOOKED HOURS", this.formatMetric(hours)],
          ["TOTAL REVENUE", `${this.formatMetric(revenue)} €`],
          ["AVERAGE SALE", `${this.formatMetric(averageRevenue)} €`],
        ];
        const metricGap = 5;
        const metricWidth = (pageWidth - margin * 2 - metricGap * 3) / 4;
        metrics.forEach(([label, value], index) => {
          const x = margin + index * (metricWidth + metricGap);
          pdf.setFillColor(250, 240, 243);
          pdf.roundedRect(x, 56, metricWidth, 23, 2, 2, "F");
          pdf.setFillColor(112, 18, 42);
          pdf.rect(x, 56, 2, 23, "F");
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(7.5);
          pdf.setTextColor(112, 18, 42);
          pdf.text(label, x + 6, 64);
          pdf.setFontSize(14);
          pdf.setTextColor(54, 42, 45);
          pdf.text(String(value), x + 6, 74);
        });

        drawChart(charts[0], margin, 88);
        drawChart(charts[1], pageWidth - margin - 128, 88);

        pdf.addPage();
        drawHeader("Sales analytics", period);
        drawChart(charts[2], margin, 36, 128, 82);
        drawChart(charts[3], pageWidth - margin - 128, 36, 128, 82);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(13);
        pdf.setTextColor(54, 42, 45);
        pdf.text("Employee performance", margin, 130);
        const employeeNames = Object.keys(this.chartData.employees);
        let tableY = drawTableHeader(136);
        if (!employeeNames.length) {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(111, 99, 102);
          pdf.text("No completed appointments are available for this period.", margin + 4, tableY + 7);
        }
        employeeNames.forEach((employeeName, index) => {
          if (tableY + 9 > pageHeight - 17) {
            pdf.addPage();
            drawHeader("Employee performance", `${period} - continued`);
            tableY = drawTableHeader(36);
          }
          if (index % 2 === 0) {
            pdf.setFillColor(253, 248, 249);
            pdf.rect(margin, tableY, pageWidth - margin * 2, 9, "F");
          }
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8.5);
          pdf.setTextColor(54, 42, 45);
          pdf.text(employeeName, margin + 4, tableY + 5.8);
          pdf.text(String(this.chartData.employees[employeeName] || 0), 115, tableY + 5.8, { align: "right" });
          pdf.text(this.formatMetric(this.chartData.hours[employeeName] || 0), 190, tableY + 5.8, { align: "right" });
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(112, 18, 42);
          pdf.text(`${this.formatMetric(this.chartData.earnings[employeeName] || 0)} €`, pageWidth - margin - 4, tableY + 5.8, { align: "right" });
          tableY += 9;
        });

        const totalPages = pdf.getNumberOfPages();
        for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
          pdf.setPage(pageNumber);
          pdf.setDrawColor(230, 220, 222);
          pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.setTextColor(130, 115, 119);
          pdf.text("Beauty Diary - Internal sales report", margin, pageHeight - 7);
          pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: "right" });
        }
        if (mode === "view") {
          previewWindow.location.href = pdf.output("bloburl");
        } else {
          pdf.save(`beauty-diary-sales-${this.selectedMenu === "Daily sales" ? this.selectedDate : this.selectedMonth}.pdf`);
        }
      } catch (error) {
        previewWindow?.close();
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

.export-preview-btn {
  border: 1px solid #5a0f0f;
  color: #5a0f0f;
  background: white;
}

.export-main-btn:disabled,
.export-preview-btn:disabled {
  cursor: wait;
  opacity: 0.7;
}

.export-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}
</style>
