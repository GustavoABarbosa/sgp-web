<script setup lang="ts">
import type { StudentExam } from '@/types'
import { studentApi } from '@/api/student'
import { formatDate } from '@/shared/utils'
import { useResource } from '@/shared/useResource'
import BaseCard from '@/components/BaseCard.vue'
import BaseButton from '@/components/BaseButton.vue'
import DataTable, { type Column } from '@/components/DataTable.vue'
import LoadingState from '@/components/LoadingState.vue'
import PageHeader from '@/components/PageHeader.vue'

const { data: exams, isLoading, error } = useResource(studentApi.exams)

const columns: Column[] = [
  { key: 'examTitle', label: 'Prova', class: 'min-w-40' },
  { key: 'className', label: 'Turma', class: 'min-w-40' },
  { key: 'subject', label: 'Disciplina', class: 'min-w-36' },
  { key: 'term', label: 'Período', align: 'center' },
  { key: 'appliedAt', label: 'Data', align: 'center' },
  { key: 'actions', label: 'Ações', hideLabel: true, align: 'right' },
]
</script>

<template>
  <div>
    <PageHeader :items="[{ label: 'Minhas provas' }]" />
    <LoadingState :loading="isLoading && !exams" :message="error" />
    <BaseCard v-if="exams">
      <DataTable
        :columns="columns"
        :rows="exams"
        :row-key="(e: StudentExam) => e.applicationId"
        empty="Nenhuma prova atribuída"
      >
        <template #cell-appliedAt="{ row }">{{ formatDate(row.appliedAt) }}</template>
        <template #cell-actions="{ row }">
          <BaseButton
            v-if="row.hasGrade"
            variant="secondary"
            size="sm"
            icon="ph:eye"
            :to="`/aluno/grades/${row.applicationId}`"
          />
          <span v-else class="text-xs text-muted">Aguardando correção</span>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
