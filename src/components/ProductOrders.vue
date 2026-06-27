<template>
  <div class="d-flex gap-3 p-3 flex-nowrap main-wrapper">
    <div v-for="emp in visibleEmployees" :key="emp.name" class="card p-3 orders-card">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <b>{{ emp.name }}</b>
        <button class="btn btn-sm btn-danger text-white" @click="addOrder(emp)">
          + Add order
        </button>
      </div>
      <div
        v-for="(order, index) in emp.productOrders"
        :key="index"
        class="d-flex gap-2 mt-2 align-items-center"
      >
        <input
          v-model="order.text"
          class="form-control form-control-sm"
          :ref="`orderInput-${emp.name}-${index}`"
        />
        <button
          class="btn btn-sm btn-danger text-white"
          :disabled="!order.text.trim()"
          @click="addOrderAfter(emp, index)"
        >
          Add
        </button>
        <button
          class="btn btn-sm btn-outline-danger"
          @click="deleteOrder(emp, index)"
        >
          Delete
        </button>
        <input
          v-if="currentUser.role === 'Admin'"
          v-model="order.checked"
          type="checkbox"
          class="custom-checkbox"
          @change="handleChecked(emp, index)"
        />
        <span v-else-if="order.checked">✓</span>
      </div>
    </div>
  </div>
</template>

<script>
import { employeesData } from "@/data/employeesData";
import { getCurrentUser } from "@/data/auth";

export default {
  props: {
    currentUser: {
      type: Object,
      default: () => getCurrentUser(),
    },
  },
  computed: {
    visibleEmployees() {
      if (this.currentUser.role === "Admin") return employeesData;
      return employeesData.filter((e) => e.name === this.currentUser.name);
    },
  },
  mounted() {
    this.cleanupCheckedOrders();
    this.cleanupInterval = setInterval(this.cleanupCheckedOrders, 60 * 60 * 1000);
  },
  beforeUnmount() {
    clearInterval(this.cleanupInterval);
  },
  methods: {
    addOrder(emp) {
      emp.productOrders.push({ text: "", checked: false });
      this.focusOrderInput(emp, emp.productOrders.length - 1);
    },
    addOrderAfter(emp, index) {
      const orders = emp.productOrders;
      const order = orders[index];
      if (!order?.text.trim()) return;

      const nextOrder = orders[index + 1];
      if (!nextOrder || nextOrder.text.trim()) {
        orders.splice(index + 1, 0, { text: "", checked: false });
      }

      this.focusOrderInput(emp, index + 1);
    },
    deleteOrder(emp, index) {
      emp.productOrders.splice(index, 1);

      if (!emp.productOrders.length) {
        emp.productOrders.push({ text: "", checked: false });
      }
    },
    handleChecked(emp, index) {
      const order = emp.productOrders[index];
      if (!order) return;

      if (order.checked) {
        order.checkedAt = new Date().toISOString();
      } else {
        delete order.checkedAt;
      }
    },
    cleanupCheckedOrders() {
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      const now = new Date();

      employeesData.forEach((emp) => {
        emp.productOrders = emp.productOrders.filter((order) => {
          if (!order.checked) return true;
          if (!order.checkedAt) return true;

          return now - new Date(order.checkedAt) < threeDays;
        });

        if (!emp.productOrders.length) {
          emp.productOrders.push({ text: "", checked: false });
        }
      });
    },
    focusOrderInput(emp, index) {
      this.$nextTick(() => {
        const input = this.$refs[`orderInput-${emp.name}-${index}`];
        const element = Array.isArray(input) ? input[0] : input;
        element?.focus();
      });
    },
  },
};
</script>

<style scoped>
.main-wrapper {
  height: 70vh;
  max-height: 70vh;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: hidden;
  align-items: stretch;
}
.orders-card {
  width: 320px;
  height: 100%;
  max-height: 100%;
  flex-shrink: 0;
  border-radius: 12px;
  overflow-y: auto;
}
.custom-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #8b0000;
}
</style>
