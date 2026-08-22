<template>
  <div class="d-flex gap-3 p-3 flex-nowrap main-wrapper">
    <div
      class="card flex-shrink-0 text-danger p-2 scroll-card"
      style="width: 200px"
    >
      <ul class="list-group list-group-flush">
        <li
          v-for="emp in employees"
          :key="emp.name"
          class="list-group-item list-group-item-action text-danger"
          @click="selectEmployee(emp)"
        >
          {{ emp.name }}
        </li>
      </ul>

      <button
        v-if="!showAddForm"
        type="button"
        class="btn btn-sm btn-danger mt-3 text-white"
        :disabled="currentUser.role !== 'Admin'"
        @click="showAddForm = true"
      >
        + Add Employee
      </button>

      <div v-else-if="currentUser.role === 'Admin'" class="mt-3">
        <input
          v-model="newEmployeeName"
          placeholder="Enter name"
          class="form-control form-control-sm mb-2 text-danger"
        />

        <div class="d-flex gap-2">
          <button
            class="btn btn-sm btn-danger flex-grow-1 text-white"
            @click="addEmployee"
          >
            Add
          </button>

          <button
            class="btn btn-sm btn-secondary flex-grow-1 text-white"
            @click="showAddForm = false"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="selectedEmployee"
      class="card flex-shrink-0 text-danger p-2 scroll-card"
      style="width: 200px"
    >
      <ul class="list-group list-group-flush">
        <li
          v-for="option in visibleLevel2Options"
          :key="option.name"
          class="list-group-item list-group-item-action text-danger"
          @click="toggleLevel3(option.name)"
        >
          {{ option.label }}
        </li>
      </ul>
    </div>

    <div
      v-if="activeLevel3"
      class="card flex-shrink-0 text-danger scroll-card"
      style="width: 400px"
    >
      <div class="card-header fw-bold text-danger d-flex justify-content-between align-items-center">
        <span>{{ activeLevel3Label }}</span>
        <span
          v-if="currentUser.role !== 'Admin' && !canEditActiveSection"
          class="badge read-only-badge"
        >
          View only
        </span>
      </div>

      <div class="card-body p-3">
        <div v-if="activeLevel3 === 'edit'">
          <div class="mb-2">
            <label class="form-label fw-bold">Name</label>
            <input
              type="text"
              class="form-control form-control-sm text-danger"
              v-model="selectedEmployee.name"
              :disabled="!canEditSelectedProfile"
              @blur="persistSelectedProfile"
            />
          </div>

          <div class="mb-2">
            <label class="form-label fw-bold">Surname</label>
            <input
              type="text"
              class="form-control form-control-sm text-danger"
              v-model="selectedEmployee.surname"
              :disabled="!canEditSelectedProfile"
              @blur="persistSelectedProfile"
            />
          </div>

          <div class="mb-2">
            <label class="form-label fw-bold">Birthday</label>
            <input
              type="date"
              class="form-control form-control-sm text-danger"
              v-model="selectedEmployee.birthday"
              :disabled="!canEditSelectedProfile"
              @blur="persistSelectedProfile"
            />
          </div>

          <div class="mb-2">
            <label class="form-label fw-bold">Mobile</label>
            <input
              type="text"
              class="form-control form-control-sm text-danger"
              v-model="selectedEmployee.mobile"
              :disabled="!canEditSelectedProfile"
              @blur="persistSelectedProfile"
            />
          </div>

          <div class="mb-2">
            <label class="form-label fw-bold">Email</label>
            <input
              type="email"
              class="form-control form-control-sm text-danger"
              v-model="selectedEmployee.email"
              :disabled="!canEditSelectedProfile"
              @blur="persistSelectedProfile"
            />
          </div>

          <div v-if="canEditSelectedProfile" class="mb-2">
            <label class="form-label fw-bold">New password</label>
            <input
              type="password"
              class="form-control form-control-sm text-danger"
              v-model="newEmployeePassword"
              minlength="8"
              autocomplete="new-password"
              placeholder="At least 8 characters"
            />
            <button
              class="btn btn-danger btn-sm w-100 mt-2"
              :disabled="newEmployeePassword.length < 8"
              @click="saveEmployeePassword"
            >
              Save password
            </button>
          </div>

          <button
            class="btn btn-outline-danger w-100 mt-3 delete-employee-button"
            :disabled="currentUser.role !== 'Admin'"
            @click="deleteSelectedEmployee"
          >
            Delete employee
          </button>
        </div>

        <div v-if="activeLevel3 === 'role'">
          <select
            class="form-select form-select-sm text-danger"
            v-model="selectedEmployeeRole"
            :disabled="currentUser.role !== 'Admin'"
          >
            <option value="Admin">Admin</option>
            <option value="Beautician">Beautician</option>
          </select>

          <button
            class="btn btn-danger text-white w-100 mt-3"
            :disabled="currentUser.role !== 'Admin'"
            @click="saveRole"
          >
            Save role
          </button>
        </div>

        <div v-else-if="activeLevel3 === 'specialty'" class="specialty-panel">
          <div class="specialty-heading">
            <div class="specialty-heading-icon">T</div>
            <div>
              <h6>Employee treatments</h6>
              <p>Assign treatments from the Price List that {{ selectedEmployee.name }} can perform.</p>
            </div>
          </div>

          <div class="specialty-section">
            <label class="specialty-label">Assign a treatment</label>
            <div class="specialty-action-row">
              <select
                class="form-select specialty-control"
                v-model="selectedTreatment"
                :disabled="!canEditSelectedTreatments"
              >
                <option v-for="treatment in treatments" :key="treatment.id" :value="treatment.name">
                  {{ treatment.name }} ({{ treatment.specialty }})
                </option>
              </select>

              <button
                type="button"
                class="specialty-primary-button"
                :disabled="!canEditSelectedTreatments || !selectedTreatment"
                @click="assignTreatment"
              >
                Assign
              </button>
            </div>

            <div v-if="selectedEmployee.treatments?.length" class="specialty-chip-list">
              <span
                v-for="treatment in selectedEmployee.treatments"
                :key="treatment"
                class="specialty-chip specialty-chip-assigned"
              >
                <span class="specialty-chip-dot"></span>
                {{ treatment }}
                <button
                  type="button"
                  class="specialty-delete"
                  :disabled="!canEditSelectedTreatments"
                  :aria-label="`Remove ${treatment} from employee`"
                  @click="removeTreatment(treatment)"
                >
                  &times;
                </button>
              </span>
            </div>
            <div v-else class="specialty-empty-state">
              No treatments assigned yet. Legacy category assignments remain active until a treatment is assigned.
            </div>
          </div>

          <div class="specialty-divider"></div>

          <div class="specialty-section">
            <div class="specialty-section-title">
              <div>
                <label class="specialty-label">Treatments from Price List</label>
                <p>Add and edit treatments in Settings → Price List.</p>
              </div>
              <span class="specialty-count">{{ treatments.length }}</span>
            </div>

            <div class="specialty-chip-list specialty-library">
              <span
                v-for="treatment in treatments"
                :key="treatment.id"
                class="specialty-chip specialty-chip-library"
              >
                {{ treatment.name }} · {{ treatment.specialty }}
              </span>
            </div>
          </div>
        </div>

        <div v-else-if="activeLevel3 === 'productOrders'">
          <div
            v-for="emp in [selectedEmployee]"
            :key="emp.name"
            class="mb-3"
          >
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div class="fw-bold">{{ emp.name }}</div>
              <button
                v-if="canEditEmployeeProductOrders(emp)"
                class="btn btn-sm btn-danger text-white"
                @click="addEmployeeProductOrder(emp)"
              >
                + Add order
              </button>
            </div>

            <div
              v-for="(order, index) in emp.productOrders"
              :key="index"
              class="d-flex gap-2 mb-2 align-items-center"
            >
              <input
                type="text"
                class="form-control form-control-sm flex-grow-1"
                v-model="order.text"
                :disabled="order.checked || !canEditEmployeeProductOrders(emp)"
                @blur="saveEmployeeProductOrder(emp, index)"
              />
              <button
                class="btn btn-sm btn-outline-danger"
                :disabled="order.checked || !canEditEmployeeProductOrders(emp)"
                @click="deleteEmployeeProductOrder(emp, index)"
              >
                Delete
              </button>
              <input
                v-if="currentUser.role === 'Admin'"
                type="checkbox"
                v-model="order.checked"
                class="custom-checkbox"
                :disabled="!order.text.trim()"
                @change="toggleEmployeeProductOrder(emp, index)"
              />
            </div>
          </div>
        </div>

        <div v-else-if="activeLevel3 === 'schedule'">
          <div
            v-for="day in scheduleDays"
            :key="day.name"
            class="mb-2 d-flex gap-2 align-items-center"
          >
            <span style="width: 80px">{{ day.name }}</span>

            <select
              class="form-select form-select-sm text-danger"
              v-model="selectedEmployee.schedule[day.name].start"
              :disabled="!canEditSelectedSchedule"
            >
              <option value="-">-</option>
              <option v-for="h in hours" :key="h" :value="h">{{ h }}</option>
            </select>

            <select
              class="form-select form-select-sm text-danger"
              v-model="selectedEmployee.schedule[day.name].end"
              :disabled="!canEditSelectedSchedule"
            >
              <option value="-">-</option>
              <option v-for="h in hours" :key="h" :value="h">{{ h }}</option>
            </select>
          </div>
          <div class="mt-2 fw-bold text-danger">Sum: {{ totalHours }} hrs</div>
          <button
            class="btn btn-danger text-white w-100 mt-3 save-schedule-button"
            :disabled="!canEditSelectedSchedule"
            @click="saveSchedule"
          >
            Save schedule
          </button>
        </div>

        <div v-else-if="activeLevel3 === 'reviews'">
          <div class="mb-2 fw-bold text-danger">
            Average: {{ averageRating.toFixed(1) }}/5
          </div>
          <ul class="list-group list-group-flush">
            <li
              v-for="r in selectedEmployee.reviews"
              :key="r.comment"
              class="list-group-item text-danger"
            >
              <div class="d-flex justify-content-between">
                <span>{{ r.client }}</span>
                <span>{{ r.rating }}/5</span>
              </div>
              <div>{{ r.comment }}</div>
            </li>
          </ul>
        </div>

        <div v-else-if="activeLevel3 === 'earnings'">
          <div v-for="(value, key) in earnings" :key="key" class="mb-2">
            <b>{{ key }}:</b> {{ value }} €
          </div>
        </div>

        <div v-else-if="activeLevel3 === 'vacation'">
          <div class="vacation-summary">
            <div>
              <div class="vacation-title">
                {{ canEditSelectedVacation ? "Plan your vacation" : "Vacation overview" }}
              </div>
              <div class="vacation-subtitle">
                {{ canEditSelectedVacation ? "Select or remove your vacation days." : "Selected dates are shown in read-only mode." }}
              </div>
            </div>
            <div class="vacation-counter">
              <strong>{{ totalVacationDays }}</strong>
              <span>/ {{ selectedVacationAllowance }} days</span>
            </div>
          </div>

          <div class="vacation-month-controls">
            <button class="vacation-nav-button" aria-label="Previous month" @click="changeVacationMonth(-1)">
              ‹
            </button>
            <div class="vacation-month-label">{{ months[selectedMonth] }} {{ selectedYear }}</div>
            <button class="vacation-nav-button" aria-label="Next month" @click="changeVacationMonth(1)">
              ›
            </button>
          </div>

          <div class="vacation-calendar">
            <div v-for="day in weekdayNames" :key="day" class="vacation-weekday">
              {{ day }}
            </div>

            <template v-for="(week, weekIndex) in calendarWeeks" :key="weekIndex">
              <button
                v-for="(day, dayIndex) in week"
                :key="`${weekIndex}-${dayIndex}`"
                type="button"
                class="vacation-calendar-day"
                :class="{
                  'vacation-day': day && isVacationDay(day),
                  'vacation-weekend': day && isWeekend(day),
                  'vacation-empty': !day,
                }"
                :disabled="!day || !canEditSelectedVacation"
                :aria-label="day ? `${day} ${months[selectedMonth]} ${selectedYear}` : undefined"
                @click="day && toggleVacationDate(day)"
              >
                {{ day || "" }}
              </button>
            </template>
          </div>

          <div class="vacation-legend">
            <span><i class="legend-dot selected"></i> Vacation</span>
            <span><i class="legend-dot weekend"></i> Weekend</span>
          </div>

          <div v-if="selectedEmployee.vacations.length" class="selected-vacations">
            <div class="selected-vacations-title">Selected dates</div>
            <div class="selected-vacation-list">
              <span
                v-for="vacation in selectedEmployee.vacations"
                :key="vacation"
                class="selected-vacation-badge"
              >
                {{ formatVacationDate(vacation) }}
              </span>
            </div>
          </div>

          <div class="team-vacations">
            <div class="team-vacations-heading">
              <div>
                <div class="selected-vacations-title mb-0">All employee vacations</div>
                <div class="vacation-subtitle">Overview of every team member's selected dates.</div>
              </div>
              <span class="team-count">{{ employees.length }} employees</span>
            </div>

            <div class="team-vacation-list">
              <div v-for="employee in employees" :key="employee.id" class="team-vacation-row">
                <div class="team-vacation-person">
                  <span class="team-avatar">{{ employee.name.charAt(0).toUpperCase() }}</span>
                  <div>
                    <strong>{{ employee.name }} {{ employee.surname }}</strong>
                    <small>{{ employee.vacations.length }} / {{ employee.vacationAllowance }} days</small>
                  </div>
                </div>
                <label class="allowance-control">
                  <span>Available days</span>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    :value="employee.vacationAllowance"
                    :disabled="currentUser.role !== 'Admin'"
                    @change="saveVacationAllowance(employee, $event)"
                  />
                </label>
                <div v-if="employee.vacations.length" class="selected-vacation-list team-dates">
                  <span
                    v-for="vacation in employee.vacations"
                    :key="vacation"
                    class="selected-vacation-badge"
                  >
                    {{ formatVacationDate(vacation) }}
                  </span>
                </div>
                <div v-else class="no-vacations">No selected dates</div>
              </div>
            </div>
          </div>
        </div>

        <div v-else>Placeholder content</div>
      </div>
    </div>
  </div>
