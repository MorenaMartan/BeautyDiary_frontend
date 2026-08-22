<template>
  <div class="clients-wrapper p-3 main-wrapper">
    <div class="mb-3">
      <input v-model="search" placeholder="Client name" class="form-control" />
    </div>

    <div class="d-flex gap-3 flex-nowrap h-100">
      <div class="card level1-card p-2 flex-shrink-0">
        <div class="btn btn-sm btn-danger text-white mb-2" @click="addClient">
          + Add new
        </div>

        <div class="client-list">
          <ul class="list-group list-group-flush">
            <li
              v-for="c in filteredClients"
              :key="c.id"
              class="list-group-item list-group-item-action"
              @click="selectClient(c)"
            >
              {{ c.name }} {{ c.surname }}
            </li>
          </ul>
        </div>
      </div>

      <div v-if="selectedClient" class="card level2-card p-3 flex-shrink-0">
        <div class="d-flex justify-content-between align-items-start gap-2 mb-3">
          <b>Client details</b>
          <div class="client-actions">
            <button
              class="btn btn-sm btn-outline-danger edit-client-button"
              @click="toggleEdit"
            >
              {{ editMode ? "Save" : "Edit" }}
            </button>
            <button class="btn btn-sm btn-outline-secondary export-pdf-button" @click="downloadTreatmentHistory">
              Export PDF
            </button>
          </div>
        </div>

        <div class="mb-1">
          <b>Name:</b>
          <input
            v-if="editMode"
            v-model="selectedClient.name"
            class="form-control form-control-sm"
          />
          <span v-else>{{ selectedClient.name }}</span>
        </div>

        <div class="mb-1">
          <b>Surname:</b>
          <input
            v-if="editMode"
            v-model="selectedClient.surname"
            class="form-control form-control-sm"
          />
          <span v-else>{{ selectedClient.surname }}</span>
        </div>

        <div class="mb-1">
          <b>Email:</b>
          <input
            v-if="editMode"
            v-model="selectedClient.email"
            class="form-control form-control-sm"
          />
          <span v-else>{{ selectedClient.email }}</span>
        </div>

        <div class="mb-1">
          <b>Mobile:</b>
          <input
            v-if="editMode"
            v-model="selectedClient.mobile"
            class="form-control form-control-sm"
          />
          <span v-else>{{ selectedClient.mobile }}</span>
        </div>

        <div class="mb-1">
          <b>Birthday:</b>
          <input
            v-if="editMode"
            type="date"
            v-model="selectedClient.birthday"
            class="form-control form-control-sm"
          />
          <span v-else>{{ selectedClient.birthday }}</span>
        </div>

        <hr />

        <div><b>Termins:</b> {{ doneTreatments }}</div>
        <div><b>Cancelled:</b> {{ selectedClient.cancelled }}</div>
        <div><b>Wallet:</b> {{ selectedClient.wallet }} €</div>
        <div><b>Spent Beauty points:</b> {{ selectedClient.spentBeautyPoints || 0 }}</div>

        <hr />

        <div>
          <b>Beauty points:</b> {{ beautyPoints }} ⭐
          <div v-if="beautyPoints >= loyaltySettings.pointsRequired" class="text-success">
            {{ loyaltySettings.discountPercentage }}% discount available
          </div>
        </div>
      </div>

      <div v-if="selectedClient" class="card level3-card p-3 flex-shrink-0">
        <b class="mb-2">Client Diary</b>

        <div
          v-for="(note, index) in selectedClient.diary"
          :key="index"
          class="d-flex align-items-center gap-2 mb-2"
        >
          <div style="width: 20px">{{ index + 1 }}.</div>

          <input
            type="date"
            v-model="note.date"
            class="form-control form-control-sm"
            style="width: 130px"
          />

          <div class="flex-grow-1">
            <input
              v-if="!note.expanded"
              type="text"
              v-model="note.text"
              class="form-control form-control-sm"
              @focus="note.expanded = true"
              @input="handleDiary(index)"
            />

            <textarea
              v-else
              v-model="note.text"
              class="form-control form-control-sm"
              rows="3"
              @blur="note.expanded = false"
              @input="handleDiary(index)"
            ></textarea>
          </div>
        </div>
      </div>

      <div v-if="selectedClient" class="card level3-card p-3 flex-shrink-0">
        <b class="mb-2">Appointments</b>

        <div class="appointment-section">
          <b>Upcoming appointments</b>
          <div v-if="!upcomingAppointments.length" class="text-muted small mt-1">
            No upcoming appointments.
          </div>
          <div
            v-for="appointment in upcomingAppointments"
            :key="appointment.id"
            class="appointment-row"
          >
            <div>{{ appointment.dayandhour }}</div>
            <div>{{ appointment.treatment }} with {{ appointment.beautician }}</div>
            <small>{{ appointment.status || "booked" }}</small>
          </div>
        </div>

        <div class="appointment-section">
          <b>Past appointments</b>
          <div v-if="!pastAppointments.length" class="text-muted small mt-1">
            No past appointments.
          </div>
          <div
            v-for="appointment in pastAppointments"
            :key="appointment.id"
            class="appointment-row"
          >
            <div>{{ appointment.dayandhour }}</div>
            <div>{{ appointment.treatment }} with {{ appointment.beautician }}</div>
            <small>{{ appointment.status || "booked" }}</small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { clients } from "@/data/clientsData";
