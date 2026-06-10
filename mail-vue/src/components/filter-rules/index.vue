<template>
  <div class="filter-rules">
    <div class="header">
      <div>
        <div class="title">{{ $t('filterRules') }}</div>
        <div class="desc">{{ $t('filterRulesDesc') }}</div>
      </div>
      <el-button type="primary" @click="startCreate">+ {{ $t('newFilter') }}</el-button>
    </div>

    <el-table :data="filterStore.rules" empty-text="" style="width: 100%">
      <el-table-column prop="name" :label="$t('filterName')" min-width="120" />
      <el-table-column :label="$t('filterField')" width="110">
        <template #default="{row}">{{ $t('filterField' + capitalize(row.field)) }}</template>
      </el-table-column>
      <el-table-column :label="$t('filterOperator')" width="120">
        <template #default="{row}">{{ $t('filterOp' + capitalize(row.operator)) }}</template>
      </el-table-column>
      <el-table-column prop="value" :label="$t('filterValue')" min-width="140" show-overflow-tooltip />
      <el-table-column :label="$t('filterAction')" min-width="180">
        <template #default="{row}">
          <span v-for="(at, i) in actionTypeList(row.actionType)" :key="at">
            <el-tag size="small" :type="at === 'archive' ? 'warning' : 'primary'" style="margin-right:4px">
              {{ at === 'archive' ? $t('filterActionArchive') : $t('filterActionLabel') }}
            </el-tag>
            <span v-if="at === 'label' && row.actionValue">: {{ labelNames(row.actionValue) }}</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('filterEnabled')" width="90">
        <template #default="{row}">
          <el-switch :model-value="!!row.enabled" @change="(v) => toggleEnabled(row, v)" />
        </template>
      </el-table-column>
      <el-table-column width="150" align="right">
        <template #default="{row}">
          <el-button size="small" @click="startEdit(row)">{{ $t('change') }}</el-button>
          <el-button size="small" type="danger" @click="confirmDelete(row)">{{ $t('delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="!filterStore.rules.length" class="empty">{{ $t('filterEmpty') }}</div>

    <el-dialog
        v-model="dialogVisible"
        :title="form.filterRuleId ? $t('editFilter') : $t('newFilter')"
        width="520px"
        append-to-body
        top="12vh"
        :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item :label="$t('filterName')">
          <el-input v-model="form.name" maxlength="64" />
        </el-form-item>
        <el-form-item :label="$t('filterField')">
          <el-select v-model="form.field" style="width: 100%">
            <el-option value="from" :label="$t('filterFieldFrom')" />
            <el-option value="to" :label="$t('filterFieldTo')" />
            <el-option value="subject" :label="$t('filterFieldSubject')" />
            <el-option value="content" :label="$t('filterFieldContent')" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('filterOperator')">
          <el-select v-model="form.operator" style="width: 100%">
            <el-option value="contains" :label="$t('filterOpContains')" />
            <el-option value="equals" :label="$t('filterOpEquals')" />
            <el-option value="startsWith" :label="$t('filterOpStartsWith')" />
            <el-option value="endsWith" :label="$t('filterOpEndsWith')" />
            <el-option value="regex" :label="$t('filterOpRegex')" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('filterValue')">
          <el-input v-model="form.value" maxlength="256" />
        </el-form-item>
        <el-form-item :label="$t('filterAction')">
          <el-checkbox-group v-model="form.actionTypes">
            <el-checkbox value="label" :label="$t('filterActionLabel')" />
            <el-checkbox value="archive" :label="$t('filterActionArchive')" />
          </el-checkbox-group>
        </el-form-item>
        <el-form-item v-if="form.actionTypes.includes('label')" :label="$t('filterLabels')">
          <el-select v-model="form.labelIds" multiple filterable style="width: 100%">
            <el-option
                v-for="lab in labelStore.labels"
                :key="lab.labelId"
                :label="lab.name"
                :value="lab.labelId"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="form.enabled">{{ $t('filterEnabled') }}</el-checkbox>
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
import {onMounted, reactive, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {ElMessage, ElMessageBox} from 'element-plus';
import {useFilterStore} from '@/store/filter.js';
import {useLabelStore} from '@/store/label.js';

const {t} = useI18n();
const filterStore = useFilterStore();
const labelStore = useLabelStore();

const dialogVisible = ref(false);
const submitting = ref(false);
const form = reactive(emptyForm());

function emptyForm() {
  return {
    filterRuleId: null,
    name: '',
    field: 'from',
    operator: 'contains',
    value: '',
    actionTypes: ['label'],
    labelIds: [],
    enabled: true
  };
}

function actionTypeList(actionType) {
  return (actionType || 'label').split(',').filter(Boolean);
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function labelNames(actionValue) {
  if (!actionValue) return '';
  const ids = String(actionValue).split(',').map(x => Number(x)).filter(Boolean);
  return ids.map(id => labelStore.findById(id)?.name || `#${id}`).join(', ');
}

function startCreate() {
  Object.assign(form, emptyForm());
  dialogVisible.value = true;
}

function startEdit(row) {
  Object.assign(form, {
    filterRuleId: row.filterRuleId,
    name: row.name,
    field: row.field,
    operator: row.operator,
    value: row.value,
    actionTypes: actionTypeList(row.actionType),
    labelIds: row.actionType.includes('label') && row.actionValue
        ? row.actionValue.split(',').map(Number).filter(Boolean)
        : [],
    enabled: !!row.enabled
  });
  dialogVisible.value = true;
}

async function submit() {
  if (!form.name.trim()) {
    ElMessage.warning(t('filterName'));
    return;
  }
  if (!form.value) {
    ElMessage.warning(t('filterValue'));
    return;
  }
  if (form.actionTypes.includes('label') && form.labelIds.length === 0) {
    ElMessage.warning(t('filterLabels'));
    return;
  }
  submitting.value = true;
  try {
    const payload = {
      name: form.name.trim(),
      field: form.field,
      operator: form.operator,
      value: form.value,
      actionType: form.actionTypes.join(','),
      actionValue: form.actionTypes.includes('label') ? form.labelIds.join(',') : '',
      enabled: form.enabled ? 1 : 0
    };
    if (form.filterRuleId) {
      payload.filterRuleId = form.filterRuleId;
      await filterStore.update(payload);
    } else {
      await filterStore.add(payload);
    }
    dialogVisible.value = false;
  } finally {
    submitting.value = false;
  }
}

async function toggleEnabled(row, v) {
  await filterStore.toggleEnabled(row.filterRuleId, v);
}

async function confirmDelete(row) {
  try {
    await ElMessageBox.confirm(t('filterDeleteConfirm'), {
      confirmButtonText: t('confirm'),
      cancelButtonText: t('cancel'),
      type: 'warning'
    });
    await filterStore.remove(row.filterRuleId);
  } catch (_) {}
}

onMounted(() => {
  filterStore.fetch(true);
  labelStore.fetch(true);
});

function openCreate(email) {
  Object.assign(form, emptyForm());
  if (email) {
    const addr = email.sendEmail || email.from || email.toEmail || '';
    if (addr) {
      form.field = email.sendEmail ? 'from' : 'from';
      form.value = addr;
    }
  }
  dialogVisible.value = true;
}

defineExpose({ openCreate });
</script>

<style scoped lang="scss">
.filter-rules {
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
  .empty {
    text-align: center;
    color: #999;
    padding: 18px 0;
  }
}
</style>
