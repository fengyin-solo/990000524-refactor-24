<template>
  <el-dialog
    :model-value="visible"
    title="Card Details"
    width="540px"
    :close-on-click-modal="false"
    @update:model-value="handleVisibleChange"
    @open="initForm"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="Title" prop="title">
        <el-input v-model="form.title" placeholder="Card title" maxlength="100" show-word-limit />
      </el-form-item>

      <el-form-item label="Description" prop="description">
        <el-input v-model="form.description" type="textarea" :rows="4" placeholder="Card description" maxlength="500" show-word-limit />
      </el-form-item>

      <div style="display: flex; gap: 16px;">
        <el-form-item label="Priority" prop="priority" style="flex: 1;">
          <el-select v-model="form.priority" style="width: 100%;">
            <el-option label="Low" value="low" />
            <el-option label="Medium" value="medium" />
            <el-option label="High" value="high" />
          </el-select>
        </el-form-item>

        <el-form-item label="Due Date" prop="due_date" style="flex: 1;">
          <el-date-picker
            v-model="form.due_date"
            type="date"
            placeholder="Select date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          />
        </el-form-item>
      </div>

      <el-form-item v-if="allColumns.length > 1" label="Move to Column">
        <el-select v-model="moveTarget" placeholder="Select column (optional)" clearable style="width: 100%;">
          <el-option
            v-for="col in allColumns"
            :key="col.id"
            :label="col.name"
            :value="col.id"
            :disabled="col.id === card?.column_id"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="submitting" @click="requestClose">Cancel</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">Save Changes</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useBoardStore } from '../stores/board.js'
import { useCardForm } from '../composables/useCardForm.js'

const props = defineProps({
  visible: Boolean,
  card: { type: Object, default: null },
  allColumns: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:visible', 'updated', 'move'])

const boardStore = useBoardStore()
const formRef = ref(null)
const moveTarget = ref(null)

const {
  form,
  rules,
  submitting: saving,
  resetForm,
  submitCardForm,
  canRequestClose
} = useCardForm(formRef)

function initForm() {
  if (!props.card) return
  resetForm({
    title: props.card.title || '',
    description: props.card.description || '',
    priority: props.card.priority || 'medium',
    due_date: props.card.due_date || ''
  })
  moveTarget.value = null
}

function requestClose() {
  if (!saving.value) emit('update:visible', false)
}

function handleVisibleChange(value) {
  if (canRequestClose(value)) emit('update:visible', value)
}

async function handleSave() {
  const cardId = props.card.id
  const shouldMove = !!moveTarget.value && moveTarget.value !== props.card.column_id

  const updated = await submitCardForm({
    // Update and move run inside the same shared submit: either both are
    // reported as success, or the whole save fails and the dialog stays
    // open with the single shared error feedback.
    submit: async (values) => {
      const result = await boardStore.updateCard(cardId, {
        title: values.title,
        description: values.description,
        priority: values.priority,
        due_date: values.due_date || null
      })
      if (shouldMove) {
        await boardStore.moveCard(cardId, moveTarget.value, 0)
      }
      return result
    },
    successMessage: 'Card updated',
    errorMessage: 'Failed to update card'
  })
  if (!updated) return

  emit('updated', updated)
  if (shouldMove) ElMessage.success('Card moved')
  emit('update:visible', false)
}
</script>
