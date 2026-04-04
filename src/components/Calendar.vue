<template>
  <div class="calendar-container">
    <div class="d-flex justify-content-center align-items-center gap-3 mb-3">
      <button @click="prevDay" class="btn btn-danger">←</button>

      <div class="fw-bold fs-5">
        {{ formattedDate }}
      </div>

      <button @click="nextDay" class="btn btn-danger">→</button>
    </div>

    <div class="table-responsive" style="max-height: 70vh">
      <table class="table table-bordered text-center align-middle">
        <thead class="table-light sticky-top">
          <tr>
            <th>Time</th>
            <th v-for="employee in employees" :key="employee">
              {{ employee }}
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
              :key="employee + time"
              @click="
                isWithinWorkHours(employee, time)
                  ? openModal(employee, time)
                  : null
              "
              :style="{
                backgroundColor: isWithinWorkHours(employee, time)
                  ? '#f8f9fa'
                  : 'rgba(255,255,255,0.7)',
                cursor: isWithinWorkHours(employee, time)
                  ? 'pointer'
                  : 'not-allowed',
                color: '#8b0000',
              }"
            >
              {{ getCellData(employee, time) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { clients } from "@/data/clientsData";
import { employeesData } from "@/data/employeesData.js";
import { appointments } from "@/data/appointments";

export default {
  data() {
    return {
      schedule: {},
      currentDate: new Date("2026-04-06"),
      clientsList: clients,
    };
  },

  created() {
    this.loadAppointments();
  },

  computed: {
    employees() {
      return employeesData.map((e) => e.name);
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

    employeesMap() {
      const map = {};
      employeesData.forEach((emp) => {
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
    loadAppointments() {
      const structured = {};

      appointments.forEach((a) => {
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

    openModal(employee, time) {
      // ostavljeno za tvoju postojeću modal logiku
      console.log("Open:", employee, time);
    },

    getCellData(employee, time) {
      const entry = this.schedule[this.currentDateKey]?.[employee]?.[time];
      if (!entry) return "";

      return `${entry.treatment} - ${entry.client}`;
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

      const toMinutes = (t) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };

      return (
        toMinutes(time) >= toMinutes(work.start) &&
        toMinutes(time) <= toMinutes(work.end)
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

table {
  table-layout: fixed;
  width: 100%;
  border-radius: 16px;
}

thead th {
  background: white;
  color: #8b0000;
}

table td {
  background: rgba(255, 255, 255, 0.7);
  color: #8b0000;
}

table th,
table td {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
