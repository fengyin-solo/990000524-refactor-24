<template>
  <el-dialog
    :model-value="visible"
    title="Add New Card"
    width="480px"
    :close-on-click-modal="false"
    @update:model-value="handleDialogToggle"
    @open="resetForm()"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="Title" prop="title">
        <el-input v-model="form.title" placeholder="Enter card title" maxlength="100" show-word-limit />
      </el-form-item>

      <el-form-item label="Description" prop="description">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="Enter card description (optional)" maxlength="500" show-word-limit />
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
    </el-form>

    <template #footer>
      <el-button :disabled="submitting" @click="handleCancel">Cancel</el-button>
      <el-button type="primary" :loading="submitting" @click="handleAdd">Add Card</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { useBoardStore } from '../stores/board.js'
import { useCardForm } from '../composables/useCardForm.js'

const props = defineProps({
  visible: Boolean,
  columnId: { type: Number, default: null }
})

const emit = defineEmits(['update:visible', 'added'])

const boardStore = useBoardStore()
const { formRef, form, rules, submitting, resetForm, submitForm } = useCardForm()

// Ignore close requests (Cancel/X/Esc) while a submission is in flight,
// so cancelling can't leave a half-created card behind.
function handleDialogToggle(value) {
  if (submitting.value) return
  emit('update:visible', value)
}

function handleCancel() {
  resetForm()
  emit('update:visible', false)
}

async function handleAdd() {
  const added = await submitForm(
    payload => boardStore.addCard(props.columnId, payload),
    { successMessage: 'Card added!', errorMessage: 'Failed to add card' }
  )
  if (added) {
    emit('update:visible', false)
    emit('added')
  }
}
</script>
