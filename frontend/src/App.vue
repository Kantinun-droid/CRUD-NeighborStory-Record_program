<script setup>
import { ref, onMounted } from 'vue'

const API_URL = import.meta.env.VITE_API_URL

// ===================== State: เพื่อนบ้าน =====================
const neighbors = ref([])
const loadingNeighbors = ref(false)
const errorMsg = ref('')

const neighborForm = ref({
  id: null,
  full_name: '',
  house_number: '',
  phone: '',
  family_members: '',
  occupation: '',
  relationship_status: 'รู้จัก',
})
const isEditingNeighbor = ref(false)

// เพื่อนบ้านที่กำลังเลือกดู (เพื่อแสดงเรื่องราวทางขวา)
const selectedNeighbor = ref(null)

// ===================== State: เรื่องราว =====================
const storyForm = ref({
  id: null,
  title: '',
  content: '',
  event_date: '',
})
const isEditingStory = ref(false)

// ===================== ฟังก์ชันเกี่ยวกับเพื่อนบ้าน =====================

async function fetchNeighbors() {
  loadingNeighbors.value = true
  errorMsg.value = ''
  try {
    const res = await fetch(`${API_URL}/api/neighbors`)
    if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ')
    neighbors.value = await res.json()
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    loadingNeighbors.value = false
  }
}

function resetNeighborForm() {
  neighborForm.value = {
    id: null,
    full_name: '',
    house_number: '',
    phone: '',
    family_members: '',
    occupation: '',
    relationship_status: 'รู้จัก',
  }
  isEditingNeighbor.value = false
}

async function saveNeighbor() {
  errorMsg.value = ''
  try {
    const payload = {
      full_name: neighborForm.value.full_name,
      house_number: neighborForm.value.house_number,
      phone: neighborForm.value.phone,
      family_members: neighborForm.value.family_members ? Number(neighborForm.value.family_members) : null,
      occupation: neighborForm.value.occupation,
      relationship_status: neighborForm.value.relationship_status,
    }

    let res
    if (isEditingNeighbor.value) {
      res = await fetch(`${API_URL}/api/neighbors/${neighborForm.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      res = await fetch(`${API_URL}/api/neighbors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error || 'บันทึกข้อมูลไม่สำเร็จ')
    }

    resetNeighborForm()
    await fetchNeighbors()
  } catch (err) {
    errorMsg.value = err.message
  }
}

function editNeighbor(neighbor) {
  neighborForm.value = { ...neighbor }
  isEditingNeighbor.value = true
}

