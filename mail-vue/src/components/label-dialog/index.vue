<template>
  <el-dialog
      v-model="visible"
      :title="dialogTitle"
      :width="dialogWidth"
      top="15vh"
      append-to-body
      :z-index="3000"
      :close-on-click-modal="false"
      destroy-on-close
  >
    <div v-if="mode === 'list'" class="label-list">
      <div v-if="!labelStore.labels.length" class="empty">{{ $t('labelEmpty') }}</div>
      <div
          v-for="lab in labelStore.labels"
          :key="lab.labelId"
          class="label-row"
          :style="{ paddingLeft: (4 + (lab.depth || 0) * 20) + 'px' }"
      >
        <span class="dot" :style="{ background: lab.color }"></span>
        <span class="name" @click="startEdit(lab)">{{ lab.name }}</span>
        <div class="actions">
          <Icon class="icon" icon="ep:edit" width="16" height="16" @click="startEdit(lab)" />
          <Icon class="icon" icon="uiw:delete" width="14" height="14" @click="confirmDelete(lab)" />
        </div>
      </div>
      <el-button type="primary" plain class="add-btn" @click="startCreate">+ {{ $t('newLabel') }}</el-button>
    </div>

    <div v-else-if="mode === 'attach'" class="label-list">
      <div v-if="!labelStore.labels.length" class="empty">{{ $t('labelEmpty') }}</div>
      <div
          v-for="lab in labelStore.labels"
          :key="lab.labelId"
          class="label-row attach-row"
          :style="{ paddingLeft: (4 + (lab.depth || 0) * 20) + 'px' }"
          @click="toggleAttach(lab.labelId)"
      >
        <el-checkbox :model-value="attachSelected.includes(lab.labelId)" @click.stop="toggleAttach(lab.labelId)" />
        <span class="dot" :style="{ background: lab.color }"></span>
        <span class="name">{{ lab.name }}</span>
      </div>
      <el-button class="add-btn" @click="openNestedCreate" plain>+ {{ $t('newLabel') }}</el-button>
      <div class="form-actions">
        <el-button @click="visible = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" @click="submitAttach" :loading="submitting" :disabled="!attachSelected.length">{{ $t('confirm') }}</el-button>
      </div>
    </div>

    <div v-else class="label-form">
      <el-form label-position="top">
        <el-form-item :label="$t('labelName')">
          <el-input v-model="form.name" maxlength="32" show-word-limit />
        </el-form-item>
        <el-form-item :label="$t('labelColor')">
          <div class="color-row">
            <span
                class="swatch"
                v-for="c in swatches"
                :key="c"
                :style="{ background: c, outline: form.color === c ? '2px solid #1890ff' : 'none' }"
                @click="form.color = c"
            ></span>
            <el-color-picker v-model="form.color" teleported popper-class="label-dialog-popper" />
          </div>
        </el-form-item>
        <el-form-item :label="$t('labelParent')">
          <el-select v-model="form.parentId" teleported popper-class="label-dialog-popper" :placeholder="$t('labelParentNone')" clearable style="width: 100%">
            <el-option :label="$t('labelParentNone')" :value="0" />
            <el-option
                v-for="opt in parentOptions"
                :key="opt.labelId"
                :label="indentName(opt)"
                :value="opt.labelId"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="form-actions">
        <el-button @click="mode = 'list'">{{ $t('cancel') }}</el-button>
        <el-button type="primary" @click="submit" :loading="submitting">{{ $t('save') }}</el-button>
      </div>
    </div>
  </el-dialog>

  <!-- Nested create-label dialog (二次弹窗) -->
  <el-dialog
      v-model="nestedVisible"
      :title="$t('newLabel')"
      :width="dialogWidth"
      top="22vh"
      append-to-body
      :z-index="4000"
      :close-on-click-modal="false"
      destroy-on-close
  >
    <div class="label-form">
      <el-form label-position="top">
        <el-form-item :label="$t('labelName')">
          <el-input v-model="nestedForm.name" maxlength="32" show-word-limit />
        </el-form-item>
        <el-form-item :label="$t('labelColor')">
          <div class="color-row">
            <span
                class="swatch"
                v-for="c in swatches"
                :key="c"
                :style="{ background: c, outline: nestedForm.color === c ? '2px solid #1890ff' : 'none' }"
                @click="nestedForm.color = c"
            ></span>
            <el-color-picker v-model="nestedForm.color" teleported popper-class="label-dialog-popper" />
          </div>
        </el-form-item>
        <el-form-item :label="$t('labelParent')">
          <el-select v-model="nestedForm.parentId" teleported popper-class="label-dialog-popper" :placeholder="$t('labelParentNone')" clearable style="width: 100%">
            <el-option :label="$t('labelParentNone')" :value="0" />
            <el-option
                v-for="opt in parentOptions"
                :key="opt.labelId"
                :label="indentName(opt)"
                :value="opt.labelId"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="form-actions">
        <el-button @click="nestedVisible = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" @click="submitNestedCreate" :loading="nestingSubmitting">{{ $t('save') }}</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import {ref, computed, onMounted, onUnmounted} from 'vue';
