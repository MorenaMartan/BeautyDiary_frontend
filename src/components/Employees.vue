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

      <div
        v-if="!showAddForm"
        class="btn btn-sm btn-danger mt-3 text-white"
        @click="showAddForm = true"
      >
        + Add Employee
      </div>

      <div v-else class="mt-3">
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
          v-for="option in level2Options"
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
      <div class="card-header fw-bold text-danger">
        {{ activeLevel3Label }}
      </div>

      <div class="card-body p-3">
        <div v-if="activeLevel3 === 'edit'">
          <div class="mb-2">
            <label class="form-label fw-bold">Name</label>
            <input
              type="text"
              class="form-control form-control-sm text-danger"
              v-model="selectedEmployee.name"
            />
          </div>

          <div class="mb-2">
            <label class="form-label fw-bold">Surname</label>
            <input
              type="text"
              class="form-control form-control-sm text-danger"
              v-model="selectedEmployee.surname"
            />
          </div>

          <div class="mb-2">
            <label class="form-label fw-bold">Birthday</label>
            <input
              type="date"
              class="form-control form-control-sm text-danger"
              v-model="selectedEmployee.birthday"
            />
          </div>

          <div class="mb-2">
            <label class="form-label fw-bold">Mobile</label>
            <input
              type="text"
              class="form-control form-control-sm text-danger"
              v-model="selectedEmployee.mobile"
            />
          </div>

          <div class="mb-2">
            <label class="form-label fw-bold">Email</label>
            <input
              type="email"
              class="form-control form-control-sm text-danger"
              v-model="selectedEmployee.email"
            />
          </div>
        </div>

        <div v-if="activeLevel3 === 'role'">
          <select
            class="form-select form-select-sm text-danger"
            v-model="selectedEmployee.role"
          >
            <option value="Admin">Admin</option>
            <option value="Beautician">Beautician</option>
          </select>
        </div>

        <div v-else-if="activeLevel3 === 'specialty'">
          <div class="d-flex gap-2">
            <select
              class="form-select form-select-sm text-danger"
              v-model="selectedEmployee.specialty"
            >
              <option v-for="s in specialties" :key="s" :value="s">
                {{ s }}
              </option>
            </select>

            <button
              v-if="selectedEmployee.role === 'Admin'"
              class="btn btn-sm btn-danger text-white"
              @click="addSpecialty"
            >
              +Add
            </button>
          </div>
        </div>

        <div v-else-if="activeLevel3 === 'productOrders'">
          <div
            v-for="emp in selectedEmployee.role === 'Admin'
              ? employees
              : [selectedEmployee]"
            :key="emp.name"
            class="mb-3"
          >
            <div class="fw-bold mb-2">{{ emp.name }}</div>

            <div
              v-for="(order, index) in emp.productOrders"
              :key="index"
              class="d-flex gap-2 mb-2 align-items-center"
            >
              <input
                type="text"
                class="form-control form-control-sm flex-grow-1"
                v-model="order.text"
                @input="handleInput(emp, index)"
              />
              <input
                type="checkbox"
                v-model="order.checked"
                class="custom-checkbox"
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
            >
              <option value="-">-</option>
              <option v-for="h in hours" :key="h" :value="h">{{ h }}</option>
            </select>

            <select
              class="form-select form-select-sm text-danger"
              v-model="selectedEmployee.schedule[day.name].end"
            >
              <option value="-">-</option>
              <option v-for="h in hours" :key="h" :value="h">{{ h }}</option>
            </select>
          </div>
          <div class="mt-2 fw-bold text-danger">Sum: {{ totalHours }} hrs</div>
        </div>

        <div v-else-if="activeLevel3 === 'reviews'">
          <div class="mb-2 fw-bold text-danger">
            Average: {{ averageRating.toFixed(1) }}/5
          </div>
          <ul class="list-group list-group-flush">
            <li
              v-for="r in selectedEmployee.reviews"
              :key="r.comment"
              class="list-group-item d-flex justify-content-between text-danger"
            >
              <span>{{ r.comment }}</span>
              <span>{{ r.rating }}/5</span>
            </li>
          </ul>
        </div>

        <div v-else-if="activeLevel3 === 'vacation'">
          <div class="d-flex gap-2 mb-2">
            <select
              v-model="selectedMonth"
              class="form-select form-select-sm text-danger"
            >
              <option v-for="(m, i) in months" :key="i" :value="i">
                {{ m }}
              </option>
            </select>
            <input
              type="number"
              v-model.number="selectedYear"
              class="form-control form-control-sm text-danger"
              style="width: 100px"
            />
          </div>

          <div class="d-flex mb-1">
            <div
              v-for="day in weekdayNames"
              :key="day"
              class="text-center fw-bold"
              style="width: 40px"
            >
              {{ day }}
            </div>
          </div>

          <div>
            <div
              v-for="week in calendarWeeks"
              :key="week[0]"
              class="d-flex mb-1"
            >
              <div
                v-for="day in week"
                :key="day ? day : 'empty-' + Math.random()"
                @click="day && toggleVacationDate(day)"
                class="text-center p-2 rounded me-1"
                :class="[
                  day && isVacationDay(day)
                    ? 'vacation-day'
                    : 'bg-light text-dark',
                  day && isWeekend(day) ? 'fw-bold text-danger' : '',
                ]"
                style="width: 40px; height: 40px; cursor: pointer"
              >
                {{ day || "" }}
              </div>
            </div>
          </div>

          <div
            class="mt-2 fw-bold text-danger"
            v-if="selectedEmployee.role !== 'Admin'"
          >
            Total Vacation Days: {{ totalVacationDays }} / {{ vacationLimit }}
          </div>

          <div v-if="selectedEmployee.role === 'Admin'" class="mt-3">
            <div
              class="max-vacation-scroll p-2 border rounded"
              style="max-height: 200px; overflow-y: auto"
            >
              <div v-for="emp in employees" :key="emp.name" class="mb-2">
                <strong>{{ emp.name }}:</strong> {{ emp.vacations.length }} days
                used
                <div class="d-flex flex-wrap gap-1 mt-1">
                  <span
                    v-for="v in emp.vacations"
                    :key="v.date"
                    class="badge bg-danger text-white"
                    >{{ v.date }}</span
                  >
                </div>
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
import { employeesData } from "@/data/employeesData.js";

