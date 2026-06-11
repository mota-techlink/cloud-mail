<template>
  <el-scrollbar class="scroll">
    <div>
      <div class="title" >
        <Icon icon="mdi:email-outline" width="24" height="24" />
        <div>{{settingStore.settings.title}}</div>
      </div>
      <el-menu :collapse="false" text-color="#fff" active-text-color="#fff" style="margin-top: 10px">
        <el-menu-item @click="router.push({name: 'email'})" index="email"
                      :class="route.meta.name === 'email' ? 'choose-item' : ''">
          <Icon icon="hugeicons:mailbox-01" width="20" height="20" />
          <span class="menu-name" style="margin-left: 21px">{{$t('inbox')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'send'})" index="send" v-perm="'email:send'"
                      :class="route.meta.name === 'send' ? 'choose-item' : ''">
          <Icon icon="cil:send" width="20" height="20" />
          <span class="menu-name" style="margin-left: 21px">{{$t('sent')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'draft'})" index="draft" v-perm="'email:send'"
                      :class="route.meta.name === 'draft' ? 'choose-item' : ''">
          <Icon icon="ep:document" width="19" height="19" />
          <span class="menu-name" style="margin-left: 22px">{{$t('drafts')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'star'})" index="star"
                      :class="route.meta.name === 'star' ? 'choose-item' : ''">
          <Icon icon="solar:star-line-duotone" width="20" height="20" />
          <span class="menu-name" style="margin-left: 21px">{{$t('starred')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'archive'})" index="archive"
                      :class="route.meta.name === 'archive' ? 'choose-item' : ''">
          <Icon icon="hugeicons:archive-01" width="20" height="20" />
          <span class="menu-name" style="margin-left: 21px">{{$t('archive')}}</span>
        </el-menu-item>
        <div class="labels-group">
          <div class="labels-header" @click="labelsOpen = !labelsOpen">
            <Icon :icon="labelsOpen ? 'ep:arrow-down' : 'ep:arrow-right'" width="14" height="14" />
            <span class="labels-title">{{ $t('labels') }}</span>
          </div>
          <div v-show="labelsOpen" class="labels-list">
            <div
                v-for="lab in labelStore.labels"
                :key="lab.labelId"
                class="label-item"
                :class="String(route.params.labelId) === String(lab.labelId) ? 'choose-item' : ''"
                :style="{ paddingLeft: (12 + (lab.depth || 0) * 16) + 'px' }"
                @click="goLabelView(lab)"
            >
              <span class="label-dot" :style="{ background: lab.color }"></span>
              <span class="label-name">{{ lab.name }}</span>
              <Icon
                  class="label-go"
                  icon="ep:arrow-right-bold"
                  width="12"
                  height="12"
                  @click.stop="goLabelView(lab)"
              />
            </div>
            <div class="label-item add-item" @click="openCreateDialog">
              <Icon icon="ep:plus" width="14" height="14" />
              <span class="label-name">{{ $t('newLabel') }}</span>
            </div>
            <div class="label-item add-item" v-if="labelStore.labels.length" @click="openManageDialog">
              <Icon icon="ep:setting" width="14" height="14" />
              <span class="label-name">{{ $t('manageLabels') }}</span>
            </div>
          </div>
        </div>
        <el-menu-item @click="router.push({name: 'setting'})" index="setting"
                      :class="route.meta.name === 'setting' ? 'choose-item' : ''">
          <Icon icon="fluent:settings-48-regular" width="20" height="20" />
          <span class="menu-name" style="margin-left: 21px">{{$t('settings')}}</span>
        </el-menu-item>
        <div class="manage-title" v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']">
          <div>{{$t('manage')}}</div>
        </div>
        <el-menu-item @click="router.push({name: 'analysis'})" index="analysis" v-perm="'analysis:query'"
                      :class="route.meta.name === 'analysis' ? 'choose-item' : ''">
          <Icon icon="fluent:data-pie-20-regular" width="24" height="24" />
          <span class="menu-name" style="margin-left: 18px">{{$t('analytics')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'user'})" index="setting" v-perm="'user:query'"
                      :class="route.meta.name === 'user' ? 'choose-item' : ''">
          <Icon icon="si:user-alt-2-line" width="20" height="20" />
          <span class="menu-name" style="margin-left: 21px">{{$t('allUsers')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'all-email'})" index="all-email" v-perm="'all-email:query'"
                      :class="route.meta.name === 'all-email' ? 'choose-item' : ''">
          <Icon icon="fluent:mail-list-28-regular" width="22" height="22" />
          <span class="menu-name" style="margin-left: 20px">{{$t('allMail')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'role'})" index="setting" v-perm="'role:query'"
                      :class="route.meta.name === 'role' ? 'choose-item' : ''">
          <Icon icon="fluent:lock-closed-16-regular" width="22" height="22" />
          <span class="menu-name" style="margin-left: 20px">{{$t('permissions')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'reg-key'})" index="reg-key" v-perm="'reg-key:query'"
                      :class="route.meta.name === 'reg-key' ? 'choose-item' : ''">
          <Icon icon="fluent:fingerprint-20-filled" width="22" height="22" />
          <span class="menu-name" style="margin-left: 20px">{{$t('inviteCode')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'sys-setting'})" index="sys-setting" v-perm="'setting:query'"
                      :class="route.meta.name === 'sys-setting' ? 'choose-item' : ''">
          <Icon icon="eos-icons:system-ok-outlined" width="18" height="18" style="margin-left: 2px" />
          <span class="menu-name" style="margin-left: 22px">{{$t('SystemSettings')}}</span>
        </el-menu-item>
      </el-menu>
    </div>
    <labelDialog ref="labelDialogRef" />
  </el-scrollbar>