import {Icon} from '@iconify/vue';
import {useI18n} from 'vue-i18n';
import {ElMessage, ElMessageBox} from 'element-plus';
import {useLabelStore} from '@/store/label.js';
import router from '@/router/index.js';

const {t} = useI18n();
const labelStore = useLabelStore();
const visible = ref(false);
const mode = ref('list');
const submitting = ref(false);
const form = ref({labelId: null, name: '', color: '#1890ff', parentId: 0});

const attachEmailIds = ref([]);
const attachSelected = ref([]);
const attachOnDone = ref(null);

// Nested create dialog state
const nestedVisible = ref(false);
const nestedForm = ref({name: '', color: '#1890ff', parentId: 0});
const nestingSubmitting = ref(false);

const swatches = ['#1890ff', '#13c2c2', '#52c41a', '#faad14', '#fa541c', '#f5222d', '#722ed1', '#eb2f96'];

const winWidth = ref(window.innerWidth);
function onResize() { winWidth.value = window.innerWidth; }
onMounted(() => window.addEventListener('resize', onResize));
onUnmounted(() => window.removeEventListener('resize', onResize));

const dialogWidth = computed(() => winWidth.value < 768 ? '92%' : '460px');

const dialogTitle = computed(() => {
  if (mode.value === 'create') return t('newLabel');
  if (mode.value === 'edit') return t('editLabel');
  if (mode.value === 'attach') return t('labelAttachTitle');
  return t('labels');
});

const parentOptions = computed(() => {
  const editingId = form.value.labelId;
  if (!editingId) return labelStore.labels;
  const blocked = new Set([editingId]);
  let added = true;
  while (added) {
    added = false;
    labelStore.labels.forEach(l => {
      if (!blocked.has(l.labelId) && blocked.has(l.parentId)) {
        blocked.add(l.labelId);
        added = true;
      }
    });
  }
  return labelStore.labels.filter(l => !blocked.has(l.labelId));
});

function indentName(lab) {
  return '— '.repeat(lab.depth || 0) + lab.name;
}

function open(initialMode = 'list', options = {}) {
  mode.value = initialMode;
  if (initialMode === 'create') {
    form.value = {labelId: null, name: '', color: '#1890ff', parentId: options.parentId || 0};
  }
  if (initialMode === 'edit') {
    const lab = options.label || options;
    if (lab && lab.labelId) {
      form.value = {
        labelId: lab.labelId,
        name: lab.name,
        color: lab.color || '#1890ff',
        parentId: lab.parentId || 0
      };
    }
  }
  if (initialMode === 'attach') {
    attachEmailIds.value = options.emailIds || [];
    attachSelected.value = options.preselectedLabelIds ? [...options.preselectedLabelIds] : [];
    attachOnDone.value = options.onDone || null;
  }
  labelStore.fetch(true);
  visible.value = true;
}

function startCreate() {
  form.value = {labelId: null, name: '', color: '#1890ff', parentId: 0};
  mode.value = 'create';
}

function startEdit(lab) {
  form.value = {labelId: lab.labelId, name: lab.name, color: lab.color, parentId: lab.parentId || 0};
  mode.value = 'edit';
}