import { appointments } from "@/data/appointments";
import { api } from "@/services/api";
import { jsPDF } from "jspdf";

export default {
  name: "Clients",
  data() {
    return {
      search: "",
      selectedClient: null,
      editMode: false,
      clientsList: clients,
      appointmentsList: appointments,
      loyaltySettings: {
        eurosSpent: 15,
        pointsEarned: 1,
        pointsRequired: 10,
        discountPercentage: 10,
      },
    };
  },
  computed: {
    filteredClients() {
      return this.clientsList
        .filter((c) =>
          `${c.name} ${c.surname}`
            .toLowerCase()
            .includes(this.search.toLowerCase()),
        )
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    doneTreatments() {
      if (!this.selectedClient) return 0;
      return this.clientAppointments.filter(
        (a) =>
          a.status !== "cancelled",
      ).length;
    },
    clientAppointments() {
      if (!this.selectedClient) return [];

      return this.appointmentsList.filter(
        (appointment) =>
          appointment.client_name === this.selectedClient.name &&
          appointment.client_surname === this.selectedClient.surname,
      );
    },
    upcomingAppointments() {
      return this.clientAppointments
        .filter((appointment) => new Date(appointment.dayandhour) > new Date())
        .sort((a, b) => new Date(a.dayandhour) - new Date(b.dayandhour));
    },
    pastAppointments() {
      return this.clientAppointments
        .filter((appointment) => new Date(appointment.dayandhour) <= new Date())
        .sort((a, b) => new Date(b.dayandhour) - new Date(a.dayandhour));
    },
    beautyPoints() {
      if (!this.selectedClient) return 0;
      const earned =
        Math.floor((this.selectedClient.wallet || 0) / this.loyaltySettings.eurosSpent) *
        this.loyaltySettings.pointsEarned;
      return Math.max(0, earned - (this.selectedClient.spentBeautyPoints || 0));
    },
  },
  methods: {
    selectClient(c) {
      this.selectedClient = c;
      this.editMode = false;
      this.activeLevel3 = "diary";
    },
    async addClient() {
      try {
        const newClient = await api.createClient({
          name: "New",
          surname: "Client",
          username: `client${Date.now()}`,
        });
        this.clientsList.push(newClient);

        this.selectedClient = newClient;
        this.editMode = true;
      } catch (error) {
        alert(error.message);
      }
    },
    async toggleEdit() {
      if (!this.editMode) {
        this.editMode = true;
        return;
      }

      try {
        const savedClient = await api.updateClient(this.selectedClient.id, this.selectedClient);
        Object.assign(this.selectedClient, savedClient);
        this.editMode = false;
      } catch (error) {
        alert(error.message);
      }
    },
    handleDiary(index) {
      const diary = this.selectedClient.diary;
      if (
        index === diary.length - 1 &&
        (diary[index].text || diary[index].date)
      ) {
        diary.push({ date: "", text: "", expanded: false });
      }
    },
    downloadTreatmentHistory() {
      if (!this.selectedClient) return;

      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const clientName = `${this.selectedClient.name} ${this.selectedClient.surname}`.trim();
      const rows = this.pastAppointments.length ? this.pastAppointments : this.clientAppointments;

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const columns = [
        { label: "#", x: 17, width: 8 },
        { label: "DATE & TIME", x: 27, width: 33 },
        { label: "TREATMENT", x: 62, width: 42 },
        { label: "BEAUTICIAN", x: 106, width: 30 },
        { label: "STATUS", x: 138, width: 28 },
        { label: "PRICE", x: 194, align: "right" },
      ];
      const totalValue = rows
        .filter((appointment) => appointment.status === "completed")
        .reduce((total, appointment) => total + Number(appointment.price || 0), 0);
      const completed = rows.filter((appointment) => appointment.status === "completed").length;
      const cancelled = rows.filter((appointment) => appointment.status === "cancelled").length;

      const drawHeader = () => {
        pdf.setFillColor(112, 18, 42);
        pdf.rect(0, 0, pageWidth, 31, "F");
        pdf.setFillColor(255, 255, 255);
        pdf.circle(margin + 6, 15.5, 6, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(112, 18, 42);
        pdf.text("BD", margin + 6, 17.5, { align: "center" });
        pdf.setFontSize(22);
        pdf.setTextColor(255, 255, 255);
        pdf.text("Beauty Diary", margin + 16, 18);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text("CLIENT CARE RECORD", margin + 16, 25);
        pdf.setTextColor(112, 18, 42);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.text("Client treatment history", margin, 43);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(99, 85, 88);
        pdf.text(`Generated ${new Date().toLocaleString("hr-HR", { dateStyle: "medium", timeStyle: "short" })}`, pageWidth - margin, 40, { align: "right" });
        pdf.text(`Document ID: CLIENT-${this.selectedClient.id}`, pageWidth - margin, 45, { align: "right" });
      };

      const drawFooter = (pageNumber, totalPages) => {
        pdf.setDrawColor(230, 220, 222);
        pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        pdf.setFontSize(8);
        pdf.setTextColor(130, 115, 119);
        pdf.text("Beauty Diary - Confidential client record", margin, pageHeight - 9);
        pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, pageHeight - 9, { align: "right" });
      };

      const drawTableHeader = (y) => {
        pdf.setFillColor(248, 235, 238);
        pdf.rect(margin, y, pageWidth - margin * 2, 9, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(112, 18, 42);
        columns.forEach((column) => pdf.text(column.label, column.x, y + 5.8, { align: column.align || "left" }));
        return y + 9;
      };

      drawHeader();
      pdf.setFillColor(255, 249, 250);
      pdf.roundedRect(margin, 50, pageWidth - margin * 2, 27, 3, 3, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(112, 18, 42);
      pdf.text("CLIENT", margin + 6, 56);
      pdf.setFontSize(12);
      pdf.setTextColor(43, 37, 37);
      pdf.text(clientName, margin + 6, 63);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(99, 85, 88);
      pdf.text(`Email: ${this.selectedClient.email || "Not provided"}`, margin + 6, 70);
      pdf.text(`Mobile: ${this.selectedClient.mobile || "Not provided"}`, pageWidth - margin - 6, 63, { align: "right" });
      pdf.setFontSize(7.5);
      pdf.text(`Client ID: ${this.selectedClient.id}`, margin + 6, 75);
      pdf.text(
        `Birthday: ${this.selectedClient.birthday || "Not provided"}`,
        pageWidth - margin - 6,
        70,
        { align: "right" },
      );

      const summary = [
        ["APPOINTMENTS", rows.length],
        ["COMPLETED", completed],
        ["CANCELLED", cancelled],
        ["TOTAL VALUE", `${totalValue.toFixed(2)} €`],
      ];
      summary.forEach(([label, value], index) => {
        const x = margin + index * 45.2;
        pdf.setFillColor(250, 240, 243);
        pdf.roundedRect(x, 83, 42, 18, 2, 2, "F");
        pdf.setFillColor(112, 18, 42);
        pdf.rect(x, 83, 2, 18, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(112, 18, 42);
        pdf.text(label, x + 4, 89);
        pdf.setFontSize(12);
        pdf.setTextColor(43, 37, 37);
        pdf.text(String(value), x + 4, 96.5);
      });

      let y = drawTableHeader(109);
      if (!rows.length) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(130, 115, 119);
        pdf.text("No treatment history is available for this client.", margin, y + 12);
      } else {
        rows.forEach((appointment, index) => {
          const treatmentLines = pdf.splitTextToSize(appointment.treatment || "-", columns[2].width);
          const beauticianLines = pdf.splitTextToSize(appointment.beautician || "-", columns[3].width);
          const rowHeight = Math.max(11, Math.max(treatmentLines.length, beauticianLines.length) * 4 + 5);

          if (y + rowHeight > pageHeight - 22) {
            pdf.addPage();
            drawHeader();
            y = drawTableHeader(54);
          }

          if (index % 2 === 0) {
            pdf.setFillColor(253, 248, 249);
            pdf.rect(margin, y, pageWidth - margin * 2, rowHeight, "F");
          }
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8.5);
          pdf.setTextColor(43, 37, 37);
          pdf.text(String(index + 1), columns[0].x, y + 6.4);
          pdf.text(this.formatPdfDate(appointment.dayandhour), columns[1].x, y + 6.4);
          pdf.text(treatmentLines, columns[2].x, y + 6.4);
          pdf.text(beauticianLines, columns[3].x, y + 6.4);
          const statusColors = {
            completed: [37, 125, 78],
            cancelled: [170, 45, 65],
            no_show: [139, 94, 20],
            booked: [51, 94, 145],
          };
          pdf.setTextColor(...(statusColors[appointment.status] || statusColors.booked));
          pdf.setFont("helvetica", "bold");
          pdf.text(this.pdfStatusLabel(appointment.status), columns[4].x, y + 6.4);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(43, 37, 37);
          pdf.text(`${Number(appointment.price || 0).toFixed(2)} €`, columns[5].x, y + 6.4, { align: "right" });
          pdf.setDrawColor(238, 228, 230);
          pdf.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
          y += rowHeight;
        });
      }
      const totalPages = pdf.getNumberOfPages();
      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        pdf.setPage(pageNumber);
        drawFooter(pageNumber, totalPages);
      }
      const safeClientName = clientName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      pdf.save(`beauty-diary-client-${safeClientName || this.selectedClient.id}.pdf`);
    },
    formatPdfDate(dayandhour) {
      const date = new Date(dayandhour.replace(" ", "T"));
      return Number.isNaN(date.getTime()) ? dayandhour : date.toLocaleString("hr-HR", { dateStyle: "short", timeStyle: "short" });
    },
    pdfStatusLabel(status) {
      return {
        booked: "Booked",
        completed: "Completed",
        cancelled: "Cancelled",
        no_show: "No-show",
      }[status || "booked"] || "Booked";
    },
    toggleLevel3(name) {
      this.activeLevel3 = this.activeLevel3 === name ? null : name;
    },
  },
  async mounted() {
    try {
      const [savedClients, savedAppointments, loyaltySettings] = await Promise.all([
        api.getClients(),
        api.getAppointments(),
        api.getLoyaltySettings(),
      ]);
      this.clientsList = savedClients;
      this.appointmentsList = savedAppointments;
      this.loyaltySettings = loyaltySettings;
    } catch (error) {
      console.error(error);
      if (import.meta.env.DEV) {
        this.clientsList = clients;
        this.appointmentsList = appointments;
      } else {
        alert(error.message);
      }
    }
  },
};
</script>

<style scoped>
/* WRAPPER */
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

/* LEVEL 1,2,3 */
.level1-card {
  width: 220px;
}
.level2-card {
  width: 280px;
}
.level3-card {
  width: 350px;
}

.client-list {
  max-height: calc(80vh - 80px);
  overflow-y: auto;
}

/* LIST ITEM */
.list-group-item {
  cursor: pointer;
}

.client-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.edit-client-button {
  min-width: 58px;
  border-radius: 999px;
}

.export-pdf-button {
  border-radius: 999px;
}

.text-danger {
  color: #8b0000 !important;
}

input.form-control-sm {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.main-wrapper {
  max-height: 80vh;
  overflow: hidden;
}

.appointment-section + .appointment-section {
  margin-top: 18px;
}

.appointment-row {
  border-bottom: 1px solid rgba(139, 0, 0, 0.15);
  font-size: 14px;
  padding: 8px 0;
}

.appointment-row small {
  color: #6c757d;
  text-transform: capitalize;
}
</style>