</template>

<script>
import { createEmployee } from "@/data/employeesData.js";
import { appointments } from "@/data/appointments";
import { findTreatment } from "@/data/treatmentsData";
import { getCurrentUser } from "@/data/auth";
import { api } from "@/services/api";

export default {
  name: "Employees",
  props: {
    currentUser: {
      type: Object,
      default: () => getCurrentUser(),
    },
  },

  data() {
    return {
      showAddForm: false,
      newEmployeeName: "",
      selectedTreatment: "",
      selectedEmployee: null,
      selectedEmployeeRole: "",
      newEmployeePassword: "",
      activeLevel3: null,
      treatments: [],
      hours: Array.from(
        { length: 15 },
        (_, i) => `${String(7 + i).padStart(2, "0")}:00`,
      ),
      scheduleDays: [
        { name: "Monday" },
        { name: "Tuesday" },
        { name: "Wednesday" },
        { name: "Thursday" },
        { name: "Friday" },
        { name: "Saturday" },
        { name: "Sunday" },
      ],
      level2Options: [
        { name: "edit", label: "Edit" },
        { name: "role", label: "Role" },
        { name: "specialty", label: "Specialty" },
        { name: "schedule", label: "Schedule" },
        { name: "reviews", label: "Reviews" },
        { name: "earnings", label: "Earnings" },
        { name: "productOrders", label: "Product orders" },
        { name: "vacation", label: "Vacation" },
      ],
      selectedMonth: new Date().getMonth(),
      selectedYear: new Date().getFullYear(),
      months: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
      weekdayNames: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      vacationLimit: 20,
      employees: [],
      appointmentsList: appointments,
    };
  },

  computed: {
    isSelectedOwnEmployee() {
      return Boolean(
        this.selectedEmployee &&
        this.currentUser.role === "Beautician" &&
        (this.selectedEmployee.id === this.currentUser.id ||
          this.selectedEmployee.username === this.currentUser.username),
      );
    },
    canEditSelectedProfile() {
      return this.currentUser.role === "Admin" || this.isSelectedOwnEmployee;
    },
    canEditSelectedTreatments() {
      return this.currentUser.role === "Admin" || this.isSelectedOwnEmployee;
    },
    canEditActiveSection() {
      if (this.currentUser.role === "Admin") return true;
      if (!this.isSelectedOwnEmployee) return false;
      return ["edit", "specialty", "schedule", "productOrders", "vacation"].includes(this.activeLevel3);
    },
    canEditSelectedSchedule() {
      return Boolean(
        this.selectedEmployee &&
        (this.currentUser.role === "Admin" ||
          (this.currentUser.role === "Beautician" &&
            (this.selectedEmployee.id === this.currentUser.id ||
              this.selectedEmployee.username === this.currentUser.username))),
      );
    },
    canEditSelectedVacation() {
      return Boolean(
        this.selectedEmployee &&
        (this.currentUser.role === "Admin" ||
          this.selectedEmployee.id === this.currentUser.id ||
          this.selectedEmployee.username === this.currentUser.username),
      );
    },
    visibleLevel2Options() {
      return this.level2Options;
    },
    activeLevel3Label() {
      const opt = this.level2Options.find((o) => o.name === this.activeLevel3);
      return opt ? opt.label : "";
    },
    totalHours() {
      if (!this.selectedEmployee) return 0;
      let sum = 0;
      for (let day of Object.values(this.selectedEmployee.schedule)) {
        const start = day.start === "-" ? null : parseInt(day.start);
        const end = day.end === "-" ? null : parseInt(day.end);
        if (start !== null && end !== null) sum += end - start;
      }
      return sum;
    },
    averageRating() {
      if (!this.selectedEmployee || !this.selectedEmployee.reviews.length)
        return 0;
      const sum = this.selectedEmployee.reviews.reduce(
        (acc, r) => acc + r.rating,
        0,
      );
      return sum / this.selectedEmployee.reviews.length;
    },
    daysInMonth() {
      const numDays = new Date(
        this.selectedYear,
        this.selectedMonth + 1,
        0,
      ).getDate();
      return Array.from({ length: numDays }, (_, i) => i + 1);
    },
    weeksInMonth() {
      const days = this.daysInMonth;
      const firstDay = new Date(
        this.selectedYear,
        this.selectedMonth,
        1,
      ).getDay(); // 0 = Sun
      const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday-first
      const weeks = [];
      let week = Array(offset).fill(null);
      days.forEach((day) => {
        week.push(day);
        if (week.length === 7) {
          weeks.push(week);
          week = [];
        }
      });
      if (week.length > 0)
        while (week.length < 7) (week.push(null), weeks.push(week));
      return weeks;
    },
    totalVacationDays() {
      if (!this.selectedEmployee) return 0;
      return this.selectedEmployee.vacations.length;
    },
    selectedVacationAllowance() {
      return this.selectedEmployee?.vacationAllowance ?? this.vacationLimit;
    },
    earnings() {
      if (!this.selectedEmployee) return {};
      const month = new Date().toISOString().slice(0, 7);
      const total = this.appointmentsList
        .filter((appointment) =>
          appointment.beautician === this.selectedEmployee.name &&
          appointment.dayandhour?.startsWith(month),
        )
        .reduce((sum, appointment) => sum + this.appointmentEarnings(appointment), 0);

      return { [month]: total };
    },
    calendarWeeks() {
      const days = this.daysInMonth;
      const firstDay = new Date(
        this.selectedYear,
        this.selectedMonth,
        1,
      ).getDay(); // 0 = Sun
      const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday-first
      const weeks = [];
      let week = Array(offset).fill(null);

      days.forEach((day) => {
        week.push(day);
        if (week.length === 7) {
          weeks.push(week);
          week = [];
        }
      });

      if (week.length > 0) while (week.length < 7) week.push(null);
      if (week.length) weeks.push(week);

      return weeks;
    },
  },

  methods: {
    selectEmployee(emp) {
      this.selectedEmployee = emp;
      this.selectedEmployeeRole = emp.role;
      this.newEmployeePassword = "";
      this.activeLevel3 = null;
    },
    toggleLevel3(name) {
      this.activeLevel3 = this.activeLevel3 === name ? null : name;
    },
    async addEmployee() {
      if (!this.newEmployeeName.trim()) return;
      if (this.currentUser.role !== "Admin") return;
      const newEmp = createEmployee(this.newEmployeeName.trim());

      try {
        await api.refreshSession();
        const savedEmployee = await api.createEmployee({ name: newEmp.name });
        this.employees.push(savedEmployee);
      } catch (error) {
        alert(error.message);
        return;
      }

      this.newEmployeeName = "";
      this.showAddForm = false;
    },
    async assignTreatment() {
      if (!this.canEditSelectedTreatments || !this.selectedTreatment) return;
      const assignedTreatments = this.selectedEmployee.treatments || [];
      if (assignedTreatments.includes(this.selectedTreatment)) return;

      try {
        await api.refreshSession();
        const savedEmployee = await api.updateEmployeeTreatments(
          this.selectedEmployee.id,
          [...assignedTreatments, this.selectedTreatment],
        );
        Object.assign(this.selectedEmployee, savedEmployee);
        this.selectedTreatment = "";
      } catch (error) {
        alert(error.message);
      }
    },
    async removeTreatment(treatment) {
      if (!this.canEditSelectedTreatments || !this.selectedEmployee?.id) return;

      try {
        await api.refreshSession();
        const savedEmployee = await api.updateEmployeeTreatments(
          this.selectedEmployee.id,
          this.selectedEmployee.treatments.filter((item) => item !== treatment),
        );
        Object.assign(this.selectedEmployee, savedEmployee);
      } catch (error) {
        alert(error.message);
      }
    },
    async persistSelectedEmployee() {
      if (this.currentUser.role !== "Admin") return;
      if (!this.selectedEmployee?.id) {
        alert("Employee is not loaded from database. Restart backend and refresh the page.");
        return;
      }

      await this.persistEmployee(this.selectedEmployee);
    },
    async persistSelectedProfile() {
      if (!this.canEditSelectedProfile || !this.selectedEmployee?.id) return;

      try {
        await api.refreshSession();
        const savedEmployee = await api.updateEmployeeProfile(this.selectedEmployee.id, {
          name: this.selectedEmployee.name,
          surname: this.selectedEmployee.surname,
          birthday: this.selectedEmployee.birthday,
          mobile: this.selectedEmployee.mobile,
          email: this.selectedEmployee.email,
        });
        Object.assign(this.selectedEmployee, savedEmployee);
      } catch (error) {
        alert(error.message);
        await this.loadEmployees();
      }
    },
    async saveEmployeePassword() {
      if (!this.canEditSelectedProfile || !this.selectedEmployee?.id) return;
      if (this.newEmployeePassword.length < 8) {
        alert("Password must contain at least 8 characters.");
        return;
      }

      try {
        await api.refreshSession();
        await api.updateEmployeeProfile(this.selectedEmployee.id, {
          password: this.newEmployeePassword,
        });
        this.newEmployeePassword = "";
        alert("Password saved.");
      } catch (error) {
        alert(error.message);
      }
    },
    async persistEmployee(employee) {
      if (this.currentUser.role !== "Admin" || !employee?.id) return;
      try {
        const savedEmployee = await api.updateEmployee(employee.id, employee, this.currentUser.role);
        Object.assign(employee, savedEmployee);
      } catch (error) {
        alert(error.message);
      }
    },
    async saveRole() {
      if (this.currentUser.role !== "Admin" || !this.selectedEmployee?.id) return;

      try {
        await api.refreshSession();
        const savedEmployee = await api.updateEmployee(this.selectedEmployee.id, {
          role: this.selectedEmployeeRole,
        });
        this.selectedEmployee.role = savedEmployee.role;
        this.selectedEmployeeRole = savedEmployee.role;
        alert("Role saved.");
      } catch (error) {
        this.selectedEmployeeRole = this.selectedEmployee.role;
        alert(error.message);
      }
    },
    async saveSchedule() {
      if (!this.canEditSelectedSchedule || !this.selectedEmployee?.id) return;

      const invalidDay = this.scheduleDays.find(({ name }) => {
        const { start, end } = this.selectedEmployee.schedule[name];
        if (start === "-" && end === "-") return false;
        return start === "-" || end === "-" || this.toScheduleMinutes(start) >= this.toScheduleMinutes(end);
      });

      if (invalidDay) {
        alert(`Enter a valid start and end time for ${invalidDay.name}.`);
        return;
      }

      try {
        await api.refreshSession();
        const savedEmployee = await api.updateEmployeeSchedule(
          this.selectedEmployee.id,
          this.selectedEmployee.schedule,
        );
        this.selectedEmployee.schedule = savedEmployee.schedule;
        alert("Schedule saved.");
      } catch (error) {
        alert(error.message);
      }
    },
    toScheduleMinutes(time) {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    },
    appointmentEarnings(appointment) {
      if (appointment.status === "completed") {
        return Number(appointment.earningsAmount || appointment.price || findTreatment(appointment.treatment)?.price || 0);
      }
      if (appointment.status === "cancelled") {
        return Number(appointment.cancellationFee || appointment.earningsAmount || 0);
      }
      return 0;
    },
    async deleteSelectedEmployee() {
      if (this.currentUser.role !== "Admin" || !this.selectedEmployee?.id) return;

      const employee = this.selectedEmployee;
      const fullName = `${employee.name} ${employee.surname || ""}`.trim();
      if (!confirm(`Delete employee ${fullName}? This action cannot be undone.`)) return;

      try {
        await api.deleteEmployee(employee.id);
        this.employees = this.employees.filter((item) => item.id !== employee.id);
        this.selectedEmployee = null;
        this.activeLevel3 = null;
      } catch (error) {
        alert(error.message);
      }
    },
    canEditEmployeeProductOrders(employee) {
      return Boolean(
        employee &&
        (this.currentUser.role === "Admin" ||
          (this.currentUser.role === "Beautician" &&
            (employee.id === this.currentUser.id || employee.username === this.currentUser.username))),
      );
    },
    async addEmployeeProductOrder(employee) {
      if (!this.canEditEmployeeProductOrders(employee)) return;
      try {
        await api.refreshSession();
        const order = await api.createProductOrder(employee.id, "");
        employee.productOrders.push(order);
      } catch (error) {
        alert(error.message);
      }
    },
    async saveEmployeeProductOrder(employee, index) {
      const order = employee.productOrders[index];
      if (!order || order.checked || !this.canEditEmployeeProductOrders(employee)) return;
      try {
        await api.refreshSession();
        const savedOrder = await api.updateProductOrder(employee.id, index, { text: order.text });
        Object.assign(order, savedOrder);
      } catch (error) {
        alert(error.message);
        await this.loadEmployees();
      }
    },
    async deleteEmployeeProductOrder(employee, index) {
      const order = employee.productOrders[index];
      if (!order || order.checked || !this.canEditEmployeeProductOrders(employee)) return;
      try {
        await api.refreshSession();
        await api.deleteProductOrder(employee.id, index);
        employee.productOrders.splice(index, 1);
        if (!employee.productOrders.length) employee.productOrders.push({ text: "", checked: false });
      } catch (error) {
        alert(error.message);
      }
    },
    async toggleEmployeeProductOrder(employee, index) {
      const order = employee.productOrders[index];
      if (!order || this.currentUser.role !== "Admin") return;
      try {
        await api.refreshSession();
        const savedOrder = await api.updateProductOrder(employee.id, index, { checked: order.checked });
        Object.assign(order, savedOrder);
      } catch (error) {
        order.checked = !order.checked;
        alert(error.message);
      }
    },
    async toggleVacationDate(day) {
      if (!this.canEditSelectedVacation) return;
      const dateStr = `${this.selectedYear}-${String(this.selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const previousVacations = [...this.selectedEmployee.vacations];
      const index = this.selectedEmployee.vacations.indexOf(dateStr);
      if (
        index === -1 &&
        this.selectedEmployee.vacations.length < this.selectedVacationAllowance
      ) {
        this.selectedEmployee.vacations.push(dateStr);
      } else if (index !== -1) this.selectedEmployee.vacations.splice(index, 1);

      try {
        const savedEmployee = await api.updateEmployeeVacations(
          this.selectedEmployee.id,
          this.selectedEmployee.vacations,
        );
        this.selectedEmployee.vacations = savedEmployee.vacations;
      } catch (error) {
        this.selectedEmployee.vacations = previousVacations;
        alert(error.message);
      }
    },
    async saveVacationAllowance(employee, event) {
      if (this.currentUser.role !== "Admin") return;
      const vacationAllowance = Number(event.target.value);

      try {
        const savedEmployee = await api.updateVacationAllowance(employee.id, vacationAllowance);
        employee.vacationAllowance = savedEmployee.vacationAllowance;
        event.target.value = savedEmployee.vacationAllowance;
      } catch (error) {
        event.target.value = employee.vacationAllowance;
        alert(error.message);
      }
    },
    changeVacationMonth(direction) {
      const date = new Date(this.selectedYear, this.selectedMonth + direction, 1);
      this.selectedMonth = date.getMonth();
      this.selectedYear = date.getFullYear();
    },
    formatVacationDate(value) {
      const date = new Date(`${value}T00:00:00`);
      return date.toLocaleDateString("hr-HR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    },
    isVacationDay(day) {
      if (!this.selectedEmployee) return false;
      const dateStr = `${this.selectedYear}-${String(this.selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return this.selectedEmployee.vacations.includes(dateStr);
    },
    isWeekend(day) {
      const date = new Date(this.selectedYear, this.selectedMonth, day);
      return date.getDay() === 0 || date.getDay() === 6;
    },
  },

  async mounted() {
    try {
      this.employees = await api.getEmployees();
    } catch (error) {
      console.error(error);
      alert(`Employees could not be loaded from database: ${error.message}`);
      return;
    }

    try {
      const [savedTreatments, savedAppointments] = await Promise.all([
        api.getTreatments(),
        api.getAppointments(),
      ]);
      this.treatments = savedTreatments;
      this.selectedTreatment = savedTreatments[0]?.name || "";
      this.appointmentsList = savedAppointments;
    } catch (error) {
      console.error(error);
    }

    this.employees.forEach((emp) => {
      if (!emp.schedule) emp.schedule = {};

      this.scheduleDays.forEach((d) => {
        if (!emp.schedule[d.name]) {
          emp.schedule[d.name] = { start: "-", end: "-" };
        }
      });

      if (!emp.productOrders?.length) {
        emp.productOrders = [{ text: "", checked: false }];
      }

      if (!emp.reviews) emp.reviews = [];
      if (!emp.specialties) emp.specialties = [];
      if (!emp.treatments) emp.treatments = [];
      if (!Number.isFinite(emp.vacationAllowance)) emp.vacationAllowance = this.vacationLimit;
      emp.vacations = (emp.vacations || [])
        .map((vacation) => (typeof vacation === "string" ? vacation : vacation.date))
        .filter(Boolean);
    });
  },
};
</script>

<style scoped>
.text-danger {
  color: #8b0000 !important;
}
.read-only-badge {
  background: #eee6e8;
  color: #76565e;
  font-size: 0.68rem;
  letter-spacing: 0.03em;
}
.vacation-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  margin-bottom: 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, #fff5f6, #f9e4e8);
}
.vacation-title {
  color: #5f1022;
  font-size: 16px;
  font-weight: 700;
}
.vacation-subtitle {
  color: #7f6670;
  font-size: 12px;
}
.vacation-counter {
  min-width: 82px;
  padding: 8px 10px;
  border-radius: 12px;
  background: #fff;
  text-align: center;
  box-shadow: 0 4px 14px rgba(112, 18, 42, 0.1);
}
.vacation-counter strong {
  display: block;
  color: #8b0000;
  font-size: 19px;
  line-height: 1;
}
.vacation-counter span {
  color: #806a70;
  font-size: 10px;
}
.vacation-month-controls {
  display: grid;
  grid-template-columns: 36px 1fr 36px;
  align-items: center;
  margin-bottom: 12px;
}
.vacation-month-label {
  color: #5f1022;
  font-weight: 700;
  text-align: center;
}
.vacation-nav-button {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(139, 0, 0, 0.2);
  border-radius: 50%;
  background: #fff;
  color: #8b0000;
  font-size: 22px;
  line-height: 1;
}
.vacation-nav-button:hover {
  background: #8b0000;
  color: #fff;
}
.vacation-calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}
.vacation-weekday {
  padding: 4px 0 7px;
  color: #8a7379;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
}
.vacation-calendar-day {
  aspect-ratio: 1;
  border: 0;
  border-radius: 10px;
  background: #f8f3f4;
  color: #3f3437;
  font-size: 13px;
  transition: transform 0.15s ease, background 0.15s ease;
}
.vacation-calendar-day:not(:disabled):hover {
  background: #efdadd;
  transform: translateY(-1px);
}
.vacation-calendar-day.vacation-day {
  background: linear-gradient(135deg, #a51536, #700c23);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(112, 18, 42, 0.22);
}
.vacation-calendar-day.vacation-weekend:not(.vacation-day) {
  background: #f8e9ec;
  color: #a02240;
}
.vacation-calendar-day.vacation-empty {
  background: transparent;
}
.vacation-legend {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  color: #7f6a70;
  font-size: 11px;
}
.legend-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  margin-right: 4px;
  border-radius: 50%;
}
.legend-dot.selected {
  background: #8b0000;
}
.legend-dot.weekend {
  background: #e8bfc8;
}
.selected-vacations {
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid rgba(139, 0, 0, 0.12);
}
.selected-vacations-title {
  margin-bottom: 8px;
  color: #5f1022;
  font-size: 12px;
  font-weight: 700;
}
.selected-vacation-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.selected-vacation-badge {
  padding: 5px 9px;
  border-radius: 999px;
  background: #f7e4e8;
  color: #7c1730;
  font-size: 11px;
  font-weight: 600;
}
.team-vacations {
  padding-top: 16px;
  margin-top: 18px;
  border-top: 1px solid rgba(139, 0, 0, 0.14);
}
.team-vacations-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.team-count {
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 999px;
  background: #f5e3e7;
  color: #7c1730;
  font-size: 10px;
  font-weight: 700;
}
.team-vacation-list {
  display: grid;
  gap: 9px;
}
.team-vacation-row {
  padding: 10px;
  border: 1px solid rgba(139, 0, 0, 0.1);
  border-radius: 12px;
  background: #fffafa;
}
.team-vacation-person {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 8px;
  color: #5f1022;
}
.team-vacation-person small {
  display: block;
  color: #8a7379;
  font-size: 10px;
}
.allowance-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 9px;
  margin: 2px 0 9px 39px;
  border-radius: 9px;
  background: #f8edef;
  color: #765e65;
  font-size: 11px;
  font-weight: 600;
}
.allowance-control input {
  width: 62px;
  padding: 3px 6px;
  border: 1px solid rgba(139, 0, 0, 0.2);
  border-radius: 8px;
  background: #fff;
  color: #7c1730;
  font-weight: 700;
  text-align: center;
}
.team-avatar {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #a51536, #700c23);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}
.team-dates {
  padding-left: 39px;
}
.no-vacations {
  padding-left: 39px;
  color: #9b858b;
  font-size: 11px;
  font-style: italic;
}
.custom-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #8b0000;
  cursor: pointer;
}
.specialty-panel {
  overflow: hidden;
  border: 1px solid rgba(139, 0, 0, 0.12);
  border-radius: 18px;
  background: linear-gradient(145deg, #fff, #fff8f9);
  box-shadow: 0 12px 30px rgba(91, 16, 34, 0.08);
}
.specialty-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  background: linear-gradient(135deg, #8b1732, #65091f);
  color: #fff;
}
.specialty-heading-icon {
  display: grid;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.14);
  font-family: var(--bd-brand-font);
  font-size: 20px;
  font-weight: 700;
}
.specialty-heading h6 {
  margin: 0 0 2px;
  font-size: 15px;
  font-weight: 700;
}
.specialty-heading p,
.specialty-section-title p {
  margin: 0;
  font-size: 11px;
}
.specialty-heading p {
  color: rgba(255, 255, 255, 0.72);
}
.specialty-section {
  padding: 17px 18px;
}
.specialty-label {
  display: block;
  margin-bottom: 7px;
  color: #5f1022;
  font-size: 12px;
  font-weight: 700;
}
.specialty-action-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 9px;
}
.specialty-control {
  min-height: 40px;
  border-color: rgba(139, 0, 0, 0.16);
  border-radius: 11px;
  color: #6f1830;
  font-size: 13px;
  box-shadow: none;
}
.specialty-control:focus {
  border-color: rgba(139, 0, 0, 0.5);
  box-shadow: 0 0 0 3px rgba(139, 0, 0, 0.08);
}
.specialty-primary-button,
.specialty-secondary-button {
  min-height: 40px;
  padding: 0 16px;
  border-radius: 11px;
  font-size: 12px;
  font-weight: 700;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.specialty-primary-button {
  border: 0;
  background: linear-gradient(135deg, #a51536, #700c23);
  color: #fff;
  box-shadow: 0 6px 14px rgba(112, 12, 35, 0.2);
}
.specialty-secondary-button {
  border: 1px solid rgba(139, 0, 0, 0.22);
  background: #fff;
  color: #8b1732;
}
.specialty-primary-button:not(:disabled):hover,
.specialty-secondary-button:not(:disabled):hover {
  transform: translateY(-1px);
}
.specialty-primary-button:disabled,
.specialty-secondary-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.specialty-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;
}
.specialty-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 8px 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}
.specialty-chip-assigned {
  background: #f5dce2;
  color: #71142b;
}
.specialty-chip-library {
  border: 1px solid rgba(139, 0, 0, 0.12);
  background: #fff;
  color: #6e5360;
}
.specialty-chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9d1c3a;
}
.specialty-delete {
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #8b1732;
  padding: 0;
  width: 18px;
  height: 18px;
  font-size: 16px;
  line-height: 1;
}
.specialty-delete:not(:disabled):hover {
  background: rgba(139, 0, 0, 0.1);
}
.specialty-delete:disabled {
  opacity: 0.45;
}
.specialty-delete-muted {
  color: #a47b87;
}
.specialty-empty-state {
  margin-top: 12px;
  padding: 12px;
  border: 1px dashed rgba(139, 0, 0, 0.16);
  border-radius: 11px;
  color: #9a7d85;
  font-size: 11px;
  text-align: center;
}
.specialty-divider {
  height: 1px;
  margin: 0 18px;
  background: linear-gradient(90deg, transparent, rgba(139, 0, 0, 0.16), transparent);
}
.specialty-section-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.specialty-section-title .specialty-label {
  margin-bottom: 2px;
}
.specialty-section-title p {
  color: #927982;
}
.specialty-count {
  display: grid;
  flex: 0 0 26px;
  height: 26px;
  place-items: center;
  border-radius: 50%;
  background: #f3dce2;
  color: #7d1931;
  font-size: 11px;
  font-weight: 700;
}
.specialty-library {
  max-height: 116px;
  overflow-y: auto;
  padding-right: 3px;
}
@media (max-width: 576px) {
  .specialty-action-row {
    grid-template-columns: 1fr;
  }
}
.delete-employee-button {
  border-radius: 999px;
  font-weight: 600;
}
.save-schedule-button {
  border-radius: 999px;
  font-weight: 600;
}
.card {
  border-radius: 12px;
}
.list-group-item {
  cursor: pointer;
}
.list-group-item-action:hover,
.list-group-item-action:focus,
.list-group-item-action.active {
  color: #fff !important;
}
.main-wrapper {
  max-height: 80vh;
  overflow: hidden;
}
.scroll-card {
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