async function deleteNeighbor(id) {
  if (!confirm('ยืนยันการลบเพื่อนบ้านคนนี้? เรื่องราวที่บันทึกไว้จะถูกลบไปด้วย')) return
  errorMsg.value = ''
  try {
    const res = await fetch(`${API_URL}/api/neighbors/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('ลบข้อมูลไม่สำเร็จ')
    if (selectedNeighbor.value?.id === id) selectedNeighbor.value = null
    await fetchNeighbors()
  } catch (err) {
    errorMsg.value = err.message
  }
}

function selectNeighbor(neighbor) {
  selectedNeighbor.value = neighbor
  resetStoryForm()
}

// ===================== ฟังก์ชันเกี่ยวกับเรื่องราว =====================

function resetStoryForm() {
  storyForm.value = { id: null, title: '', content: '', event_date: '' }
  isEditingStory.value = false
}

async function saveStory() {
  if (!selectedNeighbor.value) return
  errorMsg.value = ''
  try {
    const payload = {
      title: storyForm.value.title,
      content: storyForm.value.content,
      event_date: storyForm.value.event_date || null,
    }

    let res
    if (isEditingStory.value) {
      res = await fetch(`${API_URL}/api/stories/${storyForm.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      res = await fetch(`${API_URL}/api/neighbors/${selectedNeighbor.value.id}/stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error || 'บันทึกเรื่องราวไม่สำเร็จ')
    }

    resetStoryForm()
    await fetchNeighbors()
    const updated = neighbors.value.find((n) => n.id === selectedNeighbor.value.id)
    if (updated) selectedNeighbor.value = updated
  } catch (err) {
    errorMsg.value = err.message
  }
}

function editStory(story) {
  storyForm.value = { ...story }
  isEditingStory.value = true
}

async function deleteStory(id) {
  if (!confirm('ยืนยันการลบเรื่องราวนี้?')) return
  errorMsg.value = ''
  try {
    const res = await fetch(`${API_URL}/api/stories/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('ลบเรื่องราวไม่สำเร็จ')
    await fetchNeighbors()
    const updated = neighbors.value.find((n) => n.id === selectedNeighbor.value.id)
    if (updated) selectedNeighbor.value = updated
  } catch (err) {
    errorMsg.value = err.message
  }
}

onMounted(fetchNeighbors)
</script>

<template>
  <div class="container">
    <header>
      <h1>ระบบบันทึกข้อมูลและเรื่องราวของเพื่อนบ้าน</h1>
    </header>

    <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

    <div class="main-grid">
      <!-- ฝั่งซ้าย: จัดการเพื่อนบ้าน -->
      <section class="panel">
        <h2>{{ isEditingNeighbor ? 'แก้ไขข้อมูลเพื่อนบ้าน' : 'เพิ่มเพื่อนบ้านใหม่' }}</h2>
        <form @submit.prevent="saveNeighbor" class="form">
          <input v-model="neighborForm.full_name" placeholder="ชื่อ-นามสกุล" required />
          <input v-model="neighborForm.house_number" placeholder="บ้านเลขที่" />
          <input v-model="neighborForm.phone" placeholder="เบอร์โทร" />
          <input v-model="neighborForm.family_members" type="number" placeholder="จำนวนสมาชิกในบ้าน" />
          <input v-model="neighborForm.occupation" placeholder="อาชีพ" />
          <select v-model="neighborForm.relationship_status">
            <option value="สนิท">สนิท</option>
            <option value="รู้จัก">รู้จัก</option>
            <option value="ไม่ค่อยรู้จัก">ไม่ค่อยรู้จัก</option>
          </select>
          <div class="form-actions">
            <button type="submit">{{ isEditingNeighbor ? 'บันทึกการแก้ไข' : 'เพิ่มเพื่อนบ้าน' }}</button>
            <button type="button" v-if="isEditingNeighbor" @click="resetNeighborForm">ยกเลิก</button>
          </div>
        </form>

        <h2>รายชื่อเพื่อนบ้าน</h2>
        <p v-if="loadingNeighbors">กำลังโหลด...</p>
        <ul class="neighbor-list">
          <li
            v-for="n in neighbors"
            :key="n.id"
            :class="{ active: selectedNeighbor?.id === n.id }"
            @click="selectNeighbor(n)"
          >
            <div>
              <strong>{{ n.full_name }}</strong>
              <span class="badge">{{ n.relationship_status }}</span>
              <div class="sub-info">บ้านเลขที่ {{ n.house_number || '-' }} · {{ n.stories?.length || 0 }} เรื่องราว</div>
            </div>
            <div class="row-actions">
              <button type="button" @click.stop="editNeighbor(n)">แก้ไข</button>
              <button type="button" @click.stop="deleteNeighbor(n.id)">ลบ</button>
            </div>
          </li>
          <li v-if="neighbors.length === 0" class="empty">ยังไม่มีข้อมูลเพื่อนบ้าน</li>
        </ul>
      </section>

      <!-- ฝั่งขวา: เรื่องราวของเพื่อนบ้านที่เลือก -->
      <section class="panel">
        <template v-if="selectedNeighbor">
          <h2>เรื่องราวของ {{ selectedNeighbor.full_name }}</h2>

          <form @submit.prevent="saveStory" class="form">
            <input v-model="storyForm.title" placeholder="หัวข้อเรื่อง" required />
            <textarea v-model="storyForm.content" placeholder="เนื้อหาเรื่องราว" rows="3"></textarea>
            <input v-model="storyForm.event_date" type="date" />
            <div class="form-actions">
              <button type="submit">{{ isEditingStory ? 'บันทึกการแก้ไข' : 'เพิ่มเรื่องราว' }}</button>
              <button type="button" v-if="isEditingStory" @click="resetStoryForm">ยกเลิก</button>
            </div>
          </form>

          <ul class="story-list">
            <li v-for="s in selectedNeighbor.stories" :key="s.id">
              <div class="story-header">
                <strong>{{ s.title }}</strong>
                <span class="story-date">{{ s.event_date || '' }}</span>
              </div>
              <p class="story-content">{{ s.content }}</p>
              <div class="row-actions">
                <button type="button" @click="editStory(s)">แก้ไข</button>
                <button type="button" @click="deleteStory(s.id)">ลบ</button>
              </div>
            </li>
            <li v-if="!selectedNeighbor.stories || selectedNeighbor.stories.length === 0" class="empty">
              ยังไม่มีเรื่องราวของเพื่อนบ้านคนนี้
            </li>
          </ul>
        </template>
        <template v-else>
          <p class="empty">เลือกเพื่อนบ้านทางซ้ายเพื่อดู/เพิ่มเรื่องราว</p>
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
  font-family: 'Sarabun', 'Segoe UI', sans-serif;
}
.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.panel {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
input, select, textarea {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
}
.form-actions {
  display: flex;
  gap: 8px;
}
button {
  padding: 6px 14px;
  border: none;
  border-radius: 4px;
  background-color: #2563eb;
  color: white;
  cursor: pointer;
}
button:hover {
  background-color: #1d4ed8;
}
.neighbor-list, .story-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.neighbor-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 6px;
  cursor: pointer;
}
.neighbor-list li.active {
  border-color: #2563eb;
  background-color: #eff6ff;
}
.badge {
  margin-left: 8px;
  font-size: 0.75rem;
  padding: 2px 6px;
  background-color: #f3f4f6;
  border-radius: 4px;
}
.sub-info {
  font-size: 0.8rem;
  color: #666;
}
.row-actions {
  display: flex;
  gap: 6px;
}
.story-list li {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 10px;
}
.story-header {
  display: flex;
  justify-content: space-between;
}
.story-date {
  color: #666;
  font-size: 0.85rem;
}
.story-content {
  color: #444;
  margin: 6px 0;
}
.empty {
  color: #888;
  font-style: italic;
}
.error {
  color: #dc2626;
  margin-bottom: 12px;
}
</style>