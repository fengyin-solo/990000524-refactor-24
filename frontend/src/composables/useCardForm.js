import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

// Shared validation for both create and edit: the title is required.
export const cardFormRules = {
  title: [{ required: true, message: 'Card title is required', trigger: 'blur' }]
}

function emptyCardForm() {
  return {
    title: '',
    description: '',
    priority: 'medium',
    due_date: ''
  }
}

/**
 * Shared card form state and submit flow used by both the add-card and
 * edit-card dialogs to keep validation, feedback and cancellation consistent.
 */
export function useCardForm() {
  const formRef = ref(null)
  const form = ref(emptyCardForm())
  const submitting = ref(false)

  // Reset fields (optionally seeded from an existing card) and clear any
  // leftover validation errors, so a cancelled attempt leaves no trace.
  function resetForm(values = {}) {
    form.value = { ...emptyCardForm(), ...values }
    // nextTick: the dialog content may not be mounted yet on first open
    nextTick(() => formRef.value?.clearValidate())
  }

  function toPayload() {
    return {
      title: form.value.title,
      description: form.value.description,
      priority: form.value.priority,
      due_date: form.value.due_date || null
    }
  }

  /**
   * Shared submit flow: block re-entry -> validate -> run action -> feedback.
   * Resolves to the action result on success, false when validation fails or
   * the action throws (the dialog then stays open with the form intact).
   */
  async function submitForm(action, { successMessage, errorMessage } = {}) {
    if (submitting.value) return false
    submitting.value = true
    try {
      if (!formRef.value) return false
      const valid = await formRef.value.validate().catch(() => false)
      if (!valid) return false

      const result = await action(toPayload())
      if (successMessage) ElMessage.success(successMessage)
      return result ?? true
    } catch (err) {
      ElMessage.error(err?.response?.data?.error || errorMessage || 'Operation failed')
      return false
    } finally {
      submitting.value = false
    }
  }

  return { formRef, form, rules: cardFormRules, submitting, resetForm, submitForm }
}
