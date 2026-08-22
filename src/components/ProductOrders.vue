<template>
  <div class="p-3">
    <div v-if="errorMessage" class="alert alert-danger py-2 mb-3">{{ errorMessage }}</div>
    <div v-if="loading" class="text-center py-5">Loading product orders...</div>
    <div v-else-if="!employees.length" class="card empty-state">
      There are no employee profiles available.
    </div>
    <div v-else class="d-flex gap-3 flex-nowrap main-wrapper">
    <div v-for="emp in employees" :key="emp.id" class="card p-3 orders-card">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div>
          <b>{{ employeeName(emp) }}</b>
          <div class="employee-label">{{ emp.role }}</div>
        </div>
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
          :disabled="order.checked"
          placeholder="Enter a product..."
          @blur="saveOrder(emp, index)"
          @keyup.enter="$event.target.blur()"
        />
        <button
          class="btn btn-sm btn-outline-danger"
          :disabled="order.checked"
          @click="deleteOrder(emp, index)"
        >
          Delete
        </button>
        <input
          v-if="currentUser.role === 'Admin'"
          v-model="order.checked"
          type="checkbox"
          class="custom-checkbox"
          :disabled="!order.text.trim()"
          @change="handleChecked(emp, index)"
        />
        <span v-else-if="order.checked" class="purchased-badge">✓ Purchased</span>
      </div>
    </div>
    </div>
  </div>
</template>

<script>
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
      employees: [],
      loading: true,
      errorMessage: "",
    };
  },
  async mounted() {
    await this.cleanupCheckedOrders();
    this.cleanupInterval = setInterval(this.cleanupCheckedOrders, 60 * 60 * 1000);
  },
  beforeUnmount() {
    clearInterval(this.cleanupInterval);
  },
  methods: {
    employeeName(employee) {
      return [employee.name, employee.surname].filter(Boolean).join(" ");
    },
    async loadOrders() {
      this.loading = true;
      this.errorMessage = "";
      try {
        this.employees = await api.getProductOrders();
      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.loading = false;
      }
    },
    async addOrder(emp) {
      this.errorMessage = "";
      try {
        const order = await api.createProductOrder(emp.id, "");
        emp.productOrders.push(order);
        this.focusOrderInput(emp, emp.productOrders.length - 1);
      } catch (error) {
        this.errorMessage = error.message;
      }
    },
    async saveOrder(emp, index) {
      const order = emp.productOrders[index];
      if (!order || order.checked || !order.text.trim()) return;
      this.errorMessage = "";
      try {
        await api.updateProductOrder(emp.id, index, { text: order.text.trim() });
        order.text = order.text.trim();
      } catch (error) {
        this.errorMessage = error.message;
        await this.loadOrders();
      }
    },
    async deleteOrder(emp, index) {
      this.errorMessage = "";
      try {
        await api.deleteProductOrder(emp.id, index);
        await this.loadOrders();
      } catch (error) {
        this.errorMessage = error.message;
      }
    },
    async handleChecked(emp, index) {
      const order = emp.productOrders[index];
      if (!order) return;
      this.errorMessage = "";
      try {
        const savedOrder = await api.updateProductOrder(emp.id, index, {
          checked: order.checked,
        });
        Object.assign(order, savedOrder);
      } catch (error) {
        this.errorMessage = error.message;
        await this.loadOrders();
      }
    },
    async cleanupCheckedOrders() {
      try {
        if (this.currentUser.role === "Admin") await api.cleanupProductOrders();
      } catch (error) {
        this.errorMessage = error.message;
      }
      await this.loadOrders();
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
.employee-label {
  color: #777;
  font-size: 0.75rem;
}
.purchased-badge {
  color: #198754;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}
.empty-state {
  padding: 2rem;
  text-align: center;
  color: #666;
}
</style>
