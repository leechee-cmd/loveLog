<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLogStore } from '../../stores/logStore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'vue-chartjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const logStore = useLogStore();
const { t, locale } = useI18n();

const props = defineProps<{
  type: 'trend' | 'tags'
}>();

// Trend Data (Line Chart)
const trendData = computed(() => {
  const stats = logStore.monthlyStats;
  const labels = Object.keys(stats).map(k => {
     const parts = k.split('-');
     if (parts.length < 2) return k;
     const y = parseInt(parts[0]!);
     const m = parseInt(parts[1]!);
     const date = new Date(y, m-1);
     return date.toLocaleDateString(locale.value, { month: 'short' });
  });
  const data = Object.values(stats);

  return {
    labels,
    datasets: [
      {
        label: t('stats.frequency'),
        backgroundColor: (ctx: any) => {
          const canvas = ctx.chart.ctx;
          const gradient = canvas.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(244, 63, 94, 0.5)');
          gradient.addColorStop(1, 'rgba(244, 63, 94, 0.0)');
          return gradient;
        },
        borderColor: '#f43f5e',
        pointBackgroundColor: '#f43f5e',
        borderWidth: 3,
        pointRadius: 4,
        fill: true,
        tension: 0.4,
        data
      }
    ]
  };
});

const trendOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { 
       backgroundColor: '#171717',
       titleColor: '#fff',
       bodyPadding: 10,
       cornerRadius: 8,
       displayColors: false
    }
  },
  scales: {
    x: { 
       grid: { display: false },
       ticks: { color: '#a3a3a3' }
    },
    y: { 
       display: false,
       min: 0,
       // Add some padding
       suggestedMax: Math.max(...Object.values(logStore.monthlyStats)) + 2
    }
  }
};

// Tags Data (Doughnut)
const tagsData = computed(() => {
  const stats = logStore.tagStats;
  const labels = Object.keys(stats);
  const data = Object.values(stats);
  
  // Custom palette
  const colors = [
     '#f43f5e', // Rose
     '#f59e0b', // Amber
     '#8b5cf6', // Violet
     '#0ea5e9', // Sky
     '#10b981', // Emerald
     '#ec4899', // Pink
  ];

  return {
    labels,
    datasets: [
      {
        backgroundColor: colors,
        borderWidth: 0,
        data
      }
    ]
  };
});

const tagsOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      position: 'right' as const,
      labels: {
        usePointStyle: true,
        font: { family: 'Outfit', size: 12 }
      }
    }
  },
  cutout: '70%',
};
</script>

<template>
  <div class="w-full h-full">
    <Line v-if="type === 'trend'" :data="trendData" :options="trendOptions" />
    <Doughnut v-else-if="type === 'tags'" :data="tagsData" :options="tagsOptions" />
  </div>
</template>
