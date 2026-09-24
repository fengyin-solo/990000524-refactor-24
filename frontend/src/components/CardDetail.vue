<template>
  <el-dialog
    :model-value="visible"
    title="Card Details"
    width="540px"
    :close-on-click-modal="false"
    @update:model-value="handleDialogToggle"
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
      <el-button :disabled="submitting" @click="handleCancel">Cancel</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSave">Save Changes</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useBoardStore } from '../stores/board.js'
import { useCardForm } from '../composables/useCardForm.js'

const props = defineProps({
  visible: Boolean,
  card: { type: Object, default: null },
  allColumns: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:visible', 'updated', 'move'])

const boardStore = useBoardStore()
const moveTarget = ref(null)

const { formRef, form, rules, submitting, resetForm, submitForm } = useCardForm()

function initForm() {
  resetForm({
    title: props.card?.title || '',
    description: props.card?.description || '',
    priority: props.card?.priority || 'medium',
    due_date: props.card?.due_date || ''
  })
  moveTarget.value = null
}

// Ignore close requests (Cancel/X/Esc) while a submission is in flight,
// so cancelling can't leave a half-saved card behind.
function handleDialogToggle(value) {
  if (submitting.value) return
  emit('update:visible', value)
}

function handleCancel() {
  initForm()
  emit('update:visible', false)
}

async function handleSave() {
  const willMove = moveTarget.value && moveTarget.value !== props.card.column_id
  const updated = await submitForm(
    async payload => {
      const card = await boardStore.updateCard(props.card.id, payload)
      // Move is part of the same submit: only report success once both are done
      if (willMove) {
        await boardStore.moveCard(props.card.id, moveTarget.value, 0)
      }
      return card
    },
    {
      successMessage: willMove ? 'Card updated and moved' : 'Card updated',
      errorMessage: 'Failed to update card'
    }
  )
  if (updated) {
    emit('updated', updated)
    emit('update:visible', false)
  }
}
</script>
