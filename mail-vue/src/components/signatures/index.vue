<template>
  <div class="signatures">
    <div class="header">
      <div>
        <div class="title">{{ $t('signatures') }}</div>
        <div class="desc">{{ $t('signaturesDesc') }}</div>
      </div>
      <el-button type="primary" @click="startCreate(false)">+ {{ $t('newSignature') }}</el-button>
    </div>

    <el-table :data="signatureStore.personal" empty-text="" style="width: 100%">
      <el-table-column prop="name" :label="$t('signatureName')" min-width="140" />
      <el-table-column :label="$t('signatureContent')" min-width="220">
        <template #default="{row}">
          <div class="content-preview" v-html="row.content || '&nbsp;'"></div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('signatureDefault')" width="100">
        <template #default="{row}">
          <el-switch :model-value="!!row.isDefault" @change="(v) => onSetDefault(row, v)" />
        </template>
      </el-table-column>
      <el-table-column width="160" align="right">
        <template #default="{row}">
          <el-button size="small" @click="startEdit(row)">{{ $t('change') }}</el-button>
          <el-button size="small" type="danger" @click="confirmDelete(row)">{{ $t('delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="!signatureStore.personal.length" class="empty">{{ $t('signatureEmpty') }}</div>

    <div class="header company-header" v-if="signatureStore.company.length || isAdmin">
      <div>
        <div class="title">{{ $t('companySignatures') }}</div>
      </div>
      <el-button v-if="isAdmin" type="primary" @click="startCreate(true)">+ {{ $t('newCompanySignature') }}</el-button>
    </div>
    <el-table v-if="signatureStore.company.length" :data="signatureStore.company" empty-text="" style="width: 100%">
      <el-table-column prop="name" :label="$t('signatureName')" min-width="140" />
      <el-table-column :label="$t('signatureContent')" min-width="220">
        <template #default="{row}">
          <div class="content-preview" v-html="row.content || '&nbsp;'"></div>
        </template>
      </el-table-column>
      <el-table-column width="160" align="right">
        <template #default="{row}">
          <template v-if="row.editable">
            <el-button size="small" @click="startEdit(row)">{{ $t('change') }}</el-button>
            <el-button size="small" type="danger" @click="confirmDelete(row)">{{ $t('delete') }}</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
        v-model="dialogVisible"
        :title="form.sigId ? $t('editSignature') : (form.isCompany ? $t('newCompanySignature') : $t('newSignature'))"
        width="560px"
        append-to-body
        top="12vh"
        :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item :label="$t('signatureName')">
          <el-input v-model="form.name" maxlength="64" />
        </el-form-item>
        <el-form-item :label="$t('signatureContent')">
          <el-input
              v-model="form.content"
              type="textarea"
              :autosize="{minRows: 6, maxRows: 16}"
              :placeholder="'<p>Best,<br>John Doe</p>'"
          />
        </el-form-item>
        <el-form-item v-if="!form.isCompany">
          <el-checkbox v-model="form.isDefault">{{ $t('signatureSetDefault') }}</el-checkbox>
        </el-form-item>
        <el-form-item v-if="form.content">
          <div class="preview-label">{{ $t('details') || 'Preview' }}</div>
          <div class="content-preview preview-box" v-html="form.content"></div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">{{ $t('save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {computed, onMounted, reactive, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {ElMessage, ElMessageBox} from 'element-plus';
import {useSignatureStore} from '@/store/signature.js';
import {useUserStore} from '@/store/user.js';

const {t} = useI18n();
const signatureStore = useSignatureStore();
const userStore = useUserStore();

const isAdmin = computed(() => userStore.user?.type === 0);

const dialogVisible = ref(false);
const submitting = ref(false);
const form = reactive(emptyForm());

function emptyForm() {
  return {sigId: null, name: '', content: '', isDefault: false, isCompany: false};
}

function startCreate(isCompany) {
  Object.assign(form, emptyForm(), {isCompany: !!isCompany});
  dialogVisible.value = true;
}

function startEdit(row) {
  Object.assign(form, {
    sigId: row.sigId,
    name: row.name,
    content: row.content || '',
    isDefault: !!row.isDefault,
    isCompany: !!row.isCompany
  });
  dialogVisible.value = true;
}

async function submit() {
  if (!form.name.trim()) {
    ElMessage.warning(t('signatureName'));
    return;
  }
  submitting.value = true;
  try {
    if (form.sigId) {
      const payload = {
        sigId: form.sigId,
        name: form.name.trim(),
        content: form.content || ''
      };
      if (!form.isCompany) payload.isDefault = form.isDefault ? 1 : 0;
      await signatureStore.update(payload);
    } else if (form.isCompany) {
      await signatureStore.addCompany({
        name: form.name.trim(),
        content: form.content || ''
      });
    } else {
      await signatureStore.add({
        name: form.name.trim(),
        content: form.content || '',
        isDefault: form.isDefault ? 1 : 0
      });
    }
    dialogVisible.value = false;
  } finally {
    submitting.value = false;
  }
}

async function onSetDefault(row, v) {
  await signatureStore.setDefault(v ? row.sigId : 0);
}

async function confirmDelete(row) {
  try {
    await ElMessageBox.confirm(t('signatureDeleteConfirm'), {
      confirmButtonText: t('confirm'),
      cancelButtonText: t('cancel'),
      type: 'warning'
    });
    await signatureStore.remove(row.sigId);
  } catch (_) {}
}

onMounted(() => {
  signatureStore.fetch(true);
});
</script>

<style scoped lang="scss">
.signatures {
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    .title {
      font-size: 16px;
      font-weight: 600;
    }
    .desc {
      font-size: 12px;
      color: var(--el-text-color-regular);
      margin-top: 4px;
    }
  }
  .company-header {
    margin-top: 24px;
  }
  .empty {
    text-align: center;
    color: #999;
    padding: 18px 0;
  }
  .content-preview {
    max-height: 60px;
    overflow: hidden;
    color: var(--el-text-color-regular);
    font-size: 13px;
  }
  .preview-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
  }
  .preview-box {
    border: 1px dashed var(--el-border-color);
    padding: 10px;
    border-radius: 6px;
    max-height: 160px;
    overflow: auto;
  }
}
</style>
