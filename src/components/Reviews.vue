<template>
  <div class="reviews-wrapper p-3 main-wrapper">
    <div class="reviews-summary mb-3">
      <div class="summary-card">
        <span>Total reviews</span>
        <b>{{ totalReviews }}</b>
      </div>
      <div class="summary-card">
        <span>Average rating</span>
        <b>{{ overallAverage.toFixed(1) }}/5</b>
      </div>
      <div class="summary-card">
        <span>Top beautician</span>
        <b>{{ topEmployee }}</b>
      </div>
    </div>

    <div class="reviews-grid">
      <div v-for="emp in visibleEmployees" :key="emp.name" class="card p-3 review-card">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div>
            <b class="employee-name">{{ emp.name }}</b>
            <div class="review-count">{{ emp.reviews?.length || 0 }} reviews</div>
          </div>
          <div class="rating-badge">
            {{ average(emp).toFixed(1) }}
          </div>
        </div>

        <div class="stars mb-3">
          <span v-for="star in 5" :key="star" :class="{ muted: star > Math.round(average(emp)) }">★</span>
        </div>

        <div v-if="!emp.reviews?.length" class="empty-state">
          No reviews yet.
        </div>

        <div v-else class="review-list">
          <div v-for="r in emp.reviews" :key="r.client + r.comment" class="review-item">
            <div class="d-flex justify-content-between gap-2 mb-1">
              <div class="client-name">{{ r.client }}</div>
              <div class="small-rating">{{ r.rating }}/5</div>
            </div>
            <div class="review-stars">
              <span v-for="star in 5" :key="star" :class="{ muted: star > Number(r.rating) }">★</span>
            </div>
            <div class="comment mt-1">{{ r.comment }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { employeesData } from "@/data/employeesData";
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
    };
  },
  computed: {
    visibleEmployees() {
      if (this.currentUser.role === "Admin") return this.employeesList;
      return this.employeesList.filter((e) => e.name === this.currentUser.name);
    },
    totalReviews() {
      return this.visibleEmployees.reduce((sum, emp) => sum + (emp.reviews?.length || 0), 0);
    },
    overallAverage() {
      const reviews = this.visibleEmployees.flatMap((emp) => emp.reviews || []);
      if (!reviews.length) return 0;
      return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
    },
    topEmployee() {
      const sorted = [...this.visibleEmployees]
        .filter((emp) => emp.reviews?.length)
        .sort((a, b) => this.average(b) - this.average(a));

      return sorted[0]?.name || "-";
    },
  },
  methods: {
    average(emp) {
      if (!emp.reviews?.length) return 0;
      return emp.reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / emp.reviews.length;
    },
  },
  async mounted() {
    try {
      this.employeesList = await api.getEmployees();
    } catch (error) {
      console.error(error);
      this.employeesList = employeesData;
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

.reviews-wrapper {
  display: flex;
  flex-direction: column;
}

.reviews-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(160px, 1fr));
  gap: 12px;
  flex-shrink: 0;
}

.summary-card,
.review-card {
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
}

.summary-card span,
.review-count {
  font-size: 13px;
  opacity: 0.75;
}

.summary-card b {
  font-size: 20px;
}

.reviews-grid {
  display: flex;
  flex: 1;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  min-height: 0;
  padding-bottom: 4px;
}

.review-card {
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

.rating-badge {
  min-width: 46px;
  height: 36px;
  border-radius: 18px;
  background: #8b0000;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.stars,
.review-stars {
  color: #8b0000;
  letter-spacing: 2px;
}

.stars {
  font-size: 22px;
}

.review-stars {
  font-size: 13px;
}

.muted {
  color: rgba(139, 0, 0, 0.22);
}

.review-list {
  overflow-y: auto;
  padding-right: 4px;
}

.review-item {
  background: rgba(139, 0, 0, 0.07);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
}

.client-name,
.small-rating {
  font-weight: bold;
}

.small-rating {
  white-space: nowrap;
}

.comment {
  font-size: 14px;
  line-height: 1.35;
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
  .reviews-summary {
    grid-template-columns: 1fr;
  }
}
</style>
