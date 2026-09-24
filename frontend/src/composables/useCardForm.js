import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

// Single source of truth for the card create/edit dialogs.
// Both AddCardForm (create) and CardDetail (edit) share this flow so that
// validation, submit locking, close handling and error feedback cannot
// drift apart.

export function createEmptyCardForm() {
  return {
    title: '',
    description: '',
    priority: 'medium',
    due_date: ''
  }
}

// Title stays required; keep the rule in one place.
export const cardFormRules = {
  title: [{ required: true, message: 'Title is required', trigger: 'blur' }]
}

export function useCardForm(formRef) {
  const form = ref(createEmptyCardForm())
  // A single in-flight flag doubles as the button loading state and the
  // re-entry guard, so create/edit can never fire two requests from
  // repeated clicks.
  const submitting = ref(false)

  function resetForm(values) {
    form.value = values
      ? { ...createEmptyCardForm(), ...values }
      : createEmptyCardForm()
    // Drop validation messages left over from a previous submit.
    nextTick(() => formRef.value?.clearValidate?.())
  }

  /**
   * Shared submit pipeline:
   * 1. reject re-entry while a request is in flight
   * 2. run the same validation for create and edit
   * 3. invoke `submit` exactly once
   * 4. surface one consistent failure result (server error or fallback)
   *
   * Resolves to the submitter's result on success, false on validation
   * failure or request failure (caller keeps the dialog open on false).
   */
  async function submitCardForm({ submit, successMessage, errorMessage }) {
    if (submitting.value) return false
    if (!formRef.value) return false

    // Claim the in-flight slot synchronously, before the async validate()
    // resolves, so a second click (before the button's loading state even
    // paints) cannot slip a duplicate request through.
    submitting.value = true
    try {
      await formRef.value.validate()
    } catch {
      submitting.value = false
      return false
    }

    let result
    try {
      result = await submit(form.value)
    } catch (err) {
      ElMessage.error(err?.response?.data?.error || errorMessage)
      return false
    } finally {
      submitting.value = false
    }

    ElMessage.success(successMessage)
    return result === undefined ? true : result
  }

  // Close gate shared by every close path (Cancel button, X, ESC).
  // While a request is in flight the dialog must not close, otherwise an
  // in-flight create/update could land in the store after it is gone and
  // leave a half card behind.
  function canRequestClose(value) {
    if (!value && submitting.value) return false
    return true
  }

  return {
    form,
    rules: cardFormRules,
    submitting,
    resetForm,
    submitCardForm,
    canRequestClose
  }
}