export default {
  name: "Employees",

  data() {
    return {
      showAddForm: false,
      newEmployeeName: "",
      selectedEmployee: null,
      activeLevel3: null,
      specialties: ["Haircut", "Facial", "Massage"],
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
    };
  },

  computed: {
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
      this.activeLevel3 = null;
    },
    toggleLevel3(name) {
      this.activeLevel3 = this.activeLevel3 === name ? null : name;
    },
    addEmployee() {
      if (!this.newEmployeeName.trim()) return;
      const newEmp = {
        name: this.newEmployeeName.trim(),
        surname: "",
        role: "Beautician",
        specialty: "",
        schedule: {},
        reviews: [],
        productOrders: [{ text: "", checked: false }],
        vacations: [],
      };
      this.scheduleDays.forEach(
        (d) => (newEmp.schedule[d.name] = { start: "-", end: "-" }),
      );
      this.employees.push(newEmp);
      this.newEmployeeName = "";
      this.showAddForm = false;
    },
    addSpecialty() {
      const newSpec = prompt("Enter new specialty:");
      if (newSpec && !this.specialties.includes(newSpec)) {
        this.specialties.push(newSpec);
        this.selectedEmployee.specialty = newSpec;
      }
    },
    handleInput(emp, index) {
      const orders = emp.productOrders;
      if (index === orders.length - 1 && orders[index].text.trim()) {
        orders.push({ text: "", checked: false });
      }
    },
    toggleVacationDate(day) {
      if (!this.selectedEmployee) return;
      const dateStr = `${this.selectedYear}-${String(this.selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const index = this.selectedEmployee.vacations.findIndex(
        (v) => v.date === dateStr,
      );
      if (
        index === -1 &&
        this.selectedEmployee.vacations.length < this.vacationLimit
      ) {
        this.selectedEmployee.vacations.push({ date: dateStr });
      } else if (index !== -1) this.selectedEmployee.vacations.splice(index, 1);
    },
    isVacationDay(day) {
      if (!this.selectedEmployee) return false;
      const dateStr = `${this.selectedYear}-${String(this.selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return this.selectedEmployee.vacations.some((v) => v.date === dateStr);
    },
    isWeekend(day) {
      const date = new Date(this.selectedYear, this.selectedMonth, day);
      return date.getDay() === 0 || date.getDay() === 6;
    },
  },

  mounted() {
    this.employees = employeesData.map((emp) => {
      const schedule = { ...emp.schedule };
      this.scheduleDays.forEach((d) => {
        if (!schedule[d.name]) schedule[d.name] = { start: "-", end: "-" };
      });
      return {
        ...emp,
        schedule,
        productOrders: emp.productOrders?.length
          ? emp.productOrders
          : [{ text: "", checked: false }],
        reviews: emp.reviews || [],
        vacations: emp.vacations || [],
      };
    });
  },
};
</script>

<style scoped>
.text-danger {
  color: #8b0000 !important;
}
.vacation-day {
  background-color: #8b0000;
  color: white;
}
.custom-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #8b0000;
  cursor: pointer;
}
.card {
  border-radius: 12px;
}
.list-group-item {
  cursor: pointer;
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
