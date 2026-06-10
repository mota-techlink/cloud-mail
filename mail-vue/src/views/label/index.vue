<template>
  <emailScroll type="label" ref="scroll"
               :allow-star="true"
               :getEmailList="getList"
               :emailDelete="emailDelete"
               :star-add="starAdd"
               :star-cancel="starCancel"
               :email-archive="emailArchive"
               :email-unarchive="emailUnarchive"
               @jump="jumpContent"
               actionLeft="6px"
               :show-account-icon="false"
               :key="route.params.labelId"
  />
</template>

<script setup>
import emailScroll from "@/components/email-scroll/index.vue"
import {emailDelete, emailArchive, emailUnarchive} from "@/request/email.js";
import {starAdd, starCancel} from "@/request/star.js";
import {labelEmailList} from "@/request/label.js";
import {useEmailStore} from "@/store/email.js";
import {defineOptions, ref} from "vue";
import router from "@/router/index.js";
import {useRoute} from "vue-router";

defineOptions({
  name: 'label'
})

const scroll = ref({})
const emailStore = useEmailStore();
const route = useRoute();

function jumpContent(email) {
  emailStore.contentData.email = email
  emailStore.contentData.delType = 'logic'
  emailStore.contentData.showStar = true
  emailStore.contentData.showReply = true
  emailStore.contentData.showArchive = true
  router.push('/message')
}

function getList(emailId, size) {
  const labelId = Number(route.params.labelId);
  return labelEmailList(labelId, emailId, size).then(data => {
    return {
      list: data?.list || [],
      total: data?.list?.length || 0,
      latestEmail: { emailId: 0, accountId: 0, userId: 0 }
    }
  })
}
</script>
