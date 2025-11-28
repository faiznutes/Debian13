<template>
  <div class="flex flex-col h-full p-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Active Sessions</h1>
      <p class="text-gray-600">Kelola sesi aktif Anda di berbagai perangkat</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Sessions List -->
    <div v-else class="space-y-4">
      <div v-if="sessions.length === 0" class="bg-white rounded-lg shadow-md p-12 text-center">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p class="text-gray-600">Tidak ada sesi aktif</p>
      </div>

      <div
        v-for="session in sessions"
        :key="session.id"
        class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <div
                :class="[
                  'w-12 h-12 rounded-full flex items-center justify-center',
                  session.isCurrent ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
                ]"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <h3 class="text-lg font-semibold text-gray-900">{{ session.deviceInfo || 'Unknown Device' }}</h3>
                  <span
                    v-if="session.isCurrent"
                    class="px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs font-semibold"
                  >
                    Current Session
                  </span>
                </div>
                <p class="text-sm text-gray-600 mt-1">{{ session.ipAddress || 'Unknown IP' }}</p>
              </div>
            </div>

            <div class="mt-4 space-y-2 text-sm text-gray-600">
              <div class="flex items-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Last active: {{ formatDate(session.lastActivityAt) }}</span>
              </div>
              <div class="flex items-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Created: {{ formatDate(session.createdAt) }}</span>
              </div>
            </div>
          </div>

          <div class="flex space-x-2 ml-4">
            <button
              v-if="!session.isCurrent"
              @click="revokeSession(session.id)"
              class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
            >
              Revoke
            </button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
        <div class="space-y-3">
          <button
            @click="revokeAllSessions"
            class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
          >
            Revoke All Other Sessions
          </button>
          <p class="text-xs text-gray-500">
            Ini akan mengakhiri semua sesi aktif kecuali sesi saat ini. Anda akan tetap login di perangkat ini.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../../api';

const loading = ref(true);
const sessions = ref<any[]>([]);

const loadSessions = async () => {
  try {
      const response = await api.get('/sessions');
      const sessionsData = response.data.sessions || [];
      
      // Mark current session (if we have sessionId from JWT or localStorage)
      const currentSessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId');
      sessions.value = sessionsData.map((session: any) => ({
        ...session,
        isCurrent: session.id === currentSessionId || (!currentSessionId && sessionsData.indexOf(session) === 0),
        lastActivityAt: session.lastActivity || session.lastActivityAt || session.createdAt,
      }));
  } catch (error: any) {
    console.error('Error loading sessions:', error);
  } finally {
    loading.value = false;
  }
};

const revokeSession = async (sessionId: string) => {
  if (!confirm('Apakah Anda yakin ingin mengakhiri sesi ini?')) {
    return;
  }

  try {
    await api.delete(`/sessions/${sessionId}`);
    await loadSessions();
    alert('Sesi berhasil diakhiri');
  } catch (error: any) {
    console.error('Error revoking session:', error);
    alert(error.response?.data?.message || 'Gagal mengakhiri sesi');
  }
};

const revokeAllSessions = async () => {
  if (!confirm('Apakah Anda yakin ingin mengakhiri semua sesi lainnya? Anda akan tetap login di perangkat ini.')) {
    return;
  }

  try {
    await api.post('/sessions/revoke-all');
    await loadSessions();
    alert('Semua sesi lainnya berhasil diakhiri');
  } catch (error: any) {
    console.error('Error revoking all sessions:', error);
    alert(error.response?.data?.message || 'Gagal mengakhiri sesi');
  }
};

const formatDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

onMounted(() => {
  loadSessions();
});
</script>

