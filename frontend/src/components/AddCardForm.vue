<template>
  <el-dialog
    :model-value="visible"
    title="Add New Card"
    width="480px"
    :close-on-click-modal="false"
    @update:model-value="handleVisibleChange"
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
      <el-button :disabled="submitting" @click="requestClose">Cancel</el-button>
      <el-button type="primary" :loading="submitting" @click="handleAdd">Add Card</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useBoardStore } from '../stores/board.js'
import { useCardForm } from '../composables/useCardForm.js'

const props = defineProps({
  visible: Boolean,
  columnId: { type: Number, default: null }
})

const emit = defineEmits(['update:visible', 'added'])

const boardStore = useBoardStore()
const formRef = ref(null)

const {
  form,
  rules,
  submitting,
  resetForm,
  submitCardForm,
  canRequestClose
} = useCardForm(formRef)

function requestClose() {
  if (!submitting.value) emit('update:visible', false)
}

function handleVisibleChange(value) {
  if (canRequestClose(value)) emit('update:visible', value)
}

async function handleAdd() {
  const created = await submitCardForm({
    submit: (values) =>
      boardStore.addCard(props.columnId, {
        title: values.title,
        description: values.description,
        priority: values.priority,
        due_date: values.due_date || null
      }),
    successMessage: 'Card added!',
    errorMessage: 'Failed to add card'
  })
  if (!created) return

  // Only close after the card exists in the store; a failed or cancelled
  // request never leaves a half card behind.
  emit('update:visible', false)
  emit('added')
}
</script>
