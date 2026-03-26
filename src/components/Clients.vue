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
        <div class="d-flex justify-content-between mb-2">
          <b>Client details</b>
          <button
            class="btn btn-sm btn-outline-danger"
            @click="editMode = !editMode"
          >
            {{ editMode ? "Save" : "Edit" }}
          </button>
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

        <div><b>Termins:</b> {{ selectedClient.termins }}</div>
        <div><b>Cancelled:</b> {{ selectedClient.cancelled }}</div>
        <div><b>Wallet:</b> {{ selectedClient.wallet }} €</div>

        <hr />

        <div>
          <b>Stars:</b> {{ stars }} ⭐
          <div v-if="stars >= 15" class="text-success">
            15% discount available
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
    </div>
  </div>
</template>

<script>
import { clients } from "@/data/clientsData";

export default {
  name: "Clients",
  data() {
    return {
      search: "",
      selectedClient: null,
      editMode: false,
      clientsList: clients,
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
    stars() {
      if (!this.selectedClient) return 0;
      return Math.floor(this.selectedClient.wallet / 15);
    },
  },
  methods: {
    selectClient(c) {
      this.selectedClient = c;
      this.editMode = false;
      this.activeLevel3 = "diary";
    },
    addClient() {
      const newClient = {
        id: Date.now(),
        name: "New",
        surname: "Client",
        email: "",
        mobile: "",
        birthday: "",
        termins: 0,
        cancelled: 0,
        wallet: 0,
        diary: [{ date: "", text: "", expanded: false }],
      };
      this.clientsList.push(newClient);

      this.selectedClient = newClient;
      this.editMode = true;
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
    toggleLevel3(name) {
      this.activeLevel3 = this.activeLevel3 === name ? null : name;
    },
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
  background-image: url("/path/to/background.jpg");
  background-size: cover;
  background-position: center;
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
</style>