</template>

<script setup>
import router from "@/router/index.js";
import { useRoute } from "vue-router";
import {Icon} from "@iconify/vue";
import {useSettingStore} from "@/store/setting.js";
import {useLabelStore} from "@/store/label.js";
import {onMounted, ref} from "vue";
import labelDialog from "@/components/label-dialog/index.vue";

const settingStore = useSettingStore();
const labelStore = useLabelStore();
const route = useRoute();
const labelsOpen = ref(true);
const labelDialogRef = ref(null);

onMounted(() => {
  labelStore.fetch().catch(() => {});
});

function openCreateDialog() {
  labelDialogRef.value?.open('create');
}

function openManageDialog() {
  labelDialogRef.value?.open('list');
}

function editLabel(lab) {
  labelDialogRef.value?.open('edit', {label: lab});
}

function goLabelView(lab) {
  router.push({name: 'label', params: {labelId: lab.labelId}});
}

</script>

<style lang="scss" scoped>

.title {
  margin: 15px 10px;
  height: 45px;
  border-radius: 6px;
  display: flex;
  position: relative;
  font-size: 16px;
  font-weight: bold;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: #ffffff;
  background: linear-gradient(135deg, #1890ff, #3a80dd);
  transition: all 0.3s ease;
  max-width: 240px;
  padding: 0 10px;
  > div {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: calc(240px - 20px - 30px);
  }

  :deep(.el-icon) {
    flex-shrink: 0;
    font-size: 20px;
  }

  .user-right-icon {
    align-self: center;
    position: absolute;
    font-size: 12px;
    right: 8px;
    color: #ffffff;
  }

}


.manage-title {
  margin-top: 10px;
  padding-left: 20px;
  color: #fff;
}

.el-menu-item {
  margin: 5px 10px !important;
  border-radius: 6px;
  height: 36px;
  padding: 10px !important;
}

.choose-item {
  font-weight: bold;
  background: rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(4px);
}

@media (hover: hover) {
  .el-menu-item:hover {
    background: rgba(255, 255, 255, 0.08) !important;
  }
}

.menu-name {
  user-select: none;
}

.labels-group {
  margin: 8px 10px 0;
  color: #fff;
  .labels-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    cursor: pointer;
    border-radius: 6px;
    user-select: none;
    .labels-title {
      font-size: 13px;
      opacity: 0.8;
    }
  }
  .labels-header:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  .labels-list {
    .label-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 12px;
      margin: 2px 0;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      .label-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .label-name {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        flex: 1;
      }
      .label-go {
        opacity: 0;
        color: #fff;
        flex-shrink: 0;
        transition: opacity 0.15s ease-in-out;
      }
    }
    @media (hover: hover) {
      .label-item:hover .label-go {
        opacity: 0.7;
      }
      .label-item .label-go:hover {
        opacity: 1;
      }
    }
    .label-item:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .label-item.choose-item {
      background: rgba(255, 255, 255, 0.12);
      font-weight: bold;
    }
    .add-item {
      opacity: 0.85;
    }
  }
}


:deep(.el-scrollbar__wrap--hidden-default ) {
  background: var(--aside-backgound) !important;
}

:deep(.el-menu-item) {
  background: var(--aside-backgound);
}

:deep(.el-menu) {
  background: var(--aside-backgound);
}

.el-menu {
  border-right: 0;
  width: 260px;
}

:deep(.el-divider__text) {
  background: var(--aside-backgound);
  color: #FFFFFF;
}

.scroll {

}
</style>