function toggleAttach(id) {
  const i = attachSelected.value.indexOf(id);
  if (i >= 0) attachSelected.value.splice(i, 1);
  else attachSelected.value.push(id);
}

function openNestedCreate() {
  nestedForm.value = {name: '', color: '#1890ff', parentId: 0};
  nestedVisible.value = true;
}

async function submitNestedCreate() {
  if (!nestedForm.value.name.trim()) {
    ElMessage.warning(t('labelNameRequired'));
    return;
  }
  nestingSubmitting.value = true;
  try {
    const pid = Number(nestedForm.value.parentId) || 0;
    await labelStore.add(nestedForm.value.name.trim(), nestedForm.value.color, pid);
    ElMessage.success(t('saveSuccessMsg'));
    nestedVisible.value = false;
    // Refresh the label list in the attach view
    labelStore.fetch(true);
  } finally {
    nestingSubmitting.value = false;
  }
}

async function submit() {
  if (!form.value.name.trim()) {
    ElMessage.warning(t('labelName'));
    return;
  }
  submitting.value = true;
  try {
    const pid = Number(form.value.parentId) || 0;
    if (mode.value === 'create') {
      await labelStore.add(form.value.name.trim(), form.value.color, pid);
    } else {
      await labelStore.update(form.value.labelId, form.value.name.trim(), form.value.color, pid);
    }
    mode.value = 'list';
  } finally {
    submitting.value = false;
  }
}

async function submitAttach() {
  if (!attachEmailIds.value.length || !attachSelected.value.length) {
    visible.value = false;
    return;
  }
  submitting.value = true;
  try {
    if (attachEmailIds.value.length === 1) {
      // single email: replace label set with current selection
      await labelStore.setEmailLabels(attachEmailIds.value[0], attachSelected.value);
    } else {
      await labelStore.batchAttach(attachEmailIds.value, attachSelected.value);
    }
    ElMessage.success(t('labelAttachSuccess'));
    if (typeof attachOnDone.value === 'function') {
      attachOnDone.value(attachSelected.value);
    }
    visible.value = false;
  } finally {
    submitting.value = false;
  }
}

async function confirmDelete(lab) {
  await ElMessageBox.confirm(t('labelDeleteConfirmMsg'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).catch(() => null).then(async (r) => {
    if (r === 'confirm') {
      await labelStore.remove(lab.labelId);
      ElMessage.success(t('delSuccessMsg'));
    }
  });
}

function goLabel(lab) {
  visible.value = false;
  router.push({name: 'label', params: {labelId: lab.labelId}});
}

defineExpose({open});
</script>

<style scoped lang="scss">
.label-list {
  .empty {
    text-align: center;
    color: #999;
    padding: 20px 0;
  }
  .label-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 4px;
    border-bottom: 1px solid #f0f0f0;
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .name {
      flex: 1;
      cursor: pointer;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .actions {
      display: flex;
      gap: 10px;
      flex-shrink: 0;
      .icon {
        cursor: pointer;
        color: #666;
      }
      .icon:hover {
        color: #1890ff;
      }
    }
  }
  .attach-row {
    cursor: pointer;
  }
  .attach-row:hover {
    background: #f5f7fa;
  }
  .add-btn {
    width: 100%;
    margin-top: 12px;
  }
}

.color-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  .swatch {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    cursor: pointer;
    border: 1px solid #eee;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

@media (max-width: 767px) {
  :deep(.el-dialog) {
    width: 92% !important;
    max-width: 100vw !important;
    top: 4vh !important;
    margin: 0 auto !important;
  }
  :deep(.el-dialog__body) {
    padding: 12px 10px !important;
  }
  .label-list .label-row {
    padding: 6px 2px;
    gap: 6px;
    .name {
      font-size: 13px;
      max-width: 140px;
    }
  }
  .color-row {
    gap: 4px;
    .swatch {
      width: 20px;
      height: 20px;
    }
  }
  :deep(.el-form-item__label) {
    font-size: 13px;
  }
}
</style>

<style>
.label-dialog-popper {
  z-index: 5001 !important;
}
</style>
